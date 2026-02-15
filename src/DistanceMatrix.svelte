<script>
  import L from 'leaflet';

  let {
    locations,
    removeLoc,
    METERS_TO_NM,
    onHover,
    onLeave,
    hoveredIndices
  } = $props();

  function getDistance(locA, locB) {
    const dist = L.latLng(locA.lat, locA.lng).distanceTo(L.latLng(locB.lat, locB.lng));
    return Math.round(dist * METERS_TO_NM);
  }
</script>

<div id="table-side">
  <table>
    <thead>
      <tr>
        <th>Location</th>
        {#each locations as loc, j}
          <th class={hoveredIndices.includes(j) ? 'highlight-header' : ''}>
            <div class="rotate-wrapper" style="color: {loc.color}">
              <span>{loc.name}</span>
            </div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each locations as loc, i}
        <tr class={hoveredIndices.includes(i) ? 'highlight-row' : ''}>
          <td
            style="border-left: 6px solid {loc.color}"
            onmouseenter={() => onHover(i)}
            onmouseleave={() => onLeave()}
          >
            <div class="name-row">
              <input bind:value={loc.name} oninput={() => loc.marker?.setTooltipContent(loc.name)} />
              <button class="del" onclick={() => removeLoc(i)} aria-label="Delete">&times;</button>
            </div>
          </td>
          {#each locations as colLoc, j}
            <td
              class:diagonal={i === j}
              class:dist={i !== j}
              class:highlight-cell={hoveredIndices.includes(i) && hoveredIndices.includes(j) && i !== j}
              onmouseenter={() => i !== j && onHover(i, j)}
              onmouseleave={() => onLeave()}
            >
              {i === j ? '-' : getDistance(loc, colLoc)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  #table-side { flex: 1; overflow: auto; padding: 20px; background: #fff; }
  table { border-collapse: collapse; margin-top: 110px; margin-left: 10px; }
  th, td { border: 1px solid #e0e6ed; padding: 8px; text-align: center; transition: background 0.1s; }
  th:first-child { min-width: 180px; vertical-align: bottom; padding-bottom: 10px; }

  thead th:not(:first-child) { height: 120px; position: relative; vertical-align: bottom; padding: 0; min-width: 45px; }

  .rotate-wrapper {
    position: absolute; bottom: 10px; left: 50%;
    transform: rotate(-90deg);
    transform-origin: middle left; white-space: nowrap;
  }
  .rotate-wrapper span { font-weight: bold; }

  /* Table Hover Styles */
  .highlight-row { background-color: #f2f2f2; }
  .highlight-header { background-color: #f2f2f2; }
  .highlight-cell { background-color: #e0e0e0 !important; outline: 1px solid #999; }

  .name-row { display: flex; align-items: center; gap: 8px; }
  .name-row input { border: none; font-weight: bold; outline: none; width: 100%; font-size: 1em; background: transparent; }

  .del { background: #ff7675; border: none; color: white; border-radius: 4px; cursor: pointer; width: 22px; height: 22px; }
  .diagonal { color: #ced4da; background: #f8f9fa; }
  .dist { font-family: 'Courier New', monospace; font-weight: bold; }
</style>