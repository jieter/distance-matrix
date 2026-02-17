<script lang="ts">
import Map from './Map.svelte';
import Marker from './Marker.svelte';
import Connection from './Connection.svelte';
import DistanceMatrix from './DistanceMatrix.svelte';
import { marineState } from './state.svelte';

// Derived logic for lines
let connections = $derived.by(() => {
    const pairs = [];
    const locs = marineState.marks;

    for (let i = 0; i < locs.length; i++) {
        for (let j = i + 1; j < locs.length; j++) {
            // Only add the connection if it's NOT disabled
            if (!marineState.isLegDisabled(i, j)) {
                pairs.push({
                    i,
                    j,
                    id: `line-${i}-${j}`,
                    coords: [
                        [locs[i].lat, locs[i].lng],
                        [locs[j].lat, locs[j].lng],
                    ],
                });
            }
        }
    }
    return pairs;
});

function getDynamicStyle(i: number, j: number) {
    const indices = marineState.hoveredIndices;
    let isHighlighted = false;
    let targetColor = '#3388ff'; // Default Leaflet Blue

    if (indices.length === 1) {
        const hovered = indices[0];
        if (i === hovered || j === hovered) {
            isHighlighted = true;
            // The magic line: pick the color of the node that isn't the hovered one
            const targetIdx = i === hovered ? j : i;
            targetColor = marineState.marks[targetIdx].color;
        }
    } else if (indices.length === 2) {
        // Highlighting a specific cell in the table
        if (indices.includes(i) && indices.includes(j)) {
            isHighlighted = true;
            // In a cell hover, we usually treat the column (j) as the destination
            targetColor = marineState.marks[j].color;
        }
    }

    return {
        color: targetColor,
        weight: isHighlighted ? 4 : 1,
        opacity: isHighlighted ? 1 : 0.4,
        dashArray: isHighlighted ? null : '5, 3',
    };
}
</script>

<main>
    <div id="map-side">
        <Map>
            {#each connections as conn (conn.id)}
                <Connection coords={conn.coords} style={getDynamicStyle(conn.i, conn.j)} />
            {/each}
            {#each marineState.marks as mark, i (mark)}
                <Marker {mark} index={i} />
            {/each}
        </Map>
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
</style>
