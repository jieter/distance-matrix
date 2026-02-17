<script lang="ts">
import { getContext, onMount, onDestroy } from 'svelte';
import L from 'leaflet';

let { coords, style } = $props();
const getMap: () => L.Map = getContext('map-instance');
let polyline: L.Polyline | null = null;

onMount(() => {
    const map = getMap();
    polyline = L.polyline(coords, { ...style }).addTo(map);
});

// Reactively update the line when coordinates or style changes
$effect(() => {
    if (polyline) {
        polyline.setLatLngs(coords);
        polyline.setStyle(style);
        if (style.weight > 2) polyline.bringToFront();
    }
});

onDestroy(() => {
    if (polyline) polyline.remove();
});
</script>
