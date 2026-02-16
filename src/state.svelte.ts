export type Coord = {
    lat: number;
    lng: number;
};
export type Location = Coord & {
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
    '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
    '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9'
];

class MarineState {
    locations = $state<Location[]>(this.#loadFromHash());
    hoveredIndices = $state<number[]>([]);

    constructor() {
        $effect.root(() => {
            $effect(() => {
                const serialized = this.locations.map(l => {
                    if (l == null){
                        return '';
                    }
                    const name = l.isAutoNamed ? `*${l.name}` : l.name;
                    const escapedName = name.replace(/\\/g, '\\\\')
                                            .replace(/;/g, '\\;')
                                            .replace(/\|/g, '\\|');

                    const lat = l.lat.toFixed(4);
                    const lng = l.lng.toFixed(4);
                    const colorIdx = PALETTE.indexOf(l.color);
                    const c = colorIdx === -1 ? 0 : colorIdx;

                    return `${escapedName};${lat};${lng};${c}`;
                }).join('|');

                const newHash = serialized ? `#${encodeURI(serialized)}` : '';
                window.history.replaceState(null, '', window.location.pathname + newHash);
            });
        });
        window.addEventListener('hashchange', () => {
            const newLocs = this.#loadFromHash();
            if (this.#isDifferent(newLocs)) {
                this.locations = newLocs;
            }
        });
    }

    #loadFromHash(): Location[] {
        try {
            const hash = decodeURI(window.location.hash.slice(1));
            if (!hash) return [];
            const waypointStrings = hash.split(/(?<!\\)\|/);
            return waypointStrings.map(str => {
                // Split by ; only if NOT preceded by \
                const parts = str.split(/(?<!\\);/);
                if (parts.length < 4) return null;

                let [rawName, lat, lng, colorIdx] = parts;
                rawName = rawName.replace(/\\;/g, ';')
                                 .replace(/\\\|/g, '|')
                                 .replace(/\\\\/g, '\\');

                const isAuto = rawName.startsWith('*');
                return {
                    name: isAuto ? rawName.slice(1) : rawName,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    color: PALETTE[parseInt(colorIdx)] || PALETTE[0],
                    isAutoNamed: isAuto,
                    loading: false,
                    marker: null
                };
            }).filter((loc): loc is Location => loc !== null);
        } catch (e) {
            return [];
        }
    }

    // Helper to prevent infinite loops during state sync
    #isDifferent(newLocs: Location[]): boolean {
        if (newLocs.length !== this.locations.length) return true;

        const serialize = (l: Location) => `${l.name}-${l.lat}-${l.lng}`;

        return newLocs.some((location, i) => {
            const current = this.locations[i];
            // Standard guard clause for the 'null' error
            if (!location || !current) return location !== current;
            return serialize(location) !== serialize(current);
        });
    }

    addLocation(latlng: Coord): void {
        const index = this.locations.length;
        const newLoc = {
            name: `Mark ${index + 1}`,
            lat: latlng.lat,
            lng: latlng.lng,
            color: this.#generateColor(),
            isAutoNamed: true,
            loading: false,
            marker: null,
        };
        this.locations.push(newLoc);
        this.reverseGeocode(index);
    }

    removeLocation(index: number): void {
        const loc = this.locations[index];
        if (loc.marker) loc.marker.remove();
        this.locations.splice(index, 1);
    }

    updateLocationPos(index: number, lat: number, lng: number) {
        this.locations[index].lat = lat;
        this.locations[index].lng = lng;
    }

    setHover(i: number, j: number | null = null) {
        this.hoveredIndices = j !== null ? [i, j] : [i];
    }

    clearHover() {
        this.hoveredIndices = [];
    }

    clearAll() {
        this.locations = [];
    }

    #generateColor() {
        // Pick a random color from the fixed palette
        return PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }

    async reverseGeocode(index: number) {
        const loc = this.locations[index];
        if (!loc) return;

        loc.loading = true;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`,
            );
            const data = await res.json();
            if (data.address) {
                const address = data.address;
                const newName = address.city || address.water || address.town || address.state || loc.name;

                loc.name = newName;
                loc.marker?.setTooltipContent(newName);
            }
        } catch (err) {
            console.error('Geocoding error:', err);
        } finally {
            loc.loading = false;
        }
    }
}

export const marineState = new MarineState();