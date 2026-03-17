mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';

let map;
let currentGeoMode = false;
let geoPointsMap = [];
let selectedFrame = null;
let cornerMarkers = [];
let blinkInterval = null;

let extractedFrames = [];
let georeferencedFrames = [];
let activeOverlayId = null;

const OVERLAY_SOURCE_ID = 'reference-overlay';
const OVERLAY_LAYER_ID = 'reference-layer';

document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
  bindUI();
});

function initializeMap() {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sadeqal/cmmj8iyuw00gc01skawnd010w',
    center: [-4.371484, 40.911513],
    zoom: 16.36,
    attributionControl: true
  });

  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
}

function bindUI() {
  const videoInput = document.getElementById('video-upload');
  const startGeoBtn = document.getElementById('start-geo-btn');
  const slider = document.getElementById('opacity-slider');
  const compareBtn = document.getElementById('toggle-compare');
  const clearMarkersBtn = document.getElementById('clear-markers-btn');

  videoInput.addEventListener('change', handleVideoUpload);
  startGeoBtn.addEventListener('click', handleGeoModeToggle);

  slider.addEventListener('input', () => {
    const opacity = Number(slider.value) / 100;
    document.getElementById('opacity-value').textContent = `${slider.value}%`;

    if (map.getLayer(OVERLAY_LAYER_ID)) {
      map.setPaintProperty(OVERLAY_LAYER_ID, 'raster-opacity', opacity);
    }

    if (activeOverlayId) {
      const record = georeferencedFrames.find(item => item.id === activeOverlayId);
      if (record) {
        record.opacity = opacity;
      }
      renderMappedList();
    }
  });

  compareBtn.addEventListener('click', toggleCompareMode);

  clearMarkersBtn.addEventListener('click', () => {
    clearCornerMarkers();
    setStatus('Corner markers cleared from map.', 'neutral');
  });

  document.getElementById('download-coords-btn').addEventListener('click', exportAllCoordinates);
  document.getElementById('download-geotagged-btn').addEventListener('click', exportAllImagesAndJsonZip);
}

function handleVideoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  resetSessionForNewVideo();

  setStatus('Processing video and extracting thumbnails...', 'warning');
  document.getElementById('start-geo-btn').disabled = true;

  const url = URL.createObjectURL(file);
  processVideo(url);
}

function resetSessionForNewVideo() {
  extractedFrames = [];
  selectedFrame = null;
  geoPointsMap = [];
  georeferencedFrames = [];
  activeOverlayId = null;

  clearCornerMarkers();
  clearOverlay();
  stopBlinking();

  document.getElementById('frames-grid').innerHTML = '';
  document.getElementById('mapped-list').innerHTML = 'No georeferenced frames yet.';
  document.getElementById('mapped-list').classList.add('empty-state');
  document.getElementById('frame-count').textContent = '0 frames';
  document.getElementById('mapped-count').textContent = '0 mapped';
  document.getElementById('overlay-controls').classList.add('hidden');
  document.getElementById('four-points-info').classList.add('hidden');

  const startGeoBtn = document.getElementById('start-geo-btn');
  startGeoBtn.textContent = 'Start Geotagging';
  startGeoBtn.disabled = true;
}

function handleGeoModeToggle() {
  if (!selectedFrame) {
    alert('Please select a thumbnail first to use as the reference frame.');
    return;
  }

  if (currentGeoMode) {
    exitGeoMode('Geotagging cancelled.', 'warning', true);
    return;
  }

  currentGeoMode = true;
  geoPointsMap = [];
  clearCornerMarkers();
  stopBlinking();

  const startGeoBtn = document.getElementById('start-geo-btn');
  startGeoBtn.textContent = 'Cancel Geotagging';

  setStatus(
    `Reference frame selected at ${selectedFrame.time.toFixed(1)}s. Click 4 points on the map: TL → TR → BR → BL.`,
    'warning'
  );

  document.getElementById('four-points-info').classList.remove('hidden');
  map.getCanvas().style.cursor = 'crosshair';
  map.on('click', handleMapClick);
}

function exitGeoMode(message = 'Geotagging ended.', tone = 'neutral', clearPoints = false) {
  currentGeoMode = false;

  if (clearPoints) {
    geoPointsMap = [];
  }

  const startGeoBtn = document.getElementById('start-geo-btn');
  startGeoBtn.textContent = 'Start Geotagging';

  document.getElementById('four-points-info').classList.add('hidden');
  map.getCanvas().style.cursor = '';
  map.off('click', handleMapClick);

  setStatus(message, tone);
}

