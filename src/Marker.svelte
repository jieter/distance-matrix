<script lang="ts">
import { getContext, onMount, onDestroy } from 'svelte';
import L from 'leaflet';
import { marineState } from './state.svelte';

let { mark, index } = $props();
const getMap: () => L.Map = getContext('map-instance');
let marker: L.Marker | null = null;

onMount(() => {
    const map = getMap();

    const icon = L.divIcon({
        className: '',
        html: `<div class="circle-marker" style="background:${mark.color}"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        tooltipAnchor: [0, -9],
    });

    marker = L.marker([mark.lat, mark.lng], { icon, draggable: true })
        .addTo(map)
        .bindTooltip(mark.name, { permanent: false, direction: 'top' });

    marker.on('drag', (e) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
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
