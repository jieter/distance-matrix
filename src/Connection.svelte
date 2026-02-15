<script>
import { getContext, onMount, onDestroy } from 'svelte';
import L from 'leaflet';

let { coords, color, style } = $props();
const getMap = getContext('map-instance');
let polyline;

onMount(() => {
    const map = getMap();
    polyline = L.polyline(coords, { color, ...style }).addTo(map);
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
