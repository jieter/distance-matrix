<script lang="ts">
import Map from './Map.svelte';
import Marker from './Marker.svelte';
import Connection from './Connection.svelte';
import DistanceMatrix from './DistanceMatrix.svelte';
import { marineState } from './state.svelte';
import type { PathOptions } from 'leaflet';

// Connections between marks (excluding those which are disabled), with derived style
let connections = $derived.by(() => {
    const pairs = [];
    const marks = marineState.marks;

    for (let i = 0; i < marks.length; i++) {
        for (let j = i + 1; j < marks.length; j++) {
            if (!marineState.isLegDisabled(i, j)) {
                pairs.push({
                    id: `line-${i}-${j}`,
                    coords: [
                        [marks[i].lat, marks[i].lng],
                        [marks[j].lat, marks[j].lng],
                    ],
                    style: getConnectionStyle(i, j),
                });
            }
        }
    }
    return pairs;
});

function getConnectionStyle(i: number, j: number): PathOptions {
    const indices = marineState.hoveredIndices;
    let isHighlighted = false;
    let targetColor = '#222';

    if (indices.length === 1) {
        // Highlight all outgoing connections from a mark (when hovering the name of mark in the table)
        const hovered = indices[0];
        if (i === hovered || j === hovered) {
            isHighlighted = true;
            targetColor = marineState.marks[i === hovered ? j : i].color;
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
        dashArray: isHighlighted ? undefined : '5, 3',
    };
}
</script>

<main>
    <div id="map-side">
        <Map>
            {#each connections as conn (conn.id)}
                <Connection coords={conn.coords} style={conn.style} />
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

@media (max-width: 768px) {
    main {
        flex-direction: column;
    }

    #map-side {
        flex: 1;
        min-height: 0;
    }
}
</style>
