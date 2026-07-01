// ═══════════════════════════════════════════════════════════════════════════════
// Flight Overlay Studio - Complete JavaScript
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Global State ──────────────────────────────────────────────────────────────

let video = document.getElementById('video');
let liveOverlay = document.getElementById('liveOverlay');
let chart = null;
let driftChart = null;
let map = null;

let telemetry = {
    alt: [],
    airspeed: [],
    lat: [],
    lng: [],
    groundSpeed: [],
    heading: [],
    climb: [],
    pos: { lat: [], lng: [] }
};

let overlayFields = {
    alt: true,
    airspeed: true,
    lat: true,
    lng: true,
    groundSpeed: true,
    heading: true,
    climb: true,
    time: true
};

let syncOffset = 0;
let selectedLogTime = null;
let isExporting = false;
let recorder = null;
let recordedChunks = [];
let exportCanvas = null;
let exportCtx = null;
let mapMarkers = [];
let missionWaypoints = [];  // From uploaded mission.plan
let secondaryGPS = { lat: [], lng: [] };  // From second log
let secondaryLogTimeOffset = 0;  // User-specified offset for secondary log sync

// ─── DOM Elements ──────────────────────────────────────────────────────────────

const els = {
    fieldAlt: document.getElementById('fieldAlt'),
    fieldAirspeed: document.getElementById('fieldAirspeed'),
    fieldLat: document.getElementById('fieldLat'),
    fieldLng: document.getElementById('fieldLng'),
    fieldGroundSpeed: document.getElementById('fieldGroundSpeed'),
    fieldHeading: document.getElementById('fieldHeading'),
    fieldClimb: document.getElementById('fieldClimb'),
    fieldSats: document.getElementById('fieldSats'),
    fieldHdop: document.getElementById('fieldHdop'),
    fieldTime: document.getElementById('fieldTime'),
    statusBox: document.getElementById('statusBox'),
    samplesStat: document.getElementById('samplesStat'),
    durationStat: document.getElementById('durationStat'),
    startStat: document.getElementById('startStat'),
    endStat: document.getElementById('endStat'),
    offsetInfo: document.getElementById('offsetInfo'),
    logInfo: document.getElementById('logInfo'),
    videoInfo: document.getElementById('videoInfo'),
    selectedLogTimeBox: document.getElementById('selectedLogTimeBox'),
    currentVideoTimeBox: document.getElementById('currentVideoTimeBox'),
    scrubber: document.getElementById('scrubber'),
    timeReadout: document.getElementById('timeReadout'),
    exportBtn: document.getElementById('exportBtn'),
    maxDriftStat: document.getElementById('maxDriftStat'),
    avgDriftStat: document.getElementById('avgDriftStat'),
    gpsFixStat: document.getElementById('gpsFixStat'),
    noGpsSpansStat: document.getElementById('noGpsSpansStat'),
    mapStatus: document.getElementById('mapStatus'),
    driftPanel: document.getElementById('driftPanel'),
    driftRefSource: document.getElementById('driftRefSource'),
    missionFile: document.getElementById('missionFile'),
    secondBinFile: document.getElementById('secondBinFile'),
    secondLogOffset: document.getElementById('secondLogOffset')
};

// ─── Event Listeners ───────────────────────────────────────────────────────────

els.fieldAlt.addEventListener('change', () => { overlayFields.alt = els.fieldAlt.checked; updateLiveOverlay(); });
els.fieldAirspeed.addEventListener('change', () => { overlayFields.airspeed = els.fieldAirspeed.checked; updateLiveOverlay(); });
els.fieldLat.addEventListener('change', () => { overlayFields.lat = els.fieldLat.checked; updateLiveOverlay(); });
els.fieldLng.addEventListener('change', () => { overlayFields.lng = els.fieldLng.checked; updateLiveOverlay(); });
els.fieldGroundSpeed.addEventListener('change', () => { overlayFields.groundSpeed = els.fieldGroundSpeed.checked; updateLiveOverlay(); });
els.fieldHeading.addEventListener('change', () => { overlayFields.heading = els.fieldHeading.checked; updateLiveOverlay(); });
els.fieldClimb.addEventListener('change', () => { overlayFields.climb = els.fieldClimb.checked; updateLiveOverlay(); });
els.fieldTime.addEventListener('change', () => { overlayFields.time = els.fieldTime.checked; updateLiveOverlay(); });

els.scrubber.addEventListener('input', () => {
    video.currentTime = Number(els.scrubber.value) || 0;
    updateLiveOverlay();
});

document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 's' && video.paused) {
        setSyncPoint();
    }
});

// ─── Utility Functions ─────────────────────────────────────────────────────────

function setStatus(msg) {
    els.statusBox.textContent = msg;
}

