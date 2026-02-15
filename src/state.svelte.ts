export type Coord = { lat: number; lng: number };

// Distance in nautical miles
export function distance(coord1: Coord, coord2: Coord): number {
    const R = 3440.065; // Earth's mean radius in Nautical Miles

    const toRad = (deg: number): number => (deg * Math.PI) / 180;

    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);

    const a =
        Math.sin(dLat / 2) ** 2 + Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}
class MarineState {
    locations = $state(JSON.parse(localStorage.getItem('marine_locations') || '') || []);
    hoveredIndices = $state<number[]>([]);

    constructor() {
        // Persist state to localStorage automatically
        $effect.root(() => {
            $effect(() => {
                const data = this.locations.map(({ name, lat, lng, color }) => ({
                    name,
                    lat,
                    lng,
                    color,
                }));
                localStorage.setItem('marine_locations', JSON.stringify(data));
            });
        });
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
        // Attempt naming the mark using a geocoder.
        this.reverseGeocode(index);
    }

    removeLocation(index: number) {
        const loc = this.locations[index];
        if (loc.marker) loc.marker.remove();
        this.locations.splice(index, 1);
    }

    updateLocationPos(index: number, lat: Number, lng: Number) {
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
        return `hsl(${Math.random() * 360}, 70%, 45%)`;
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
                console.log(data);
                const newName = address.city || address.water || address.town || address.state || loc.name;

                loc.name = newName;
                loc.marker?.setTooltipContent(newName);
            }

            // Sync the Leaflet marker tooltip if it exists
        } catch (err) {
            console.error('Geocoding error:', err);
        } finally {
            loc.loading = false;
        }
    }
}

// Export a single instance to be used throughout the app
export const marineState = new MarineState();
