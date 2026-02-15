<script>
import Map from './Map.svelte';
import Marker from './Marker.svelte';
import Connection from './Connection.svelte';
import DistanceMatrix from './DistanceMatrix.svelte';
import { marineState } from './state.svelte';

// Derived logic for lines
let connections = $derived.by(() => {
    const pairs = [];
    const locs = marineState.locations;
    for (let i = 0; i < locs.length; i++) {
        for (let j = i + 1; j < locs.length; j++) {
            pairs.push({
                i,
                j,
                id: `${locs[i].lat}-${locs[i].lng}-${locs[j].lat}-${locs[j].lng}`,
                coords: [
                    [locs[i].lat, locs[i].lng],
                    [locs[j].lat, locs[j].lng],
                ],
                color: locs[i].color,
            });
        }
    }
    return pairs;
});

function getLineStyle(i, j) {
    const indices = marineState.hoveredIndices;
    const isHighlighted =
        indices.length === 1 ? i === indices[0] || j === indices[0] : indices.includes(i) && indices.includes(j);

    return {
        weight: isHighlighted ? 5 : 2,
        opacity: isHighlighted ? 1 : 0.15,
        dashArray: isHighlighted ? null : '5, 5',
    };
}
</script>

<main>
    <div id="map-side">
        <Map>
            {#each marineState.locations as loc, i (loc)}
                <Marker {loc} index={i} />
            {/each}

            {#each connections as { i, j, coords, color, id } (id)}
                <Connection {coords} {color} style={getLineStyle(i, j)} />
            {/each}
        </Map>

        <div class="hud">
            <strong>Distance Matrix</strong>
            <p>📍 Click map to add marks</p>
            <button class="reset-btn" onclick={() => marineState.clearAll()}> Reset Session </button>
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
    font-family: sans-serif;
}

#map-side {
    flex: 1;
    position: relative;
}

.hud {
    position: absolute;
    right: 15px;
    bottom: 25px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 0.9em;
}

.reset-btn {
    width: 100%;
    cursor: pointer;
    background: #ff7675;
    color: white;
    border: none;
    padding: 8px;
    border-radius: 6px;
    font-weight: bold;
}
</style>