function formatTimeAxis(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function haversineMetres(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getInterpolatedValue(series, logTime) {
    if (!series || !series.length) return null;
    if (logTime <= series[0].time) return series[0].value;
    if (logTime >= series[series.length - 1].time) return series[series.length - 1].value;

    let lo = 0, hi = series.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (series[mid].time < logTime) lo = mid + 1;
        else hi = mid - 1;
    }
    
    const a = series[Math.max(0, lo - 1)];
    const b = series[Math.min(series.length - 1, lo)];
    if (!a || !b) return null;
    if (a.time === b.time) return a.value;
    
    const t = (logTime - a.time) / (b.time - a.time);
    return a.value + (b.value - a.value) * t;
}

function getInterpolatedAlt(logTime) {
    return getInterpolatedValue(telemetry.alt, logTime);
}

// ─── Stats Update ──────────────────────────────────────────────────────────────

function updateStats() {
    if (!telemetry.alt.length) {
        els.samplesStat.textContent = '0';
        els.durationStat.textContent = '0.00 s';
        els.startStat.textContent = '0.00 s';
        els.endStat.textContent = '0.00 s';
        return;
    }
    
    const start = telemetry.alt[0].time;
    const end = telemetry.alt[telemetry.alt.length - 1].time;
    
    els.samplesStat.textContent = String(telemetry.alt.length);
    els.durationStat.textContent = `${(end - start).toFixed(2)} s`;
    els.startStat.textContent = `${start.toFixed(2)} s`;
    els.endStat.textContent = `${end.toFixed(2)} s`;
}

function updateTimeReadout() {
    const videoTime = video.currentTime || 0;
    const logTime = videoTime - syncOffset;
    els.currentVideoTimeBox.value = videoTime.toFixed(3);
    els.logInfo.textContent = `Log time: ${logTime.toFixed(3)} s`;
    els.offsetInfo.textContent = `Offset: ${syncOffset.toFixed(3)} s`;
    els.timeReadout.textContent = `Video ${videoTime.toFixed(3)} s • Log ${logTime.toFixed(3)} s`;
}

// ─── Live Overlay ──────────────────────────────────────────────────────────────

function updateLiveOverlay() {
    const hasAnyData = telemetry.alt.length || telemetry.airspeed.length || 
                      telemetry.lat.length || telemetry.lng.length;
    
    if (!hasAnyData) {
        liveOverlay.innerHTML = '';
        updateTimeReadout();
        return;
    }
    
    const videoTime = video.currentTime || 0;
    const logTime = videoTime - syncOffset;
    const lines = [];
    
    if (overlayFields.alt) {
        const v = getInterpolatedValue(telemetry.alt, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">Alt</span><span class="overlay-value">${v == null ? '—' : v.toFixed(1) + ' m'}</span></div>`);
    }
    
    if (overlayFields.lat) {
        const v = getInterpolatedValue(telemetry.lat, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">Lat</span><span class="overlay-value">${v == null ? '—' : v.toFixed(6)}</span></div>`);
    }
    
    if (overlayFields.lng) {
        const v = getInterpolatedValue(telemetry.lng, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">Lng</span><span class="overlay-value">${v == null ? '—' : v.toFixed(6)}</span></div>`);
    }
    
    if (overlayFields.airspeed) {
        const v = getInterpolatedValue(telemetry.airspeed, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">Arspd</span><span class="overlay-value">${v == null ? '—' : v.toFixed(1) + ' m/s'}</span></div>`);
    }
    
    if (overlayFields.groundSpeed) {
        const v = getInterpolatedValue(telemetry.groundSpeed, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">Gndspd</span><span class="overlay-value">${v == null ? '—' : v.toFixed(1) + ' m/s'}</span></div>`);
    }
    
    if (overlayFields.climb) {
        const v = getInterpolatedValue(telemetry.climb, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">ROC</span><span class="overlay-value">${v == null ? '—' : v.toFixed(1) + ' m/s'}</span></div>`);
    }
    
    if (overlayFields.heading) {
        const v = getInterpolatedValue(telemetry.heading, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">Hdg</span><span class="overlay-value">${v == null ? '—' : v.toFixed(1) + '°'}</span></div>`);
    }
    
    if (overlayFields.sats) {
        const v = getInterpolatedValue(telemetry.sats, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">Sats</span><span class="overlay-value">${v == null ? '—' : Math.round(v)}</span></div>`);
    }
    
    if (overlayFields.hdop) {
        const v = getInterpolatedValue(telemetry.hdop, logTime);
        lines.push(`<div class="overlay-row"><span class="overlay-label">HDOP</span><span class="overlay-value">${v == null ? '—' : v.toFixed(1)}</span></div>`);
    }
    
    liveOverlay.innerHTML = lines.join('');
    updateTimeReadout();
}

// ─── Export Overlay ────────────────────────────────────────────────────────────

function getOverlayLines(logTime) {
    const lines = [];
    lines.push({ label: 'Time', value: `${logTime.toFixed(1)} s` });
    
    if (overlayFields.alt) {
        const v = getInterpolatedValue(telemetry.alt, logTime);
        lines.push({ label: 'Alt', value: v == null ? '—' : `${v.toFixed(1)} m` });
    }
    if (overlayFields.lat) {
        const v = getInterpolatedValue(telemetry.lat, logTime);
        lines.push({ label: 'Lat', value: v == null ? '—' : v.toFixed(6) });
    }
    if (overlayFields.lng) {
        const v = getInterpolatedValue(telemetry.lng, logTime);
        lines.push({ label: 'Lng', value: v == null ? '—' : v.toFixed(6) });
    }
    if (overlayFields.airspeed) {
        const v = getInterpolatedValue(telemetry.airspeed, logTime);
        lines.push({ label: 'Arspd', value: v == null ? '—' : `${v.toFixed(1)} m/s` });
    }
    if (overlayFields.groundSpeed) {
        const v = getInterpolatedValue(telemetry.groundSpeed, logTime);
        lines.push({ label: 'GSpd', value: v == null ? '—' : `${v.toFixed(1)} m/s` });
    }
    if (overlayFields.heading) {
        const v = getInterpolatedValue(telemetry.heading, logTime);
        lines.push({ label: 'Head', value: v == null ? '—' : `${v.toFixed(0)}°` });
    }
    if (overlayFields.climb) {
        const v = getInterpolatedValue(telemetry.climb, logTime);
        lines.push({ label: 'Climb', value: v == null ? '—' : `${v.toFixed(1)} m/s` });
    }
    
    return lines;
}

function drawStrokeText(ctx, text, x, y, fontSize) {
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.92)';
    ctx.lineWidth = Math.max(2, fontSize * 0.09);
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
}

function drawExportOverlay(ctx, canvas, logTime) {
    const lines = getOverlayLines(logTime);
    if (!lines.length) return;
    
    const fontSize = Math.max(20, Math.round(canvas.width * 0.0105));
    const left = Math.round(canvas.width * 0.02);
    const bottom = Math.round(canvas.height * 0.035);
    const rowGap = Math.round(fontSize * 1.35);
    const labelWidth = Math.round(fontSize * 3.4);
    
    ctx.save();
    ctx.font = `600 ${fontSize}px Arial`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    
    const startY = canvas.height - bottom - ((lines.length - 1) * rowGap);
    
    lines.forEach((line, i) => {
        const y = startY + i * rowGap;
        drawStrokeText(ctx, line.label, left, y, fontSize);
        drawStrokeText(ctx, line.value, left + labelWidth, y, fontSize);
    });
    
    ctx.restore();
}

// ─── Altitude Plot ─────────────────────────────────────────────────────────────

function renderPlot() {
    if (chart) chart.destroy();
    if (!telemetry.alt.length) return;
    
    const ctx = document.getElementById('plot').getContext('2d');
    
    const altMin = Math.min(...telemetry.alt.map(d => d.value));
    const altMax = Math.max(...telemetry.alt.map(d => d.value));
    const altPad = Math.max(5, (altMax - altMin) * 0.08);
    
    const selectedPointPlugin = {
        id: 'selectedPointPlugin',
        afterDatasetsDraw(chart) {
            if (selectedLogTime == null || !telemetry.alt.length) return;
            
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            const alt = getInterpolatedAlt(selectedLogTime);
            if (alt == null) return;
            
            const x = xScale.getPixelForValue(selectedLogTime);
            const y = yScale.getPixelForValue(alt);
            const c = chart.ctx;
            
            c.save();
            c.beginPath();
            c.arc(x, y, 6, 0, Math.PI * 2);
            c.fillStyle = '#22d3ee';
            c.fill();
            c.lineWidth = 3;
            c.strokeStyle = '#ffffff';
            c.stroke();
            
            c.beginPath();
            c.moveTo(x, chart.chartArea.top);
            c.lineTo(x, chart.chartArea.bottom);
            c.strokeStyle = 'rgba(34,211,238,0.8)';
            c.lineWidth = 2;
            c.stroke();
            c.restore();
        }
    };
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'BARO[0].Alt (m)',
                data: telemetry.alt.map(d => ({ x: d.time, y: d.value })),
                parsing: false,
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96,165,250,.15)',
                borderWidth: 2,
                tension: 0.15,
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Log Time', color: '#cbd5e1' },
                    ticks: { color: '#9eb3d3', callback: v => formatTimeAxis(v) },
                    grid: { color: 'rgba(255,255,255,.06)' }
                },
                y: {
                    min: altMin - altPad,
                    max: altMax + altPad,
                    title: { display: true, text: 'Altitude (m)', color: '#cbd5e1' },
                    ticks: { color: '#9eb3d3' },
                    grid: { color: 'rgba(255,255,255,.06)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#edf4ff' } },
                tooltip: {
                    callbacks: {
                        title: items => `Time: ${formatTimeAxis(items[0].parsed.x)}`,
                        label: item => `Alt: ${item.parsed.y.toFixed(2)} m`
                    }
                }
            },
            onClick: (e) => {
                if (!telemetry.alt.length) return;
                const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, false);
                if (!points.length) return;
                const idx = points[0].index;
                selectedLogTime = telemetry.alt[idx].time;
                els.selectedLogTimeBox.value = selectedLogTime.toFixed(3);
                chart.update();
                setStatus(`Selected log time: ${formatTimeAxis(selectedLogTime)}`);
            }
        },
        plugins: [selectedPointPlugin]
    });
}

// ─── Map Functions ─────────────────────────────────────────────────────────────

function initMap(centerLng, centerLat) {
    if (map) return;
    
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/sadeqal/cl04dpzyq000v15o3nlcnpn9d',
        center: [centerLng, centerLat],
        zoom: 15,
        pitch: 60,
        bearing: 0,
        antialias: true
    });
    
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-right');
}

