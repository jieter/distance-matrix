<script>
import { getContext, onMount, onDestroy } from 'svelte';
import L from 'leaflet';
import { marineState } from './state.svelte';

let { loc, index } = $props();
const getMap = getContext('map-instance');
let markerInstance;

onMount(() => {
    const map = getMap();
    markerInstance = L.marker([loc.lat, loc.lng], {
        draggable: true,
        icon: L.divIcon({
            className: '',
            html: `<div style="background-color:${loc.color}; width:14px; height:14px; border:2px solid white; border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
        }),
    })
        .addTo(map)
        .bindTooltip(loc.name);

    markerInstance.on('drag', (e) => {
        const { lat, lng } = e.target.getLatLng();
        // Use the state method instead of mutating the prop
        marineState.updateLocationPos(index, lat, lng);
    });

    markerInstance.on('dragend', () => {
        if (loc.isAutoNamed) marineState.reverseGeocode(index);
    });
});

// Effect: Update Leaflet position when state changes (e.g., from the table)
$effect(() => {
    if (markerInstance) {
        markerInstance.setLatLng([loc.lat, loc.lng]);
    }
});

// Effect: Update Tooltip when name changes
$effect(() => {
    if (markerInstance) {
        markerInstance.setTooltipContent(loc.name);
    }
});

onDestroy(() => {
    if (markerInstance) markerInstance.remove();
});
</script>
