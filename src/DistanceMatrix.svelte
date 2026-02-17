<script lang="ts">
import { marineState, distance } from './state.svelte';

let speed = $state(5);

function formatTtg(dog: number, sog: number) {
    if (!sog || sog <= 0) return '--';
    const totalHours = dog / sog;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60)
        .toString()
        .padStart(2, '0');
    return `${h}:${m}`;
}
</script>

<div id="table-container">
    <div id="table-side">
        <table>
            <thead>
                <tr>
                    <th>SOG/TTG matrix</th>
                    {#each marineState.marks as loc, j}
                        <th
                            class:highlight-header={marineState.hoveredIndices.includes(j)}
                            style="border-top: 6px solid {loc.color};"
                            onmouseenter={() => marineState.setHover(j)}
                            onmouseleave={() => marineState.clearHover()}>
                            <span class="vertical-text">{loc.name}</span>
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each marineState.marks as loc, i}
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

                        {#each marineState.marks as colLoc, j}
                            {@const distValue = distance(loc, colLoc)}
                            {@const isDisabled = marineState.isLegDisabled(i, j)}
                            <td
                                class:diagonal={i === j}
                                class:dist={i !== j}
                                class:is-disabled={isDisabled}
                                class:highlight-cell={marineState.hoveredIndices.includes(i) &&
                                    marineState.hoveredIndices.includes(j) &&
                                    i !== j}
                                onmouseenter={() => i !== j && marineState.setHover(i, j)}
                                onmouseleave={() => marineState.clearHover()}
                                onclick={() => i !== j && marineState.toggleLeg(i, j)}>
                                {#if i === j}
                                    <span class="diagonal-mark">-</span>
                                {:else if isDisabled}
                                    <span class="void">X</span>
                                {:else}
                                    <div class="cell-content">
                                        <div class="dist-val">{distValue}</div>
                                        <div class="time-val">{formatTtg(distValue, speed)}</div>
                                    </div>
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <div class="controls">
        <label>
            Mean SOG:
            <input type="number" bind:value={speed} min="0.1" step="0.5" />
            <span class="unit">kts</span>
        </label>
        <button class="reset-btn" onclick={() => marineState.clearAll()}> Reset Session </button>

        <a href="https://github.com/jieter/distance-matrix">GitHub</a>
        <a
            href="#*Enkhuizen;52.7055;5.3094;0_Stavoren;52.8809;5.3540;1_*Urk;52.6568;5.5925;2_*Lemmer;52.8376;5.7022;3_*Medemblik;52.7706;5.1138;4_Kornwederzand;53.0635;5.3428;5_~2-3_~3-5_~2-5"
            >example</a>
    </div>
</div>

<style>
#table-container {
    display: flex;
    flex-direction: column;
    height: 100%; /* Or your desired fixed height */
}

#table-side {
    flex: 1;
    overflow: auto;
    padding: 20px 20px 10px 20px;
    background: #fff;
}

table {
    border-collapse: collapse;
}
th,
td {
    border: 1px solid #e0e6ed;
    padding: 8px;
    text-align: center;
    min-width: 50px;
}

/* Vertical Headers */
thead th:not(:first-child) {
    vertical-align: bottom;
    padding: 10px 5px;
    height: 150px;
}

.vertical-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    white-space: nowrap;
    font-weight: bold;
    display: inline-block;
}
td.dist {
    cursor: pointer; /* Indicate it's clickable */
    transition: background-color 0.2s;
}

td.is-disabled {
    background-color: #fdf2f2 !important; /* Light red tint */
    color: #e0e6ed;
}

.void {
    font-size: 0.7rem;
    font-weight: bold;
    color: #fab1a0;
    text-transform: uppercase;
}
/* Layout within cells */
.cell-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.dist-val {
    font-weight: 600;
    font-family: monospace;
}
.time-val {
    font-size: 0.75rem;
    color: #888;
}

/* Controls Styling */
.controls {
    padding: 15px 20px;
    background: #fcfcfc;
    border-top: 1px solid #eee;
    display: flex;
    align-items: center;
    gap: 15px;
}

.controls input {
    width: 60px;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-weight: bold;
}

.unit {
    font-size: 0.9rem;
    color: #666;
}

/* Interactive States */
.highlight-row,
.highlight-header {
    background-color: #f8f9fa;
}
.highlight-cell {
    background-color: #f0f4f8 !important;
    outline: 1px solid #3498db;
}
.diagonal-mark {
    color: #ced4da;
}

/* Inputs & Buttons */
.name-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.name-row input {
    border: none;
    font-weight: bold;
    outline: none;
    width: 100%;
    background: transparent;
}
.del {
    background: #ff7675;
    border: none;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    width: 20px;
    height: 20px;
}
.reset-btn {
    width: 120px;
    cursor: pointer;
    background: #ff7675;
    color: white;
    border: none;
    padding: 8px;
    border-radius: 6px;
    font-weight: bold;
}

/* Loader */
.loader {
    width: 12px;
    height: 12px;
    border: 2px solid #ccc;
    border-top-color: #3498db;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