function setMapPitch(pitch) {
    if (map) map.setPitch(pitch);
}

function setMapSatellite() {
    if (!map) return;
    map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
    // Re-render flight path after style loads
    map.once('styledata', () => {
        if (telemetry.lat.length && telemetry.lng.length) {
            const outages = renderFlightPath();
            const driftPts = computeDrift(outages);
            renderDriftPlot(outages, driftPts);
        }
    });
}

function setMapOriginal() {
    if (!map) return;
    map.setStyle('mapbox://styles/sadeqal/cl04dpzyq000v15o3nlcnpn9d');
    map.once('styledata', () => {
        if (telemetry.lat.length && telemetry.lng.length) {
            const outages = renderFlightPath();
            const driftPts = computeDrift(outages);
            renderDriftPlot(outages, driftPts);
        }
    });
}

// ─── Mission Plan Parser ───────────────────────────────────────────────────────

async function parseMissionPlan(file) {
    const text = await file.text();
    try {
        const plan = JSON.parse(text);
        missionWaypoints = [];
        
        // QGroundControl mission format
        if (plan.mission && plan.mission.items) {
            plan.mission.items.forEach(item => {
                // MAV_CMD_NAV_WAYPOINT = 16
                if (item.command === 16 && item.params) {
                    const lat = item.params[4];
                    const lng = item.params[5];
                    const alt = item.params[6];
                    if (Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01) {
                        missionWaypoints.push({ lat, lng, alt });
                    }
                }
            });
        }
        
        setStatus(`Mission plan loaded: ${missionWaypoints.length} waypoints`);
        return missionWaypoints;
    } catch (err) {
        console.error('Mission parse error:', err);
        throw new Error('Invalid mission.plan format');
    }
}

// ─── Secondary Log Parser ──────────────────────────────────────────────────────

async function parseSecondaryBin(file) {
    const buffer = await file.arrayBuffer();
    
    if (typeof DataflashParser === 'undefined') {
        throw new Error('DataflashParser is not available.');
    }
    
    const parser = new DataflashParser(false);
    const parsed = parser.processData(buffer, ['GPS']);
    
    const gpsMsg = parsed?.messages?.['GPS[0]'] || parsed?.messages?.GPS;
    
    secondaryGPS = { lat: [], lng: [] };
    
    if (gpsMsg?.time_boot_ms && gpsMsg?.Lat && gpsMsg?.Lng) {
        const mk = (arr, scale = 1) =>
            Array.from(arr || [])
                .map((v, i) => ({ timeAbs: Number(gpsMsg.time_boot_ms[i]) / 1000, value: Number(v) * scale }))
                .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
                .sort((a, b) => a.timeAbs - b.timeAbs);
        
        const rawLat = mk(gpsMsg.Lat, 1/1e7);
        const rawLng = mk(gpsMsg.Lng, 1/1e7);
        
        // Filter invalid coords
        const validIndices = rawLat
            .map((p, i) => {
                const lat = p.value;
                const lng = rawLng[i]?.value;
                const isValid = Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01 &&
                               Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
                return isValid ? i : -1;
            })
            .filter(i => i >= 0);
        
        secondaryGPS.lat = validIndices.map(i => rawLat[i]);
        secondaryGPS.lng = validIndices.map(i => rawLng[i]);
        
        if (secondaryGPS.lat.length) {
            const baseTime = secondaryGPS.lat[0].timeAbs;
            secondaryGPS.lat = secondaryGPS.lat.map(p => ({ ...p, time: p.timeAbs - baseTime }));
            secondaryGPS.lng = secondaryGPS.lng.map(p => ({ ...p, time: p.timeAbs - baseTime }));
        }
    }
    
    setStatus(`Secondary GPS log loaded: ${secondaryGPS.lat.length} points`);
    return secondaryGPS;
}

