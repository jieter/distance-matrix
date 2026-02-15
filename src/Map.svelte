<script>
import { setContext, onMount } from 'svelte';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { marineState } from './state.svelte';

let { children } = $props();
let mapElement;
let map = $state(null);

setContext('map-instance', () => map);

onMount(() => {
    map = L.map(mapElement).setView([52.37, 4.89], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenSeaMap',
    }).addTo(map);

    map.on('click', (e) => {
        const color = `hsl(${Math.random() * 360}, 70%, 45%)`;
        marineState.addLocation(e.latlng, color);
    });
});
</script>

<div bind:this={mapElement} id="map">
    {#if map}
        {@render children()}
    {/if}
</div>

<style>
#map {
    height: 100%;
    width: 100%;
    background: #aad3df;
}
</style>