function processVideo(videoUrl) {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  video.onloadedmetadata = () => {
    video.currentTime = 0;
  };

  video.onseeked = () => {
    extractFrame(video);

    if (video.currentTime + 2 < video.duration) {
      video.currentTime += 2;
    } else {
      document.getElementById('start-geo-btn').disabled = false;
      setStatus(
        'Video processed successfully. Select any frame thumbnail, then start geotagging.',
        'success'
      );
      URL.revokeObjectURL(videoUrl);
    }
  };

  video.onerror = () => {
    let msg = 'Error loading video.';
    if (video.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      msg = 'Video format not supported. Convert to MP4 H.264 and try again.';
    } else if (video.error?.code === MediaError.MEDIA_ERR_DECODE) {
      msg = 'Video decode error. The file may be corrupted.';
    }

    setStatus(msg, 'danger');
  };

  video.load();
}

function extractFrame(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.72);

  const frame = {
    id: createId('frame'),
    dataURL: thumbDataUrl,
    time: Number(video.currentTime.toFixed(2))
  };

  extractedFrames.push(frame);
  renderFrameCard(frame);
  updateCounts();
}

function renderFrameCard(frame) {
  const grid = document.getElementById('frames-grid');

  const div = document.createElement('div');
  div.className = 'frame-item';
  div.dataset.frameId = frame.id;
  div.innerHTML = `
    <img src="${frame.dataURL}" alt="Extracted frame at ${frame.time.toFixed(1)} seconds" />
    <div class="frame-meta">
      <div class="frame-title">Frame ${frame.time.toFixed(1)}s</div>
      <div class="frame-sub">Click to use as reference frame</div>
    </div>
  `;

  div.addEventListener('click', () => {
    document.querySelectorAll('.frame-item').forEach(item => item.classList.remove('selected'));
    div.classList.add('selected');

    selectedFrame = {
      ...frame,
      element: div
    };

    setStatus(
      `Reference frame selected (${frame.time.toFixed(1)}s). You can now georeference it.`,
      'success'
    );
  });

  grid.appendChild(div);
}

function handleMapClick(e) {
  if (!currentGeoMode) return;

  const point = [e.lngLat.lng, e.lngLat.lat];
  geoPointsMap.push(point);

  const marker = new mapboxgl.Marker({
    color: geoPointsMap.length === 4 ? '#ef4444' : '#4f8cff',
    scale: geoPointsMap.length === 4 ? 1.08 : 0.92,
    draggable: true
  })
    .setLngLat(e.lngLat)
    .addTo(map);

  cornerMarkers.push(marker);

  marker.on('dragend', () => {
    const idx = cornerMarkers.indexOf(marker);
    if (idx === -1) return;

    geoPointsMap[idx] = [marker.getLngLat().lng, marker.getLngLat().lat];

    if (map.getSource(OVERLAY_SOURCE_ID)?.setCoordinates) {
      map.getSource(OVERLAY_SOURCE_ID).setCoordinates(geoPointsMap);
    }

    if (activeOverlayId) {
      const record = georeferencedFrames.find(item => item.id === activeOverlayId);
      if (record) {
        record.coordinates = [...geoPointsMap];
        record.updatedAt = new Date().toISOString();
      }
      renderMappedList();
    }

    setStatus('Corner adjusted. Overlay updated.', 'success');
  });

  if (geoPointsMap.length < 4) {
    setStatus(`Point ${geoPointsMap.length}/4 captured. Continue selecting corners.`, 'warning');
  }

  if (geoPointsMap.length === 4) {
    exitGeoMode('4 control points collected. Creating overlay...', 'success', false);
    saveOrUpdateGeoreferencedFrame();
  }
}