function fitMapToFlight() {
    if (!map || !telemetry.lat.length) return;
    const lats = telemetry.lat.map(p => p.value);
    const lngs = telemetry.lng.map(p => p.value);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { 
        padding: 60, 
        pitch: 60, 
        duration: 1200 
    });
}

function clearMapMarkers() {
    mapMarkers.forEach(m => m.remove());
    mapMarkers = [];
}

function addMarker(lngLat, className, popupHtml) {
    const el = document.createElement('div');
    el.className = className;
    const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(popupHtml))
        .addTo(map);
    mapMarkers.push(marker);
}

function detectGpsOutages() {
    const GPS_GAP_THRESHOLD = 3;
    const gps = telemetry.lat;
    if (gps.length < 2) return [];
    
    const outages = [];
    for (let i = 1; i < gps.length; i++) {
        const gap = gps[i].time - gps[i-1].time;
        if (gap > GPS_GAP_THRESHOLD) {
            outages.push({ tStart: gps[i-1].time, tEnd: gps[i].time });
        }
    }
    return outages;
}

function buildCoords(latSeries, lngSeries, tMin = -Infinity, tMax = Infinity) {
    const coords = [];
    for (const p of latSeries) {
        if (p.time < tMin || p.time > tMax) continue;
        const lng = getInterpolatedValue(lngSeries, p.time);
        if (lng == null) continue;
        const alt = getInterpolatedValue(telemetry.alt, p.time);
        coords.push([lng, p.value, alt ?? 0]);
    }
    return coords;
}

function buildNoGpsCoords(outage) {
    const { tStart, tEnd } = outage;
    
    if (telemetry.pos && telemetry.pos.lat && telemetry.pos.lat.length) {
        return buildCoords(telemetry.pos.lat, telemetry.pos.lng, tStart, tEnd);
    }
    
    const coords = [];
    const step = 0.5;
    for (let t = tStart; t <= tEnd; t += step) {
        const lat = getInterpolatedValue(telemetry.lat, t);
        const lng = getInterpolatedValue(telemetry.lng, t);
        const alt = getInterpolatedValue(telemetry.alt, t);
        if (lat == null || lng == null) continue;
        coords.push([lng, lat, alt ?? 0]);
    }
    return coords;
}

function addOrUpdateLayer(id, sourceId, data, paint) {
    if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
    } else {
        map.addSource(sourceId, { type: 'geojson', data });
    }
    if (!map.getLayer(id)) {
        map.addLayer({ 
            id, 
            type: 'line', 
            source: sourceId, 
            paint, 
            layout: { 'line-join': 'round', 'line-cap': 'round' } 
        });
    }
}

function renderFlightPath() {
    if (!map) return [];
    if (!telemetry.lat.length) return [];
    
    clearMapMarkers();
    
    const outages = detectGpsOutages();
    
    const gpsCoords = telemetry.lat.map((p, i) => {
        const lng = telemetry.lng[i] ? telemetry.lng[i].value : getInterpolatedValue(telemetry.lng, p.time);
        const alt = getInterpolatedValue(telemetry.alt, p.time);
        return [lng, p.value, alt ?? 0];
    }).filter(c => Number.isFinite(c[0]) && Number.isFinite(c[1]));
    
    const gpsGeoJSON = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: gpsCoords }
    };
    
    addOrUpdateLayer('gps-track', 'gps-track-src', gpsGeoJSON, {
        'line-color': '#60a5fa',
        'line-width': 3,
        'line-opacity': 0.9
    });
    
    const noGpsFeatures = outages.map(o => ({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: buildNoGpsCoords(o) }
    }));
    
    const noGpsGeoJSON = { type: 'FeatureCollection', features: noGpsFeatures };
    
    addOrUpdateLayer('no-gps-track', 'no-gps-track-src', noGpsGeoJSON, {
        'line-color': '#f59e0b',
        'line-width': 2.5,
        'line-opacity': 0.85,
        'line-dasharray': [3, 2]
    });
    
    if (gpsCoords.length) {
        const first = gpsCoords[0];
        const last = gpsCoords[gpsCoords.length - 1];
        addMarker([first[0], first[1]], 'map-marker-restore',
            `<strong>Flight start</strong><br>Lat ${first[1].toFixed(6)}<br>Lng ${first[0].toFixed(6)}`);
        addMarker([last[0], last[1]], 'map-marker-cut',
            `<strong>Flight end</strong><br>Lat ${last[1].toFixed(6)}<br>Lng ${last[0].toFixed(6)}`);
    }
    
    outages.forEach((o, idx) => {
        const cutLat = getInterpolatedValue(telemetry.lat, o.tStart);
        const cutLng = getInterpolatedValue(telemetry.lng, o.tStart);
        if (cutLat != null && cutLng != null) {
            addMarker([cutLng, cutLat], 'map-marker-cut',
                `<strong>GPS lost</strong> #${idx+1}<br>Log t = ${o.tStart.toFixed(1)} s<br>Lat ${cutLat.toFixed(6)}<br>Lng ${cutLng.toFixed(6)}`);
        }
        
        const restLat = getInterpolatedValue(telemetry.lat, o.tEnd);
        const restLng = getInterpolatedValue(telemetry.lng, o.tEnd);
        if (restLat != null && restLng != null) {
            addMarker([restLng, restLat], 'map-marker-restore',
                `<strong>GPS restored</strong> #${idx+1}<br>Log t = ${o.tEnd.toFixed(1)} s<br>Duration = ${(o.tEnd - o.tStart).toFixed(1)} s`);
        }
    });
    
    els.mapStatus.textContent = outages.length
        ? `${outages.length} GPS outage(s) detected. Orange = estimated track (no GPS).`
        : 'GPS track rendered. No outages detected.';
    
    return outages;
}

