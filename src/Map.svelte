<script lang="ts">
import { setContext, onMount } from 'svelte';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { marineState } from './state.svelte';

let { children } = $props();
let mapElement: HTMLElement;
let map = $state<L.Map | null>(null);

setContext('map-instance', () => map);

onMount(() => {
    map = L.map(mapElement!).setView([52.37, 4.89], 6);
    // Argument of type 'HTMLElement | null' is not assignable to parameter of type 'string | HTMLElement'.

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenSeaMap',
    }).addTo(map);

    map.on('click', (e) => {
        marineState.addMark(e.latlng);
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
