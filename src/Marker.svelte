<script lang="ts">
import { getContext, onMount, onDestroy } from 'svelte';
import L from 'leaflet';
import { marineState } from './state.svelte';

let { mark, index } = $props();
const getMap: () => L.Map = getContext('map-instance');
let marker: L.CircleMarker | null = null;

onMount(() => {
    const map = getMap();
    marker = L.circleMarker([mark.lat, mark.lng], {
        radius: 7,
        fillColor: mark.color,
        fillOpacity: 1,
        color: 'white',
        weight: 2,
        interactive: true,
    })
        .addTo(map)
        .bindTooltip(mark.name);

    marker.on('drag', (e) => {
        const { lat, lng } = e.target.getLatLng();
        // Use the state method instead of mutating the prop
        marineState.updateMarkPosition(index, lat, lng);
    });

    marker.on('dragend', () => {
        if (mark.isAutoNamed) {
            marineState.reverseGeocode(index);
        }
    });
});

// Effect: Update Leaflet position when state changes (e.g., from the table)
$effect(() => {
    if (marker) {
        marker.setLatLng([mark.lat, mark.lng]);
    }
});

// Effect: Update Tooltip when name changes
$effect(() => {
    if (marker) {
        marker.setTooltipContent(mark.name);
    }
});

onDestroy(() => {
    if (marker) marker.remove();
});
</script>