// ─── Drift Computation ─────────────────────────────────────────────────────────

function getClosestWaypoint(lat, lng) {
    if (!missionWaypoints.length) return null;
    
    let closest = null;
    let minDist = Infinity;
    
    missionWaypoints.forEach(wp => {
        const dist = haversineMetres(lat, lng, wp.lat, wp.lng);
        if (dist < minDist) {
            minDist = dist;
            closest = wp;
        }
    });
    
    return closest;
}

function computeDrift(outages) {
    const driftPoints = [];
    const refSource = els.driftRefSource ? els.driftRefSource.value : 'pos';
    
    // Check if we have POS data
    const hasPOS = telemetry.pos && telemetry.pos.lat && telemetry.pos.lat.length > 0;
    
    if (!hasPOS) {
        console.warn('No POS data available - cannot compute drift without EKF position');
        setStatus('⚠️ No POS data in log. Enable EKF logging (NKF1/XKF1/POS messages) in ArduPilot.');
        return [];
    }
    
    outages.forEach((o, idx) => {
        const duration = o.tEnd - o.tStart;
        if (duration <= 0) return;
        
        const step = 0.5;
        const outagePoints = [];
        
        for (let t = o.tStart; t <= o.tEnd; t += step) {
            // Get EKF estimated position (what the autopilot thinks it is)
            const estLat = getInterpolatedValue(telemetry.pos.lat, t);
            const estLng = getInterpolatedValue(telemetry.pos.lng, t);
            
            if (estLat == null || estLng == null) continue;
            if (Math.abs(estLat) < 0.01 || Math.abs(estLng) < 0.01) continue;
            
            let truthLat, truthLng;
            
            // ─── Reference Source Selection ───────────────────────────────
            
            if (refSource === 'mission' && missionWaypoints.length > 0) {
                // Compare against mission waypoints
                const wp = getClosestWaypoint(estLat, estLng);
                if (!wp) continue;
                truthLat = wp.lat;
                truthLng = wp.lng;
                
            } else if (refSource === 'secondary' && secondaryGPS.lat.length > 0) {
                // Compare against secondary GPS log (with time offset)
                const tSecondary = t + secondaryLogTimeOffset;
                truthLat = getInterpolatedValue(secondaryGPS.lat, tSecondary);
                truthLng = getInterpolatedValue(secondaryGPS.lng, tSecondary);
                if (truthLat == null || truthLng == null) continue;
                if (Math.abs(truthLat) < 0.01 || Math.abs(truthLng) < 0.01) continue;
                
            } else {
                // Default: linear interpolation between GPS fix before/after outage
                const lat0 = getInterpolatedValue(telemetry.lat, o.tStart);
                const lng0 = getInterpolatedValue(telemetry.lng, o.tStart);
                const lat1 = getInterpolatedValue(telemetry.lat, o.tEnd);
                const lng1 = getInterpolatedValue(telemetry.lng, o.tEnd);
                
                if (lat0 == null || lng0 == null || lat1 == null || lng1 == null) continue;
                if (Math.abs(lat0) < 0.01 || Math.abs(lng0) < 0.01) continue;
                if (Math.abs(lat1) < 0.01 || Math.abs(lng1) < 0.01) continue;
                
                const frac = (t - o.tStart) / duration;
                truthLat = lat0 + (lat1 - lat0) * frac;
                truthLng = lng0 + (lng1 - lng0) * frac;
            }
            
            const driftM = haversineMetres(truthLat, truthLng, estLat, estLng);
            
            // Skip extreme outliers
            if (driftM > 100000) continue;
            
            outagePoints.push({ time: t, driftM, outageIdx: idx });
        }
        
        // Statistical outlier filtering (3-sigma)
        if (outagePoints.length > 5) {
            const drifts = outagePoints.map(p => p.driftM);
            const mean = drifts.reduce((a, b) => a + b, 0) / drifts.length;
            const std = Math.sqrt(drifts.map(d => (d - mean) ** 2).reduce((a, b) => a + b, 0) / drifts.length);
            const threshold = mean + 3 * std;
            
            outagePoints.forEach(p => {
                if (p.driftM <= threshold) {
                    driftPoints.push(p);
                }
            });
        } else {
            driftPoints.push(...outagePoints);
        }
    });
    
    return driftPoints;
}

function renderDriftPlot(outages, driftPoints) {
    if (!driftPoints.length) {
        els.driftPanel.style.display = 'none';
        return;
    }
    
    els.driftPanel.style.display = 'flex';
    
    const maxDrift = Math.max(...driftPoints.map(p => p.driftM));
    const avgDrift = driftPoints.reduce((s, p) => s + p.driftM, 0) / driftPoints.length;
    
    els.maxDriftStat.textContent = `${maxDrift.toFixed(1)} m`;
    els.avgDriftStat.textContent = `${avgDrift.toFixed(1)} m`;
    els.gpsFixStat.textContent = String(telemetry.lat.length);
    els.noGpsSpansStat.textContent = String(outages.length);
    
    const palette = ['#f59e0b', '#ef4444', '#a855f7', '#22d3ee', '#34d399'];
    
    const datasets = outages.map((o, idx) => {
        const pts = driftPoints.filter(p => p.outageIdx === idx);
        return {
            label: `Outage #${idx+1} (${o.tStart.toFixed(0)}–${o.tEnd.toFixed(0)} s)`,
            data: pts.map(p => ({ x: p.time, y: p.driftM })),
            parsing: false,
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '33',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.2,
            fill: true
        };
    });
    
    if (driftChart) driftChart.destroy();
    
    const ctx = document.getElementById('driftPlot').getContext('2d');
    driftChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Log Time (s)', color: '#cbd5e1' },
                    ticks: { color: '#9eb3d3', callback: v => formatTimeAxis(v) },
                    grid: { color: 'rgba(255,255,255,.06)' }
                },
                y: {
                    min: 0,
                    title: { display: true, text: 'Drift (m)', color: '#cbd5e1' },
                    ticks: { color: '#9eb3d3' },
                    grid: { color: 'rgba(255,255,255,.06)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#edf4ff' } },
                tooltip: {
                    callbacks: {
                        title: items => `Log t = ${formatTimeAxis(items[0].parsed.x)}`,
                        label: item => `Drift: ${item.parsed.y.toFixed(1)} m`
                    }
                }
            }
        }
    });
}

