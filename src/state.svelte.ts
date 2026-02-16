export type Coord = { lat: number; lng: number };

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
    locations = $state(this.#loadFromHash());
    hoveredIndices = $state<number[]>([]);

    constructor() {
        $effect.root(() => {
            $effect(() => {
                const serialized = this.locations.map(l => {
                    const name = l.isAutoNamed ? `*${l.name}` : l.name;
                    const lat = l.lat.toFixed(4);
                    const lng = l.lng.toFixed(4);
                    // Store only the index of the color in our palette
                    const colorIdx = PALETTE.indexOf(l.color);
                    const c = colorIdx === -1 ? 0 : colorIdx;

                    return `${name};${lat};${lng};${c}`;
                }).join('|');

                const path = window.location.pathname;
                const newHash = serialized ? `#${encodeURI(serialized)}` : '';
                window.history.replaceState(null, '', path + newHash);
            });
        });

        window.addEventListener('hashchange', () => {
            const newLocs = this.#loadFromHash();
            if (this.#isDifferent(newLocs)) this.locations = newLocs;
        });
    }

    #loadFromHash() {
        try {
            const hash = decodeURI(window.location.hash.slice(1));
            if (!hash) return [];

            return hash.split('|').map(str => {
                const [rawName, lat, lng, colorIdx] = str.split(';');
                const isAuto = rawName.startsWith('*');
                return {
                    name: isAuto ? rawName.slice(1) : rawName,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    // Retrieve hex from palette using the index
                    color: PALETTE[parseInt(colorIdx)] || PALETTE[0],
                    isAutoNamed: isAuto,
                    loading: false,
                    marker: null
                };
            });
        } catch (e) {
            return [];
        }
    }

    // Helper to prevent infinite loops during state sync
    #isDifferent(newLocs: any[]) {
        return JSON.stringify(newLocs.map(l => l.name + l.lat + l.lng)) !==
              JSON.stringify(this.locations.map(l => l.name + l.lat + l.lng));
    }

    addLocation(latlng: Coord) {
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

    removeLocation(index: number) {
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