<script>
    import { marineState, distance } from './state.svelte';
</script>

<div id="table-side">
    <table>
        <thead>
            <tr>
                <th>Location</th>
                {#each marineState.locations as loc, j}
                    <th class:highlight-header={marineState.hoveredIndices.includes(j)} style="color: {loc.color}">
                        <span class="vertical-text">{loc.name}</span>
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each marineState.locations as loc, i}
                <tr class:highlight-row={marineState.hoveredIndices.includes(i)}>
                    <td
                        style="border-left: 6px solid {loc.color}"
                        onmouseenter={() => marineState.setHover(i)}
                        onmouseleave={() => marineState.clearHover()}>
                        <div class="name-row">
                            {#if loc.loading}<div class="loader"></div>{/if}
                            <input
                                class:is-loading={loc.loading}
                                bind:value={loc.name}
                                oninput={() => {
                                    loc.isAutoNamed = false;
                                    loc.marker?.setTooltipContent(loc.name);
                                }} />
                            <button class="del" onclick={() => marineState.removeLocation(i)} aria-label="Delete">
                                &times;
                            </button>
                        </div>
                    </td>

                    {#each marineState.locations as colLoc, j}
                        <td
                            class:diagonal={i === j}
                            class:dist={i !== j}
                            class:highlight-cell={marineState.hoveredIndices.includes(i) &&
                                marineState.hoveredIndices.includes(j) &&
                                i !== j}
                            onmouseenter={() => i !== j && marineState.setHover(i, j)}
                            onmouseleave={() => marineState.clearHover()}>
                            {i === j ? '-' : distance(loc, colLoc)}
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
/* ... basic table styles remain the same ... */
#table-side { flex: 1; overflow: auto; padding: 20px; background: #fff; }
table { border-collapse: collapse; margin-top: 20px; } /* Removed huge margin */
th, td { border: 1px solid #e0e6ed; padding: 8px; text-align: center; }

/* The Fix: Vertical Headers */
thead th:not(:first-child) {
    vertical-align: bottom;
    padding: 10px 5px;
    height: 150px; /* Control vertical height here */
}

.vertical-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg); /* Flip to read bottom-to-top */
    white-space: nowrap;
    font-weight: bold;
    display: inline-block;
}

/* Simplified Row/Cell Highlight logic */
.highlight-row, .highlight-header { background-color: #f8f9fa; }
.highlight-cell { background-color: #e9ecef !important; outline: 1px solid #dee2e6; }

.name-row { display: flex; align-items: center; gap: 8px; }
.name-row input { border: none; font-weight: bold; outline: none; width: 100%; background: transparent; }

.del { background: #ff7675; border: none; color: white; border-radius: 4px; cursor: pointer; width: 20px; height: 20px; }
.diagonal { color: #ced4da; background: #f8f9fa; }
.dist { font-family: 'Courier New', monospace; font-weight: bold; }

/* Loader styles... */
.loader { width: 12px; height: 12px; border: 2px solid #ccc; border-top-color: #3498db; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
input.is-loading { color: #95a5a6; font-style: italic; }
</style>