// ─── File Loading ──────────────────────────────────────────────────────────────

function loadVideo(file) {
    const url = URL.createObjectURL(file);
    video.src = url;
    
    video.onloadedmetadata = () => {
        els.videoInfo.textContent = `${file.name} • ${video.videoWidth}×${video.videoHeight} • ${video.duration.toFixed(2)} s`;
        els.scrubber.max = video.duration || 0;
        setStatus('Video loaded successfully.');
        updateTimeReadout();
    };
}

async function parseBinFile(file) {
    const buffer = await file.arrayBuffer();
    
    if (typeof DataflashParser === 'undefined') {
        throw new Error('DataflashParser is not available.');
    }
    
    const parser = new DataflashParser(false);
    const parsed = parser.processData(buffer, ['BARO', 'ARSP', 'GPS', 'NKF1', 'XKF1', 'POS']);
    
    const baroMsg = parsed?.messages?.['BARO[0]'] || parsed?.messages?.BARO;
    const arspMsg = parsed?.messages?.['ARSP[0]'] || parsed?.messages?.ARSP;
    const gpsMsg = parsed?.messages?.['GPS[0]'] || parsed?.messages?.GPS;
    const posMsg = parsed?.messages?.['POS'] || null;
    const nkf1Msg = parsed?.messages?.['NKF1[0]'] || parsed?.messages?.NKF1 || null;
    const xkf1Msg = parsed?.messages?.['XKF1[0]'] || parsed?.messages?.XKF1 || null;
    const orgnMsg = parsed?.messages?.['ORGN[0]'] || parsed?.messages?.ORGN || null;
    
    telemetry = {
        alt: [], airspeed: [], lat: [], lng: [],
        groundSpeed: [], heading: [], climb: [], sats: [], hdop: [],
        pos: { lat: [], lng: [] }
    };
    
    let baseTime = null;
    
    if (baroMsg?.time_boot_ms && baroMsg?.Alt) {
        const raw = Array.from(baroMsg.Alt)
            .map((alt, i) => ({ timeAbs: Number(baroMsg.time_boot_ms[i]) / 1000, value: Number(alt) }))
            .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
            .sort((a, b) => a.timeAbs - b.timeAbs);
        if (raw.length) { baseTime = raw[0].timeAbs; telemetry.alt = raw; }
    }
    
    if (arspMsg?.time_boot_ms && arspMsg?.Airspeed) {
        const raw = Array.from(arspMsg.Airspeed)
            .map((v, i) => ({ timeAbs: Number(arspMsg.time_boot_ms[i]) / 1000, value: Number(v) }))
            .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
            .sort((a, b) => a.timeAbs - b.timeAbs);
        if (raw.length) { if (baseTime == null) baseTime = raw[0].timeAbs; telemetry.airspeed = raw; }
    }
    
    if (gpsMsg?.time_boot_ms) {
        const mk = (arr, scale = 1) =>
            Array.from(arr || [])
                .map((v, i) => ({ timeAbs: Number(gpsMsg.time_boot_ms[i]) / 1000, value: Number(v) * scale }))
                .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
                .sort((a, b) => a.timeAbs - b.timeAbs);
        
        const rawLat = mk(gpsMsg.Lat, 1/1e7);
        const rawLng = mk(gpsMsg.Lng, 1/1e7);
        
        // Filter out invalid GPS coordinates (0,0) and extreme outliers
        const validGpsIndices = rawLat
            .map((p, i) => {
                const lat = p.value;
                const lng = rawLng[i]?.value;
                // Valid GPS: lat between -90 and 90, lng between -180 and 180, and not (0,0)
                const isValid = Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01 &&
                               Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
                return isValid ? i : -1;
            })
            .filter(i => i >= 0);
        
        const filteredLat = validGpsIndices.map(i => rawLat[i]);
        const filteredLng = validGpsIndices.map(i => rawLng[i]);
        
        const rawGSpd = mk(gpsMsg.Spd);
        const rawHead = mk(gpsMsg.GCrs);
        
        if (filteredLat.length) { if (baseTime == null) baseTime = filteredLat[0].timeAbs; telemetry.lat = filteredLat; }
        if (filteredLng.length) { if (baseTime == null) baseTime = filteredLng[0].timeAbs; telemetry.lng = filteredLng; }
        if (rawGSpd.length) telemetry.groundSpeed = rawGSpd;
        if (rawHead.length) telemetry.heading = rawHead;
    }
    
    if (posMsg?.time_boot_ms && posMsg?.Lat && posMsg?.Lng) {
        const mk = (arr, scale = 1) =>
            Array.from(arr || [])
                .map((v, i) => ({ timeAbs: Number(posMsg.time_boot_ms[i]) / 1000, value: Number(v) * scale }))
                .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
                .sort((a, b) => a.timeAbs - b.timeAbs);
        
        // POS Lat/Lng are already in degrees (not scaled by 1e7 like GPS)
        const rawLat = mk(posMsg.Lat, 1);
        const rawLng = mk(posMsg.Lng, 1);
        
        // Filter out invalid POS coordinates (0,0) and extreme outliers
        const validPosIndices = rawLat
            .map((p, i) => {
                const lat = p.value;
                const lng = rawLng[i]?.value;
                const isValid = Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01 &&
                               Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
                return isValid ? i : -1;
            })
            .filter(i => i >= 0);
        
        const filteredLat = validPosIndices.map(i => rawLat[i]);
        const filteredLng = validPosIndices.map(i => rawLng[i]);
        
        if (filteredLat.length && filteredLng.length) {
            if (baseTime == null) baseTime = filteredLat[0].timeAbs;
            telemetry.pos.lat = filteredLat;
            telemetry.pos.lng = filteredLng;
        }
    } else if ((nkf1Msg || xkf1Msg) && orgnMsg) {
        // Fallback: NKF1/XKF1 has PN/PE (north/east in meters), ORGN has origin lat/lng
        const ekfMsg = nkf1Msg || xkf1Msg;
        
        if (ekfMsg?.time_boot_ms && ekfMsg?.PN && ekfMsg?.PE && orgnMsg?.Lat && orgnMsg?.Lng) {
            // Get origin (first ORGN message)
            const originLat = Number(orgnMsg.Lat[0]) / 1e7;
            const originLng = Number(orgnMsg.Lng[0]) / 1e7;
            
            if (Math.abs(originLat) > 0.01 && Math.abs(originLng) > 0.01) {
                const mk = (arr) =>
                    Array.from(arr || [])
                        .map((v, i) => ({ timeAbs: Number(ekfMsg.time_boot_ms[i]) / 1000, value: Number(v) }))
                        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
                        .sort((a, b) => a.timeAbs - b.timeAbs);
                
                const northMeters = mk(ekfMsg.PN);  // Meters north of origin
                const eastMeters = mk(ekfMsg.PE);   // Meters east of origin
                
                if (northMeters.length && eastMeters.length) {
                    // Convert meters to lat/lng offset
                    const metersToLat = 1 / 111320;  // 1 degree latitude ≈ 111.32 km
                    const metersToLng = 1 / (111320 * Math.cos(originLat * Math.PI / 180));
                    
                    const posLat = northMeters.map((p, i) => ({
                        timeAbs: p.timeAbs,
                        value: originLat + p.value * metersToLat
                    }));
                    
                    const posLng = eastMeters.map((p, i) => ({
                        timeAbs: p.timeAbs,
                        value: originLng + p.value * metersToLng
                    }));
                    
                    // Filter valid
                    const validIndices = posLat
                        .map((p, i) => {
                            const lat = p.value;
                            const lng = posLng[i]?.value;
                            const isValid = Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01 &&
                                           Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
                            return isValid ? i : -1;
                        })
                        .filter(i => i >= 0);
                    
                    const filteredLat = validIndices.map(i => posLat[i]);
                    const filteredLng = validIndices.map(i => posLng[i]);
                    
                    if (filteredLat.length && filteredLng.length) {
                        if (baseTime == null) baseTime = filteredLat[0].timeAbs;
                        telemetry.pos.lat = filteredLat;
                        telemetry.pos.lng = filteredLng;
                    }
                }
            }
        }
    }
    
    if (baseTime == null) throw new Error('No usable BARO, ARSP, or GPS telemetry found.');
    
    const normalise = series =>
        series.map(p => ({ timeAbs: p.timeAbs, time: p.timeAbs - baseTime, value: p.value }));
    
    telemetry.alt = normalise(telemetry.alt);
    telemetry.airspeed = normalise(telemetry.airspeed);
    telemetry.lat = normalise(telemetry.lat);
    telemetry.lng = normalise(telemetry.lng);
    telemetry.groundSpeed = normalise(telemetry.groundSpeed);
    telemetry.heading = normalise(telemetry.heading);
    telemetry.pos.lat = normalise(telemetry.pos.lat);
    telemetry.pos.lng = normalise(telemetry.pos.lng);
    
    if (telemetry.alt.length > 1) {
        telemetry.climb = telemetry.alt.map((p, i, arr) => {
            if (i === 0) return { timeAbs: p.timeAbs, time: p.time, value: 0 };
            const prev = arr[i-1];
            const dt = p.time - prev.time;
            const dv = p.value - prev.value;
            return { timeAbs: p.timeAbs, time: p.time, value: dt > 0 ? dv / dt : 0 };
        });
    }
    
    if (!telemetry.alt.length) throw new Error('No BARO altitude data found.');
    
    selectedLogTime = null;
    els.selectedLogTimeBox.value = '0';
    
    updateStats();
    renderPlot();
    updateLiveOverlay();
    
    if (telemetry.lat.length && telemetry.lng.length) {
        const midIdx = Math.floor(telemetry.lat.length / 2);
        const cLat = telemetry.lat[midIdx].value;
        const cLng = telemetry.lng[midIdx].value;
        
        if (!map) {
            initMap(cLng, cLat);
            map.on('load', () => {
                const outages = renderFlightPath();
                const driftPts = computeDrift(outages);
                renderDriftPlot(outages, driftPts);
                fitMapToFlight();
            });
        } else {
            const outages = renderFlightPath();
            const driftPts = computeDrift(outages);
            renderDriftPlot(outages, driftPts);
            fitMapToFlight();
        }
    }
    
    const hasPOS = telemetry.pos.lat.length > 0;
    
    setStatus(
        `Parsed Alt: ${telemetry.alt.length}, Airspeed: ${telemetry.airspeed.length}, ` +
        `GPS Lat: ${telemetry.lat.length}, GPS Lng: ${telemetry.lng.length}` +
        (hasPOS ? `, POS (EKF): ${telemetry.pos.lat.length}` : ' — no POS/EKF data')
    );
}

