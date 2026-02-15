<script>
  import { onMount } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import DistanceMatrix from './DistanceMatrix.svelte';

  let locations = $state(JSON.parse(localStorage.getItem('marine_locations')) || []);
  let hoveredIndices = $state([]); // Tracks [sourceIndex] or [sourceIndex, targetIndex]
  let map = $state(null);
  let mapElement;
  let lines = {};
  let linesLayer;

  const METERS_TO_NM = 0.000539957;

  // Sync Map Lines with Hover State
  $effect(() => {
    Object.keys(lines).forEach(key => {
      const [i, j] = key.split('-').map(Number);
      const isHighlighted = hoveredIndices.length === 1
        ? (i === hoveredIndices[0] || j === hoveredIndices[0])
        : (hoveredIndices.includes(i) && hoveredIndices.includes(j));

      if (lines[key]) {
        const baseColor = locations[Math.min(i, j)].color;
        lines[key].setStyle({
          weight: isHighlighted ? 5 : 2,
          opacity: isHighlighted ? 1 : 0.15,
          dashArray: isHighlighted ? null : '5, 5'
        });
        if (isHighlighted) lines[key].bringToFront();
      }
    });
  });

  onMount(() => {
    map = L.map(mapElement).setView([52, 4], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    linesLayer = L.layerGroup().addTo(map);

    map.on('click', async (e) => {
      const color = `hsl(${Math.random() * 360}, 70%, 45%)`;
      locations.push({ name: `Mark ${locations.length + 1}`, lat: e.latlng.lat, lng: e.latlng.lng, color, marker: null });
      refreshMap();
    });

    if (locations.length > 0) refreshMap();
  });

  function handleHover(i, j = null) {
    hoveredIndices = j !== null ? [i, j] : [i];
  }

  function handleLeave() {
    hoveredIndices = [];
  }

  function createMarker(loc, index) {
    const marker = L.marker([loc.lat, loc.lng], {
      draggable: true,
      icon: L.divIcon({
        className: '',
        html: `<div style="background-color:${loc.color}; width:14px; height:14px; border:2px solid white; border-radius:50%;"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9]
      })
    }).addTo(map).bindTooltip(loc.name);

    marker.on('drag', (e) => {
      const { lat, lng } = e.target.getLatLng();
      locations[index].lat = lat;
      locations[index].lng = lng;
      drawLines();
    });

    return marker;
  }

  function drawLines() {
    linesLayer.clearLayers();
    lines = {};
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const poly = L.polyline([[locations[i].lat, locations[i].lng], [locations[j].lat, locations[j].lng]], {
          color: locations[i].color, weight: 2, opacity: 0.15, dashArray: '5, 5'
        }).addTo(linesLayer);
        lines[`${i}-${j}`] = lines[`${j}-${i}`] = poly;
      }
    }
  }

  function refreshMap() {
    locations.forEach((loc, i) => {
      if (loc.marker) map.removeLayer(loc.marker);
      loc.marker = createMarker(loc, i);
    });
    drawLines();
  }

  function removeLoc(index) {
    if (locations[index].marker) map.removeLayer(locations[index].marker);
    locations.splice(index, 1);
    refreshMap();
  }
</script>

<main>
  <div id="map-side">
    <div bind:this={mapElement} id="map"></div>
  </div>
  <DistanceMatrix
    {locations}
    {removeLoc}
    {METERS_TO_NM}
    {hoveredIndices}
    onHover={handleHover}
    onLeave={handleLeave}
  />
</main>

<style>
  main { display: flex; width: 100vw; height: 100vh; }
  #map-side { flex: 1; border-right: 2px solid #ddd; }
  #map { height: 100%; width: 100%; }
</style>