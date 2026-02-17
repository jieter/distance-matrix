<script lang="ts">
import Map from './Map.svelte';
import Marker from './Marker.svelte';
import Connection from './Connection.svelte';
import DistanceMatrix from './DistanceMatrix.svelte';
import { marineState } from './state.svelte';

// Connections between marks (excluding those which are disabled)
let connections = $derived.by(() => {
    const pairs = [];
    const marks = marineState.marks;

    for (let i = 0; i < marks.length; i++) {
        for (let j = i + 1; j < marks.length; j++) {
            if (!marineState.isLegDisabled(i, j)) {
                const coords = [
                    [marks[i].lat, marks[i].lng],
                    [marks[j].lat, marks[j].lng],
                ];
                pairs.push({ i, j, id: `line-${i}-${j}`, coords: coords });
            }
        }
    }
    return pairs;
});

function getDynamicStyle(i: number, j: number) {
    const indices = marineState.hoveredIndices;
    let isHighlighted = false;
    let targetColor = '#222';

    if (indices.length === 1) {
        // Highlight all outgoing connections from a mark (when hovering the name of mark in the table)
        const hovered = indices[0];
        if (i === hovered || j === hovered) {
            isHighlighted = true;
            const targetIndex = i === hovered ? j : i;
            targetColor = marineState.marks[targetIndex].color;
        }
    } else if (indices.length === 2) {
        // Highlighting a specific connection (when hovering a cell in the table)
        if (indices.includes(i) && indices.includes(j)) {
            isHighlighted = true;
            targetColor = marineState.marks[j].color;
        }
    }

    return {
        color: targetColor,
        weight: isHighlighted ? 4 : 1,
        opacity: isHighlighted ? 1 : 0.6,
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