async function loadFiles() {
    const videoInput = document.getElementById('videoFile');
    const binInput = document.getElementById('binFile');
    
    try {
        if (videoInput.files.length > 0) {
            loadVideo(videoInput.files[0]);
        }
        
        if (binInput.files.length > 0) {
            await parseBinFile(binInput.files[0]);
        } else {
            throw new Error('Please choose a .bin file.');
        }
        
        video.ontimeupdate = () => {
            updateLiveOverlay();
            els.scrubber.value = video.currentTime || 0;
        };
        video.onplay = () => updateLiveOverlay();
        video.onseeked = () => updateLiveOverlay();
        
        setStatus('Files loaded. Seek video, click plot, then press Set Sync Point.');
    } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to load files.');
        setStatus(err.message || 'Failed to load files.');
    }
}

async function loadMissionPlan() {
    const input = document.getElementById('missionFile');
    if (!input.files.length) {
        alert('Please select a mission.plan file');
        return;
    }
    
    try {
        await parseMissionPlan(input.files[0]);
        
        // Re-compute drift with new reference
        if (telemetry.lat.length) {
            const outages = detectGpsOutages();
            const driftPts = computeDrift(outages);
            renderDriftPlot(outages, driftPts);
        }
    } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to load mission plan.');
    }
}

