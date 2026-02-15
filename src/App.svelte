<script>
import { onMount } from 'svelte';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { marineState } from './state.svelte';
import DistanceMatrix from './DistanceMatrix.svelte';

let mapElement;
let map = $state(null);
let linesLayer;
let lines = {};

// Effect: Sync map line styles whenever hover state changes
$effect(() => {
    const indices = marineState.hoveredIndices;
    Object.keys(lines).forEach((key) => {
        const [i, j] = key.split('-').map(Number);

        // Determine if this specific line should be highlighted
        const isHighlighted =
            indices.length === 1 ? i === indices[0] || j === indices[0] : indices.includes(i) && indices.includes(j);

        if (lines[key]) {
            const baseColor = marineState.locations[Math.min(i, j)]?.color || '#666';
            lines[key].setStyle({
                weight: isHighlighted ? 5 : 2,
                opacity: isHighlighted ? 1 : 0.15,
                dashArray: isHighlighted ? null : '5, 5',
            });
            if (isHighlighted) lines[key].bringToFront();
        }
    });
});

onMount(() => {
    map = L.map(mapElement).setView([52.37, 4.89], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors',
    }).addTo(map);

    linesLayer = L.layerGroup().addTo(map);

    map.on('click', async (e) => {
        const color = `hsl(${Math.random() * 360}, 70%, 45%)`;
        marineState.addLocation(e.latlng, color, true);
        refreshMarkers();
    });

    if (marineState.locations.length > 0) refreshMarkers();
});

function createMarker(loc, index) {
    const marker = L.marker([loc.lat, loc.lng], {
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

    marker.on('drag', (e) => {
        const { lat, lng } = e.target.getLatLng();
        marineState.updateLocationPos(index, lat, lng);
        drawLines();
    });
    marker.on('dragend', () => {
        if (marineState.locations[index].isAutoNamed) {
            marineState.reverseGeocode(index);
        }
    });

    return marker;
}

function drawLines() {
    linesLayer.clearLayers();
    lines = {};
    const locs = marineState.locations;

    for (let i = 0; i < locs.length; i++) {
        for (let j = i + 1; j < locs.length; j++) {
            const poly = L.polyline(
                [
                    [locs[i].lat, locs[i].lng],
                    [locs[j].lat, locs[j].lng],
                ],
                {
                    color: locs[i].color,
                    weight: 2,
                    opacity: 0.15,
                    dashArray: '5, 5',
                },
            ).addTo(linesLayer);

            lines[`${i}-${j}`] = lines[`${j}-${i}`] = poly;
        }
    }
}

function refreshMarkers() {
    marineState.locations.forEach((loc, i) => {
        if (loc.marker) map.removeLayer(loc.marker);
        loc.marker = createMarker(loc, i);
    });
    drawLines();
}

function handleReset() {
    if (confirm('Clear all nautical data?')) {
        marineState.locations.forEach((l) => l.marker && map.removeLayer(l.marker));
        marineState.locations = [];
        linesLayer.clearLayers();
        localStorage.removeItem('marine_locations');
        marineState.clearHover();
    }
}
</script>

<main>
    <div id="map-side">
        <div bind:this={mapElement} id="map"></div>

        <div class="hud">
            <strong>Distance Matrix</strong>
            <p>📍 Click map to add marks</p>
            <button class="reset-btn" onclick={handleReset}>Reset Session</button>
        </div>
    </div>

    <DistanceMatrix />
</main>

<style>
main {
    display: flex;
    width: 100vw;
    height: 100vh;
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#map-side {
    flex: 1;
    position: relative;
    border-right: 2px solid #ddd;
}

#map {
    height: 100%;
    width: 100%;
    background: #aad3df;
}

.hud {
    position: absolute;
    right: 15px;
    bottom: 25px; /* Adjusted slightly from 55px for better fit */
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 0.9em;
    min-width: 180px;
}

.hud strong {
    display: block;
    margin-bottom: 5px;
    color: #2d3436;
    font-size: 1.1em;
}

.hud p {
    margin: 0 0 10px 0;
    color: #636e72;
}

.reset-btn {
    width: 100%;
    cursor: pointer;
    background: #ff7675; /* Switched to red to signal destructive action */
    color: white;
    border: none;
    padding: 8px;
    border-radius: 6px;
    font-weight: bold;
    transition: background 0.2s;
}

.reset-btn:hover {
    background: #d63031;
}
</style>