function saveOrUpdateGeoreferencedFrame() {
  if (!selectedFrame || geoPointsMap.length !== 4) {
    setStatus('Cannot create overlay. Select a frame and collect 4 points first.', 'danger');
    return;
  }

  const existingIndex = georeferencedFrames.findIndex(item => item.frameId === selectedFrame.id);
  const opacity = getCurrentOpacity();

  const payload = {
    id: existingIndex >= 0 ? georeferencedFrames[existingIndex].id : createId('geo'),
    frameId: selectedFrame.id,
    frameTime: selectedFrame.time,
    dataURL: selectedFrame.dataURL,
    coordinates: [...geoPointsMap],
    opacity,
    createdAt: existingIndex >= 0 ? georeferencedFrames[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    georeferencedFrames[existingIndex] = payload;
  } else {
    georeferencedFrames.push(payload);
  }

  activeOverlayId = payload.id;
  addReferenceOverlay(payload);
  document.getElementById('overlay-controls').classList.remove('hidden');
  renderMappedList();
  updateCounts();

  setStatus(
    `Frame ${payload.frameTime.toFixed(1)}s successfully georeferenced and saved.`,
    'success'
  );
}

function addReferenceOverlay(frameRecord) {
  if (!frameRecord || frameRecord.coordinates.length !== 4) return;

  clearOverlay();
  stopBlinking();

  map.addSource(OVERLAY_SOURCE_ID, {
    type: 'image',
    url: frameRecord.dataURL,
    coordinates: frameRecord.coordinates
  });

  map.addLayer({
    id: OVERLAY_LAYER_ID,
    type: 'raster',
    source: OVERLAY_SOURCE_ID,
    paint: {
      'raster-opacity': frameRecord.opacity ?? 0.75,
      'raster-fade-duration': 250
    }
  });

  const slider = document.getElementById('opacity-slider');
  const opacityPercent = Math.round((frameRecord.opacity ?? 0.75) * 100);
  slider.value = opacityPercent;
  document.getElementById('opacity-value').textContent = `${opacityPercent}%`;

  fitMapToCoordinates(frameRecord.coordinates);
}

function clearOverlay() {
  if (map.getLayer(OVERLAY_LAYER_ID)) {
    map.removeLayer(OVERLAY_LAYER_ID);
  }
  if (map.getSource(OVERLAY_SOURCE_ID)) {
    map.removeSource(OVERLAY_SOURCE_ID);
  }
}

function fitMapToCoordinates(coords) {
  if (!coords || !coords.length) return;

  const bounds = new mapboxgl.LngLatBounds();
  coords.forEach(coord => bounds.extend(coord));
  map.fitBounds(bounds, { padding: 80, duration: 900 });
}

function toggleCompareMode() {
  const compareBtn = document.getElementById('toggle-compare');
  const layer = map.getLayer(OVERLAY_LAYER_ID);
  if (!layer) {
    alert('No active overlay to compare.');
    return;
  }

  if (blinkInterval) {
    stopBlinking();
    compareBtn.textContent = 'Toggle Compare Mode';
    return;
  }

  let visible = true;
  blinkInterval = setInterval(() => {
    visible = !visible;
    if (map.getLayer(OVERLAY_LAYER_ID)) {
      map.setPaintProperty(OVERLAY_LAYER_ID, 'raster-opacity', visible ? 0.92 : 0.1);
    }
  }, 700);

  compareBtn.textContent = 'Stop Compare Mode';
}

function stopBlinking() {
  const compareBtn = document.getElementById('toggle-compare');
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }

  compareBtn.textContent = 'Toggle Compare Mode';

  if (map.getLayer(OVERLAY_LAYER_ID)) {
    map.setPaintProperty(OVERLAY_LAYER_ID, 'raster-opacity', getCurrentOpacity());
  }
}

function clearCornerMarkers() {
  cornerMarkers.forEach(marker => marker.remove());
  cornerMarkers = [];
}

function renderMappedList() {
  const mappedList = document.getElementById('mapped-list');

  if (!georeferencedFrames.length) {
    mappedList.className = 'mapped-list empty-state';
    mappedList.textContent = 'No georeferenced frames yet.';
    return;
  }

  mappedList.className = 'mapped-list';
  mappedList.innerHTML = '';

  const sorted = [...georeferencedFrames].sort((a, b) => a.frameTime - b.frameTime);

  sorted.forEach(item => {
    const card = document.createElement('div');
    card.className = 'mapped-item';
    card.innerHTML = `
      <img class="mapped-thumb" src="${item.dataURL}" alt="Mapped frame ${item.frameTime.toFixed(1)} seconds" />
      <div class="mapped-meta">
        <div class="mapped-title">Frame ${item.frameTime.toFixed(1)}s</div>
        <div class="mapped-sub">
          4 corners stored • Opacity ${Math.round((item.opacity ?? 0.75) * 100)}%<br>
          Updated ${new Date(item.updatedAt).toLocaleString()}
        </div>
        <div class="mapped-actions">
          <button class="mini-btn" data-action="show">Show on map</button>
          <button class="mini-btn" data-action="download-json">JSON</button>
          <button class="mini-btn" data-action="download-image">Image</button>
        </div>
      </div>
    `;

    const [showBtn, jsonBtn, imageBtn] = card.querySelectorAll('.mini-btn');

    showBtn.addEventListener('click', () => {
      activeOverlayId = item.id;
      geoPointsMap = [...item.coordinates];
      addReferenceOverlay(item);
      clearCornerMarkers();
      item.coordinates.forEach((coord, idx) => {
        const marker = new mapboxgl.Marker({
          color: idx === 3 ? '#ef4444' : '#4f8cff',
          scale: idx === 3 ? 1.08 : 0.92,
          draggable: true
        })
          .setLngLat(coord)
          .addTo(map);

        marker.on('dragend', () => {
          const markerIndex = cornerMarkers.indexOf(marker);
          if (markerIndex === -1) return;

          item.coordinates[markerIndex] = [marker.getLngLat().lng, marker.getLngLat().lat];
          geoPointsMap = [...item.coordinates];

          if (map.getSource(OVERLAY_SOURCE_ID)?.setCoordinates) {
            map.getSource(OVERLAY_SOURCE_ID).setCoordinates(item.coordinates);
          }

          item.updatedAt = new Date().toISOString();
          renderMappedList();
          setStatus(`Frame ${item.frameTime.toFixed(1)}s updated after corner drag.`, 'success');
        });

        cornerMarkers.push(marker);
      });

      setStatus(`Showing mapped frame ${item.frameTime.toFixed(1)}s on the map.`, 'success');
    });

    jsonBtn.addEventListener('click', () => {
      const json = JSON.stringify(buildSingleFrameExport(item), null, 2);
      downloadFile(
        json,
        `drone-frame-${sanitizeTime(item.frameTime)}s.geojson`,
        'application/geo+json'
      );
    });

    imageBtn.addEventListener('click', () => {
      downloadDataUrl(item.dataURL, `drone-frame-${sanitizeTime(item.frameTime)}s.jpg`);
    });

    mappedList.appendChild(card);
  });
}