async function loadSecondaryLog() {
    const input = document.getElementById('secondBinFile');
    if (!input.files.length) {
        alert('Please select a second .bin log file');
        return;
    }
    
    try {
        await parseSecondaryBin(input.files[0]);
        
        // Get time offset from user
        const offsetInput = document.getElementById('secondLogOffset');
        if (offsetInput) {
            secondaryLogTimeOffset = parseFloat(offsetInput.value) || 0;
        }
        
        // Re-compute drift with new reference
        if (telemetry.lat.length) {
            const outages = detectGpsOutages();
            const driftPts = computeDrift(outages);
            renderDriftPlot(outages, driftPts);
        }
    } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to load secondary log.');
    }
}

function recomputeDrift() {
    if (!telemetry.lat.length) return;
    
    const outages = detectGpsOutages();
    const driftPts = computeDrift(outages);
    renderDriftPlot(outages, driftPts);
    
    setStatus('Drift recomputed with new reference source.');
}

// ─── Sync Functions ────────────────────────────────────────────────────────────

function setSyncPoint() {
    if (selectedLogTime == null) {
        alert('Click the plot first to select the matching log time.');
        return;
    }
    
    const videoTime = video.currentTime || 0;
    syncOffset = videoTime - selectedLogTime;
    
    updateTimeReadout();
    alert(
        `Sync successful!\n\n` +
        `Video time: ${videoTime.toFixed(3)} s\n` +
        `Log time: ${selectedLogTime.toFixed(3)} s\n` +
        `Offset: ${syncOffset.toFixed(3)} s`
    );
}

function resetSync() {
    syncOffset = 0;
    selectedLogTime = null;
    els.selectedLogTimeBox.value = '0';
    updateTimeReadout();
    if (chart) chart.update();
    setStatus('Sync reset.');
}

// ─── Export Functions ──────────────────────────────────────────────────────────

async function startExport() {
    if (isExporting) return;
    if (!telemetry.alt.length) { alert('Load telemetry first.'); return; }
    if (!video.src) { alert('Load a video first.'); return; }
    
    isExporting = true;
    els.exportBtn.disabled = true;
    els.exportBtn.textContent = 'Exporting… keep tab open';
    
    exportCanvas = document.createElement('canvas');
    exportCanvas.width = video.videoWidth || 2560;
    exportCanvas.height = video.videoHeight || 1440;
    exportCtx = exportCanvas.getContext('2d', { alpha: false });
    
    const stream = exportCanvas.captureStream(30);
    
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
    
    recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 50000000
    });
    
    recordedChunks = [];
    recorder.ondataavailable = e => {
        if (e.data && e.data.size) recordedChunks.push(e.data);
    };
    
    recorder.onstop = () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flight_overlay.${ext}`;
        a.click();
        
        isExporting = false;
        els.exportBtn.disabled = false;
        els.exportBtn.textContent = 'Export Overlaid Video';
        alert(`Export finished. Downloaded as ${a.download}`);
    };
    
    recorder.start();
    video.currentTime = 0;
    
    video.play().then(() => exportFrameLoop()).catch(err => {
        console.error(err);
        isExporting = false;
        els.exportBtn.disabled = false;
        els.exportBtn.textContent = 'Export Overlaid Video';
    });
}

function exportFrameLoop() {
    if (!recorder || recorder.state !== 'recording') return;
    
    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height);
    
    const videoTime = video.currentTime || 0;
    const logTime = videoTime - syncOffset;
    
    drawExportOverlay(exportCtx, exportCanvas, logTime);
    
    if (video.currentTime < video.duration - 0.05) {
        requestAnimationFrame(exportFrameLoop);
    } else {
        video.pause();
        recorder.stop();
    }
}

// ─── Ready ─────────────────────────────────────────────────────────────────────

console.log('Flight Overlay Studio ready. Load video + BIN file to begin.');

// ─── Export Checked Data to CSV using Precise BARO[0].Alt coordinates ─────────
function exportCSV() {
    if (!telemetry.alt || telemetry.alt.length === 0) {
        alert("No telemetry data to export.");
        return;
    }

    let headers = ["Time", "Altitude (m)"];
    let activeFields = [];

    if (overlayFields.airspeed) { headers.push("Airspeed (m/s)"); activeFields.push({name:"airspeed", series:telemetry.airspeed}); }
    if (overlayFields.lat)      { headers.push("Latitude"); activeFields.push({name:"lat", series:telemetry.lat}); }
    if (overlayFields.lng)      { headers.push("Longitude"); activeFields.push({name:"lng", series:telemetry.lng}); }
    if (overlayFields.groundSpeed){ headers.push("Ground Speed (m/s)"); activeFields.push({name:"groundSpeed", series:telemetry.groundSpeed}); }
    if (overlayFields.heading)  { headers.push("Heading (deg)"); activeFields.push({name:"heading", series:telemetry.heading}); }
    if (overlayFields.climb)    { headers.push("Climb Rate (m/s)"); activeFields.push({name:"climb", series:telemetry.climb}); }

    let csvRows = [headers.join(";")];

    // Get the first item's time to use as the zero baseline
    const firstLogTime = telemetry.alt[0].time;

    telemetry.alt.forEach(item => {
        // Calculate total seconds elapsed since the start of the log
        let elapsedSeconds = item.time - firstLogTime;
        if (elapsedSeconds < 0) elapsedSeconds = 0; // Guard against rounding edge cases

        // Format into HH:MM:SS.mmm
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = Math.floor(elapsedSeconds % 60);
        const milliseconds = Math.floor((elapsedSeconds % 1) * 1000);

        const timeStr = 
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0') + '.' +
            String(milliseconds).padStart(3, '0');

        let row = [timeStr, item.value.toFixed(2)];

        activeFields.forEach(f => {
            const val = getInterpolatedValue(f.series, item.time);
            row.push(val == null ? "" : val.toFixed(f.name === "lat" || f.name === "lng" ? 6 : 2));
        });

        csvRows.push(row.join(";"));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "telemetry_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}