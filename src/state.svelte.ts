export type Coord = {
    lat: number;
    lng: number;
};
export type Mark = Coord & {
    name: string;
    lat: number;
    lng: number;
    color: string;
    isAutoNamed: boolean;
    loading: boolean;
    marker: any;
};

// Distance in nautical miles
export function distance(coord1: Coord, coord2: Coord): number {
    const R = 3440.065;
    const toRad = (deg: number): number => (deg * Math.PI) / 180;
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    const a =
        Math.sin(dLat / 2) ** 2 + Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}
const PALETTE = [
    '#e6194B',
    '#3cb44b',
    '#ffe119',
    '#4363d8',
    '#f58231',
    '#911eb4',
    '#42d4f4',
    '#f032e6',
    '#bfef45',
    '#fabed4',
    '#469990',
    '#dcbeff',
    '#9A6324',
    '#fffac8',
    '#800000',
    '#aaffc3',
    '#808000',
    '#ffd8b1',
    '#000075',
    '#a9a9a9',
];

export class URLSerializer {
    static SEPARATOR = '_';
    static SEGMENT_SEP = ';';
    static DISABLED_PREFIX = '~';

    static serialize(marks: Mark[], disabledLegs: Set<string>): string {
        const serializedMarks = marks.map((l) => {
            const namePrefix = l.isAutoNamed ? '*' : '';
            const safeName = encodeURIComponent(l.name);
            const colorIdx = PALETTE.indexOf(l.color);
            return `${namePrefix}${safeName}${this.SEGMENT_SEP}${l.lat.toFixed(4)}${this.SEGMENT_SEP}${l.lng.toFixed(4)}${this.SEGMENT_SEP}${colorIdx === -1 ? 0 : colorIdx}`;
        });

        const serializedDisabled = Array.from(disabledLegs).map((key) => `${this.DISABLED_PREFIX}${key}`);

        return [...serializedMarks, ...serializedDisabled].join(this.SEPARATOR);
    }

    static fromHash(): { marks: Mark[]; disabledLegs: Set<string> } {
        const hash = window.location.hash.slice(1);
        return this.deserialize(hash);
    }

    static deserialize(hash: string): { marks: Mark[]; disabledLegs: Set<string> } {
        const marks: Mark[] = [];
        const disabledLegs = new Set<string>();

        if (!hash) return { marks: marks, disabledLegs };

        // Handle URL decoding and split by primary separator
        const parts = decodeURIComponent(hash).split(this.SEPARATOR);

        parts.forEach((str) => {
            if (str.startsWith(this.DISABLED_PREFIX)) {
                disabledLegs.add(str.slice(1));
            } else {
                const segments = str.split(this.SEGMENT_SEP);
                if (segments.length < 4) return;

                const [rawName, lat, lng, colorIdx] = segments;
                const isAuto = rawName.startsWith('*');
                const cleanName = decodeURIComponent(isAuto ? rawName.slice(1) : rawName);

                marks.push({
                    name: cleanName,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    color: PALETTE[parseInt(colorIdx)] || PALETTE[0],
                    isAutoNamed: isAuto,
                    loading: false,
                    marker: null,
                });
            }
        });

        return { marks: marks, disabledLegs };
    }
}

class MarineState {
    marks = $state<Mark[]>([]);
    hoveredIndices = $state<number[]>([]);
    disabledLegs = $state<Set<string>>(new Set());

    constructor() {
        const { marks, disabledLegs } = URLSerializer.fromHash();
        this.marks = marks;
        this.disabledLegs = disabledLegs;

        $effect.root(() => {
            $effect(() => {
                const combined = URLSerializer.serialize(this.marks, this.disabledLegs);

                // Only update history if there is actually data, or if it was cleared manually
                const newHash = combined ? `#${combined}` : '';
                if (window.location.hash !== newHash) {
                    window.history.replaceState(null, '', window.location.pathname + newHash);
                }
            });
        });

        window.addEventListener('hashchange', () => {
            const { marks: newMarks, disabledLegs: newDisabled } = URLSerializer.fromHash();
            if (this.#isDifferent(newMarks)) {
                this.marks = newMarks;
            }
            this.disabledLegs = newDisabled;
        });
    }

    // Helper to prevent infinite loops during state sync
    #isDifferent(other: Mark[]): boolean {
        if (other.length !== this.marks.length) return true;

        const serialize = (l: Mark) => `${l.name}-${l.lat}-${l.lng}`;

        return other.some((mark, i) => {
            const current = this.marks[i];
            // Standard guard clause for the 'null' error
            if (!mark || !current) return mark !== current;
            return serialize(mark) !== serialize(current);
        });
    }

    addMark(latlng: Coord): void {
        const index = this.marks.length;
        const newLoc = {
            name: `Mark ${index + 1}`,
            lat: latlng.lat,
            lng: latlng.lng,
            color: this.#getNextAvailableColor(),
            isAutoNamed: true,
            loading: false,
            marker: null,
        };
        this.marks.push(newLoc);
        this.reverseGeocode(index);
    }

    removeLocation(index: number): void {
        const loc = this.marks[index];
        if (loc.marker) loc.marker.remove();
        this.marks.splice(index, 1);
    }

    updateMarkPosition(index: number, lat: number, lng: number) {
        this.marks[index].lat = lat;
        this.marks[index].lng = lng;
    }

    setHover(i: number, j: number | null = null) {
        this.hoveredIndices = j !== null ? [i, j] : [i];
    }

    clearHover() {
        this.hoveredIndices = [];
    }

    clearAll() {
        this.marks = [];
    }

    #getNextAvailableColor(): string {
        const usedColors = new Set(this.marks.map((l) => l.color));
        const nextColor = PALETTE.find((color) => !usedColors.has(color));
        return nextColor || PALETTE[this.marks.length % PALETTE.length];
    }
    toggleLeg(i: number, j: number) {
        const key = this.#getLegKey(i, j);

        // Create a new Set to trigger Svelte's reactivity
        const nextSet = new Set(this.disabledLegs);

        if (nextSet.has(key)) {
            nextSet.delete(key);
        } else {
            nextSet.add(key);
        }

        this.disabledLegs = nextSet;
    }

    isLegDisabled(i: number, j: number): boolean {
        return this.disabledLegs.has(this.#getLegKey(i, j));
    }

    #getLegKey(i: number, j: number): string {
        const [min, max] = [i, j].sort((a, b) => a - b);
        return `${min}-${max}`;
    }

    async reverseGeocode(index: number) {
        const location = this.marks[index];
        if (!location) return;

        location.loading = true;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`,
            );
            const data = await res.json();
            if (data.address) {
                const address = data.address;
                const newName = address.city || address.water || address.town || address.state || location.name;

                location.name = newName;
                location.marker?.setTooltipContent(newName);
            }
        } catch (err) {
            console.error('Geocoding error:', err);
        } finally {
            location.loading = false;
        }
    }
}

export const marineState = new MarineState();