function buildSingleFrameExport(item) {
  return {
    frameId: item.id,
    frameTimeSeconds: item.frameTime,
    imageFile: `drone-frame-${sanitizeTime(item.frameTime)}s.jpg`,
    format: 'simple-4-corner',
    crs: 'EPSG:4326',
    cornersClockwiseTL_TR_BR_BL: item.coordinates,
    polygonGeoJSON: {
      type: 'Feature',
      properties: {
        description: 'Georeferenced drone nadir frame',
        frameTimeSeconds: item.frameTime,
        opacity: item.opacity,
        exportedAt: new Date().toISOString()
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          item.coordinates[0],
          item.coordinates[1],
          item.coordinates[2],
          item.coordinates[3],
          item.coordinates[0]
        ]]
      }
    }
  };
}

function buildAllFramesExport() {
  return {
    project: 'Drone Nadir Frame Analyzer Export',
    exportedAt: new Date().toISOString(),
    totalFramesMapped: georeferencedFrames.length,
    frames: georeferencedFrames
      .sort((a, b) => a.frameTime - b.frameTime)
      .map(item => buildSingleFrameExport(item))
  };
}

function exportAllCoordinates() {
  if (!georeferencedFrames.length) {
    alert('No georeferenced frames available to export.');
    return;
  }

  const exportData = buildAllFramesExport();
  downloadFile(
    JSON.stringify(exportData, null, 2),
    `drone-frames-all-coordinates.geojson`,
    'application/geo+json'
  );

  setStatus(
    `Exported coordinates for ${georeferencedFrames.length} georeferenced frame(s).`,
    'success'
  );
}

async function exportAllImagesAndJsonZip() {
  if (!georeferencedFrames.length) {
    alert('No georeferenced frames available to export.');
    return;
  }

  if (typeof JSZip === 'undefined') {
    alert('JSZip failed to load. Please refresh and try again.');
    return;
  }

  setStatus('Preparing ZIP export with all images and JSON manifest...', 'warning');

  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  const manifest = buildAllFramesExport();

  for (const item of georeferencedFrames) {
    const base64 = item.dataURL.split(',')[1];
    imagesFolder.file(`drone-frame-${sanitizeTime(item.frameTime)}s.jpg`, base64, {
      base64: true
    });
  }

  zip.file('georeferenced-frames-manifest.json', JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'drone-georeferenced-export.zip');

  setStatus(
    `ZIP exported successfully with ${georeferencedFrames.length} image(s) and manifest JSON.`,
    'success'
  );
}

function updateCounts() {
  document.getElementById('frame-count').textContent = `${extractedFrames.length} frame${extractedFrames.length === 1 ? '' : 's'}`;
  document.getElementById('mapped-count').textContent = `${georeferencedFrames.length} mapped`;
}

function getCurrentOpacity() {
  const layerOpacity = map.getLayer(OVERLAY_LAYER_ID)
    ? map.getPaintProperty(OVERLAY_LAYER_ID, 'raster-opacity')
    : null;

  if (typeof layerOpacity === 'number') return layerOpacity;
  return Number(document.getElementById('opacity-slider').value) / 100;
}

function setStatus(message, tone = 'neutral') {
  const el = document.getElementById('geo-status');
  el.textContent = message;
  el.className = `status status-${tone}`;
}

function createId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeTime(time) {
  return Number(time).toFixed(1).replace('.', '_');
}

function downloadFile(content, fileName, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl, fileName) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}