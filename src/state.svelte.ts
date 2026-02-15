import L from 'leaflet';

const METERS_TO_NM = 0.000539957;

class MarineState {
    locations = $state(JSON.parse(localStorage.getItem('marine_locations') || '') || []);
    hoveredIndices = $state([]);

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

    addLocation(latlng, color) {
        const index = this.locations.length;
        const newLoc = {
            name: `Mark ${index + 1}`,
            lat: latlng.lat,
            lng: latlng.lng,
            color,
            isAutoNamed: true,
            loading: false,
            marker: null,
        };
        this.locations.push(newLoc);
        // Attempt naming the mark using a geocoder.
        this.reverseGeocode(index);
    }

    removeLocation(index) {
        const loc = this.locations[index];
        if (loc.marker) loc.marker.remove();
        this.locations.splice(index, 1);
    }

    updateLocationPos(index, lat, lng) {
        this.locations[index].lat = lat;
        this.locations[index].lng = lng;
    }

    setHover(i, j = null) {
        this.hoveredIndices = j !== null ? [i, j] : [i];
    }

    clearHover() {
        this.hoveredIndices = [];
    }
    clearAll() {
        this.locations = [];
    }

    getDistance(locA, locB) {
        const dist = L.latLng(locA.lat, locA.lng).distanceTo(L.latLng(locB.lat, locB.lng));
        return Math.round(dist * METERS_TO_NM);
    }

    async reverseGeocode(index) {
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
