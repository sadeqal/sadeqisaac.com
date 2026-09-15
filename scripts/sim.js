// ═══════════════════════════════════════════════════════════════════════════════
// SVS Flight Replay — telemetry state, .bin parsing, satellite overview map and
// the real-time (interpolated) playback engine that drives every HUD panel.
// ═══════════════════════════════════════════════════════════════════════════════

let telemetry = {
    gps: { lat: [], lng: [], alt: [], dist: [], speed: [] },
    baro: [],
    airspeed: [],
    battery: { volt: [], curr: [] }, // legacy simple pack, kept for backward compatibility
    att: { roll: [], pitch: [], yaw: [] },
    mode: [],
    esc: {},   // { 4: {rpm:[],rawRpm:[],volt:[],curr:[],temp:[],motTemp:[],err:[]}, 5:{...}, 6:{...}, 7:{...} }
    bat: {},   // { <instance>: {volt:[],voltR:[],curr:[],currTot:[],enrgTot:[],temp:[],res:[],remPct:[]} }
    csrv: {}   // { 1:{pos:[],force:[],speed:[],pow:[],posCmd:[],v:[],a:[],motT:[],pcbT:[],err:[]}, 2:{...}, 4:{...}, 9:{...} }
};

let flightInfo = {
    firmware: '—',
    vehicle: 'VTOL UAV',
    duration: 0,
    distance: 0,
    maxAlt: 0,
    maxSpeed: 0
};

// Fixed physical mapping supplied by the operator: dataflash ESC instance -> real motor.
// Codes like "1A"/"6C" are internal wiring labels only - the UI never shows them, just the
// physical position (front/rear, left/right) to keep the dashboard readable at a glance.
const MOTOR_MAP = {
    4: { code: '1A', label: 'FRONTAL DERECHO' },
    5: { code: '6C', label: 'TRASERO IZQUIERDO' },
    6: { code: '7D', label: 'FRONTAL IZQUIERDO' },
    7: { code: '8B', label: 'TRASERO DERECHO' }
};
// Rear pusher/cruise motor (only Volt/Curr/Temp available for this one, no RPM).
// NOTE: assumed to be ESC instance 0 - tell me if the tail motor logs under a different
// ESC index and this is trivial to repoint.
const TAIL_MOTOR_INST = 0;

let simMap = null;
let aircraftMarker = null;
let isSimulatingFlight = false;
let simAnimationId = null;
let simStartTimeReal = 0;   // performance.now() when playback was last (re)started
let simStartTimeLog = 0;    // telemetry time (seconds) that corresponds to simStartTimeReal
let currentSimTime = 0;
let isUserInteractingWithSlider = false;
let playbackSpeed = 1;

let displayYaw = null; // lightly smoothed heading used only for the marker icon rotation
const YAW_SMOOTHING = 0.35;

let lastPathUpdateTime = -999;

// ─── Small DOM helpers ──────────────────────────────────────────────────────────
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function formatClock(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function haversineMetres(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeBearingDeg(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
}

// Linear interpolation across a sorted-ascending {time, value} series. This is what
// removes the visible "stepped" jumps at 1x: instead of snapping to the nearest logged
// sample, every animation frame reconstructs the true value at the exact playback time.
function interpAt(series, t) {
    if (!series || !series.length) return null;
    const n = series.length;
    if (t <= series[0].time) return series[0].value;
    if (t >= series[n - 1].time) return series[n - 1].value;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (series[mid].time <= t) lo = mid; else hi = mid;
    }
    const a = series[lo], b = series[hi];
    const span = b.time - a.time;
    const f = span > 0 ? (t - a.time) / span : 0;
    return a.value + (b.value - a.value) * f;
}

// Same idea but for wrap-around angles (heading/yaw 0-360°), taking the shortest path.
function interpAngleAt(series, t) {
    if (!series || !series.length) return null;
    const n = series.length;
    if (t <= series[0].time) return series[0].value;
    if (t >= series[n - 1].time) return series[n - 1].value;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (series[mid].time <= t) lo = mid; else hi = mid;
    }
    const a = series[lo], b = series[hi];
    const span = b.time - a.time;
    const f = span > 0 ? (t - a.time) / span : 0;
    let diff = b.value - a.value;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return a.value + diff * f;
}

// Last discrete value at/before time t (used for flight-mode text, which changes in
// steps rather than continuously).
function stepAtOrBefore(series, t, field) {
    if (!series || !series.length) return null;
    let result = series[0];
    for (let i = 0; i < series.length; i++) {
        if (series[i].time <= t) result = series[i]; else break;
    }
    return field ? result[field] : result.value;
}

// Some flights have real multi-minute holes in the log (vehicle idle/disarmed while the
// board kept logging). Returns how wide the surrounding gap is at time t, so the UI can
// show a "SEÑAL PERDIDA" warning instead of silently drawing a deceptive flat line.
const SIGNAL_GAP_THRESHOLD_SEC = 4;
function dataGapAt(series, t) {
    if (!series || series.length < 2) return 0;
    if (t <= series[0].time || t >= series[series.length - 1].time) return 0;
    let lo = 0, hi = series.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (series[mid].time <= t) lo = mid; else hi = mid;
    }
    return series[hi].time - series[lo].time;
}

// ─── BIN File Parser ───────────────────────────────────────────────────────────
async function parseBinFile(file) {
    const buffer = await file.arrayBuffer();

    if (typeof DataflashParser === 'undefined') {
        throw new Error('DataflashParser no disponible.');
    }

    const parser = new DataflashParser(false);
    const parsed = parser.processData(buffer, [
        'GPS', 'POS', 'BARO', 'IMU', 'ARSP', 'BAT', 'MSG', 'FMT', 'ATT', 'MODE', 'ESC', 'CSRV'
    ]);

    telemetry = {
        gps: { lat: [], lng: [], alt: [], dist: [], speed: [], nsats: [], fixStatus: [] },
        baro: [],
        airspeed: [],
        battery: { volt: [], curr: [] },
        att: { roll: [], pitch: [], yaw: [] },
        mode: [],
        esc: {},
        bat: {},
        csrv: {}
    };

    let baseTime = null;

    const buildSeries = (msg, field) => {
        if (!msg || !msg.time_boot_ms || !msg[field]) return [];
        return Array.from(msg[field])
            .map((v, i) => ({ timeAbs: Number(msg.time_boot_ms[i]) / 1000, value: Number(v) }))
            .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
            .sort((a, b) => a.timeAbs - b.timeAbs);
    };

    // ─── GROUND TRACK: prefer POS (EKF-blended, logged ~5x denser) over raw
    // GPS, which can carry long real gaps in some logs. RelHomeAlt in POS is
    // already "altitude above home" — exactly what a GCS displays as ALT.
    const posMsg = parsed?.messages?.POS;
    const gpsMsg = parsed?.messages?.['GPS[0]'] || parsed?.messages?.GPS;

    const extractTrack = (msg, altField) => {
        if (!msg?.time_boot_ms || !msg?.Lat || !msg?.Lng) return null;
        const rawLat = buildSeries(msg, 'Lat').map(p => ({ ...p, value: p.value / 1e7 }));
        const rawLng = buildSeries(msg, 'Lng').map(p => ({ ...p, value: p.value / 1e7 }));
        const rawAlt = altField
            ? buildSeries(msg, altField)
            : buildSeries(msg, 'Alt').map(p => ({ ...p, value: p.value / 1000 }));
        const validIndices = rawLat.map((p, i) => {
            const lat = p.value, lng = rawLng[i]?.value;
            return (Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) ? i : -1;
        }).filter(i => i >= 0);
        if (!validIndices.length) return null;
        return {
            lat: validIndices.map(i => rawLat[i]),
            lng: validIndices.map(i => rawLng[i]),
            alt: validIndices.map(i => rawAlt[i])
        };
    };

    const track = extractTrack(posMsg, 'RelHomeAlt') || extractTrack(gpsMsg, null);
    if (!track) throw new Error('No se encontraron datos de posición en este log.');

    telemetry.gps.lat = track.lat;
    telemetry.gps.lng = track.lng;
    telemetry.gps.alt = track.alt;
    baseTime = telemetry.gps.lat[0].timeAbs;

    // ─── GPS satellite count / fix status (always read from the raw GPS message,
    // even when POS is used for the actual track) ──────────────────────────
    telemetry.gps.nsats = buildSeries(gpsMsg, 'NSats');
    telemetry.gps.fixStatus = buildSeries(gpsMsg, 'Status');

    // ─── BARO (secondary altitude source, used only if POS/GPS has none) ────
    const baroMsg = parsed?.messages?.['BARO[0]'] || parsed?.messages?.BARO;
    telemetry.baro = buildSeries(baroMsg, 'Alt');

    // ─── AIRSPEED ────────────────────────────────────────────────────────────
    const arspMsg = parsed?.messages?.['ARSP[0]'] || parsed?.messages?.ARSP;
    telemetry.airspeed = buildSeries(arspMsg, 'Airspeed');

    // ─── ATTITUDE ────────────────────────────────────────────────────────────
    const attMsg = parsed?.messages?.['ATT[0]'] || parsed?.messages?.ATT;
    telemetry.att.roll = buildSeries(attMsg, 'Roll');
    telemetry.att.pitch = buildSeries(attMsg, 'Pitch');
    telemetry.att.yaw = buildSeries(attMsg, 'Yaw');

    // ─── FLIGHT MODE TIMELINE ────────────────────────────────────────────────
    const modeMsg = parsed?.messages?.MODE;
    if (modeMsg?.time_boot_ms && modeMsg?.Mode) {
        telemetry.mode = Array.from(modeMsg.time_boot_ms).map((tms, i) => ({
            timeAbs: Number(tms) / 1000,
            value: (modeMsg.asText && modeMsg.asText[i]) ? modeMsg.asText[i] : `MODO ${modeMsg.Mode[i]}`
        })).filter(p => Number.isFinite(p.timeAbs)).sort((a, b) => a.timeAbs - b.timeAbs);
    }

    // ─── PROPULSION: 4 lift motors (ESC[4..7]) + rear pusher/tail motor ────────
    const motorInstances = [...Object.keys(MOTOR_MAP).map(Number), TAIL_MOTOR_INST];
    motorInstances.forEach(inst => {
        const escMsg = parsed?.messages?.[`ESC[${inst}]`];
        telemetry.esc[inst] = {
            rpm: buildSeries(escMsg, 'RPM'),
            rawRpm: buildSeries(escMsg, 'RawRPM'),
            volt: buildSeries(escMsg, 'Volt'),
            curr: buildSeries(escMsg, 'Curr'),
            temp: buildSeries(escMsg, 'Temp'),
            motTemp: buildSeries(escMsg, 'MotTemp'),
            err: buildSeries(escMsg, 'Err')
        };
    });

    // ─── POWER SYSTEM: every BAT[n] instance actually present in the log ────
    const batKeys = Object.keys(parsed?.messages || {}).filter(k => /^BAT\[\d+\]$/.test(k));
    let batInstances = batKeys.map(k => Number(k.match(/\[(\d+)\]/)[1])).sort((a, b) => a - b);
    if (!batInstances.length && parsed?.messages?.BAT) batInstances = [0];

    batInstances.forEach(inst => {
        const batMsg = parsed?.messages?.[`BAT[${inst}]`] || (inst === 0 ? parsed?.messages?.BAT : null);
        telemetry.bat[inst] = {
            volt: buildSeries(batMsg, 'Volt'),
            voltR: buildSeries(batMsg, 'VoltR'),
            curr: buildSeries(batMsg, 'Curr'),
            currTot: buildSeries(batMsg, 'CurrTot'),
            enrgTot: buildSeries(batMsg, 'EnrgTot'),
            temp: buildSeries(batMsg, 'Temp'),
            remPct: buildSeries(batMsg, 'RemPct')
        };
    });
    // Kept for any legacy readouts: first battery instance mirrored into telemetry.battery
    if (batInstances.length) {
        telemetry.battery.volt = telemetry.bat[batInstances[0]].volt;
        telemetry.battery.curr = telemetry.bat[batInstances[0]].curr;
    }

    // ─── CONTROL SURFACES: CSRV[1,2,4,9] servo feedback ─────────────────────
    [1, 2, 4, 9].forEach(id => {
        const csrvMsg = parsed?.messages?.[`CSRV[${id}]`];
        telemetry.csrv[id] = {
            pos: buildSeries(csrvMsg, 'Pos'),
            force: buildSeries(csrvMsg, 'Force'),
            speed: buildSeries(csrvMsg, 'Speed'),
            pow: buildSeries(csrvMsg, 'Pow'),
            posCmd: buildSeries(csrvMsg, 'PosCmd'),
            v: buildSeries(csrvMsg, 'V'),
            a: buildSeries(csrvMsg, 'A'),
            motT: buildSeries(csrvMsg, 'MotT'),
            pcbT: buildSeries(csrvMsg, 'PCBT'),
            err: buildSeries(csrvMsg, 'Err')
        };
    });

    // ─── Flight / firmware info ──────────────────────────────────────────────
    const msgData = parsed?.messages?.MSG;
    if (msgData?.Message) {
        const msgs = Array.from(msgData.Message || []).map(m => String(m));
        const fwMsg = msgs.find(m => m.includes('ArduPlane') || m.includes('ArduCopter') || m.includes('ArduRover'));
        if (fwMsg) {
            flightInfo.firmware = fwMsg.trim();
            if (fwMsg.includes('ArduPlane')) flightInfo.vehicle = 'VTOL / Ala Fija';
            else if (fwMsg.includes('ArduCopter')) flightInfo.vehicle = 'Multirrotor';
            else if (fwMsg.includes('ArduRover')) flightInfo.vehicle = 'Rover';
        }
    }

    // ─── Normalize every series to a common flight-relative time base ───────
    const normalize = series => series.map(p => ({ ...p, time: p.timeAbs - baseTime }));

    telemetry.gps.lat = normalize(telemetry.gps.lat);
    telemetry.gps.lng = normalize(telemetry.gps.lng);
    telemetry.gps.alt = normalize(telemetry.gps.alt);
    telemetry.gps.nsats = normalize(telemetry.gps.nsats);
    telemetry.gps.fixStatus = normalize(telemetry.gps.fixStatus);
    telemetry.baro = normalize(telemetry.baro);
    telemetry.airspeed = normalize(telemetry.airspeed);
    telemetry.att.roll = normalize(telemetry.att.roll);
    telemetry.att.pitch = normalize(telemetry.att.pitch);
    telemetry.att.yaw = normalize(telemetry.att.yaw);
    telemetry.mode = normalize(telemetry.mode);

    Object.values(telemetry.esc).forEach(m => {
        Object.keys(m).forEach(k => { m[k] = normalize(m[k]); });
    });
    Object.values(telemetry.bat).forEach(m => {
        Object.keys(m).forEach(k => { m[k] = normalize(m[k]); });
    });
    Object.values(telemetry.csrv).forEach(m => {
        Object.keys(m).forEach(k => { m[k] = normalize(m[k]); });
    });
    telemetry.battery.volt = normalize(telemetry.battery.volt);
    telemetry.battery.curr = normalize(telemetry.battery.curr);

    // ─── Cumulative ground-track distance + derived groundspeed ─────────────
    // Precomputed once here so the status bar can just interpolate at any playback time,
    // instead of re-summing the whole track on every animation frame.
    let cum = 0;
    telemetry.gps.dist = telemetry.gps.lat.map((p, i) => {
        if (i > 0) {
            cum += haversineMetres(
                telemetry.gps.lat[i - 1].value, telemetry.gps.lng[i - 1].value,
                p.value, telemetry.gps.lng[i].value
            );
        }
        return { time: p.time, value: cum };
    });
    telemetry.gps.speed = [];
    for (let i = 1; i < telemetry.gps.lat.length; i++) {
        const dt = telemetry.gps.lat[i].time - telemetry.gps.lat[i - 1].time;
        if (dt <= 0) continue;
        const d = haversineMetres(
            telemetry.gps.lat[i - 1].value, telemetry.gps.lng[i - 1].value,
            telemetry.gps.lat[i].value, telemetry.gps.lng[i].value
        );
        telemetry.gps.speed.push({ time: (telemetry.gps.lat[i].time + telemetry.gps.lat[i - 1].time) / 2, value: d / dt });
    }

    // ─── Flight summary stats ────────────────────────────────────────────────
    flightInfo.duration = telemetry.gps.lat.length ? telemetry.gps.lat[telemetry.gps.lat.length - 1].time : 0;
    flightInfo.distance = telemetry.gps.dist.length ? telemetry.gps.dist[telemetry.gps.dist.length - 1].value : 0;
    flightInfo.maxAlt = telemetry.baro.length ? telemetry.baro.reduce((m, p) => Math.max(m, p.value), -Infinity) : 0;
    flightInfo.maxSpeed = telemetry.airspeed.length
        ? telemetry.airspeed.reduce((m, p) => Math.max(m, p.value), -Infinity)
        : telemetry.gps.speed.reduce((m, p) => Math.max(m, p.value), 0);

    return flightInfo;
}

// ─── File Upload Entry Point ─────────────────────────────────────────────────
async function loadAndAnalyze() {
    const binInput = window.uploadedBinFileRef;
    if (!binInput || !binInput.files || !binInput.files.length) {
        alert('Por favor, selecciona un archivo .bin');
        return;
    }

    try {
        await parseBinFile(binInput.files[0]);
        setupSimMap();
        buildBatteryCards();

        const duration = flightInfo.duration || 0;
        const slider = document.getElementById('timelineSlider');
        if (slider) { slider.max = duration; slider.value = 0; }
        setText('totalDurationStamp', formatClock(duration));

        currentSimTime = 0;
        displayYaw = null;
        renderAtTime(0);
        syncTopbarHeight();
    } catch (err) {
        console.error(err);
        alert(err.message || 'Error al procesar la simulación');
    }
}

async function handleFileLoading(inputElement) {
    if (!inputElement.files.length) return;
    document.getElementById('uploadSpinner').style.display = 'block';
    window.uploadedBinFileRef = inputElement;
    await loadAndAnalyze();
    document.getElementById('uploadLayer').classList.add('fade-out');
}

// ─── Satellite Overview Map ──────────────────────────────────────────────────
// A single, fixed, top-down satellite view scoped to the whole trajectory — no chase
// camera, no giant 3D model hogging the screen. The route is NOT pre-drawn: it only
// appears as a live trace behind the aircraft as playback moves, like a real GCS track.
function setupSimMap() {
    const coords = telemetry.gps.lat.map((p, i) => [telemetry.gps.lng[i].value, p.value]);
    if (!coords.length) return;

    if (!simMap) {
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';

        simMap = new mapboxgl.Map({
            container: 'simMap',
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: coords[0],
            zoom: 15,
            pitch: 0,
            bearing: 0,
            attributionControl: false,
            pixelRatio: 2
        });

        simMap.on('load', () => {
            simMap.addSource('route-traveled', { type: 'geojson', data: lineFeature([coords[0]]) });
            simMap.addLayer({
                id: 'route-traveled', type: 'line', source: 'route-traveled',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#22d3ee', 'line-width': 3.5, 'line-opacity': 0.95 }
            });

            createAircraftMarker(coords[0]);
            recenterMap();
        });
    } else {
        simMap.getSource('route-traveled')?.setData(lineFeature([coords[0]]));
        if (aircraftMarker) aircraftMarker.setLngLat(coords[0]);
        recenterMap();
    }
}

function lineFeature(coords) {
    return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } };
}

function createAircraftMarker(lngLat) {
    if (aircraftMarker) return;
    const el = document.createElement('div');
    el.className = 'aircraft-marker';
    el.innerHTML = `
        <div class="aircraft-pulse"></div>
        <div class="aircraft-icon-rotator" id="aircraftRotator">
            <svg viewBox="0 0 24 24" width="30" height="30">
                <path d="M12 2 L19 20 L12 16 L5 20 Z" fill="#22d3ee" stroke="#03181c" stroke-width="0.8"/>
            </svg>
        </div>`;
    aircraftMarker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(lngLat).addTo(simMap);
}

function recenterMap() {
    if (!simMap || !telemetry.gps.lat.length) return;
    const lats = telemetry.gps.lat.map(p => p.value);
    const lngs = telemetry.gps.lng.map(p => p.value);
    simMap.fitBounds([
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
    ], { padding: 90, duration: 900, pitch: 0, bearing: 0 });
}

// ─── Playback Engine (continuous, interpolated, real elapsed time) ─────────────
function hasTelemetry() {
    return telemetry.gps.lat && telemetry.gps.lat.length > 0;
}

function setPlayIcon(playing) {
    const icon = document.getElementById('playPauseIcon');
    if (!icon) return;
    icon.innerHTML = playing
        ? '<rect x="5.5" y="4" width="4" height="16" rx="1.5"/><rect x="14.5" y="4" width="4" height="16" rx="1.5"/>'
        : '<path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z"/>';
}

function toggleFlightSimulation() {
    if (isSimulatingFlight) {
        isSimulatingFlight = false;
        cancelAnimationFrame(simAnimationId);
        setPlayIcon(false);
    } else {
        if (!hasTelemetry()) {
            alert('No hay datos de telemetría válidos cargados.');
            return;
        }
        isUserInteractingWithSlider = false;
        isSimulatingFlight = true;
        setPlayIcon(true);
        simStartTimeReal = performance.now();
        simStartTimeLog = currentSimTime;
        simAnimationId = requestAnimationFrame(runSimulationFrameLoop);
    }
}

function setPlaybackSpeed(value) {
    const v = parseFloat(value);
    if (!Number.isFinite(v) || v <= 0) return;
    if (isSimulatingFlight) {
        simStartTimeLog = currentSimTime;
        simStartTimeReal = performance.now();
    }
    playbackSpeed = v;
}

function onTimelineDragStart() {
    isUserInteractingWithSlider = true;
    if (isSimulatingFlight) toggleFlightSimulation();
}

function onTimelineSliderChange(value) {
    currentSimTime = parseFloat(value);
    renderAtTime(currentSimTime);
}

function runSimulationFrameLoop(nowMs) {
    if (!isSimulatingFlight) return;
    const duration = flightInfo.duration || 0;
    const elapsedReal = (nowMs - simStartTimeReal) / 1000;
    currentSimTime = simStartTimeLog + elapsedReal * playbackSpeed;

    if (currentSimTime >= duration) {
        currentSimTime = duration;
        renderAtTime(currentSimTime);
        isSimulatingFlight = false;
        setPlayIcon(false);
        return;
    }

    renderAtTime(currentSimTime);
    simAnimationId = requestAnimationFrame(runSimulationFrameLoop);
}

// The single per-frame render: samples every telemetry channel at time t via
// interpolation and pushes the results into the map, PFD and all HUD panels.
function renderAtTime(t) {
    if (!hasTelemetry()) return;

    const lat = interpAt(telemetry.gps.lat, t);
    const lng = interpAt(telemetry.gps.lng, t);
    const alt = telemetry.gps.alt.length ? interpAt(telemetry.gps.alt, t) : interpAt(telemetry.baro, t);

    const gap = dataGapAt(telemetry.gps.lat, t);
    updateSignalBadge(gap > SIGNAL_GAP_THRESHOLD_SEC);

    let yaw, pitch = 0, roll = 0;
    if (telemetry.att.yaw.length) {
        yaw = interpAngleAt(telemetry.att.yaw, t);
        pitch = interpAt(telemetry.att.pitch, t) ?? 0;
        roll = interpAt(telemetry.att.roll, t) ?? 0;
    } else {
        const la0 = interpAt(telemetry.gps.lat, Math.max(0, t - 0.3));
        const ln0 = interpAt(telemetry.gps.lng, Math.max(0, t - 0.3));
        const la1 = interpAt(telemetry.gps.lat, t + 0.3);
        const ln1 = interpAt(telemetry.gps.lng, t + 0.3);
        yaw = computeBearingDeg(la0, ln0, la1, ln1);
    }

    if (displayYaw === null) displayYaw = yaw;
    else {
        let d = yaw - displayYaw;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        displayYaw += d * YAW_SMOOTHING;
    }

    updateAircraftMarker(lng, lat, displayYaw);
    updateTraveledPath(t, lng, lat);
    drawPFD(roll, pitch);

    setText('pfd-alt', (alt ?? 0).toFixed(1));
    setText('pfd-hdg', Math.round(((yaw % 360) + 360) % 360).toString().padStart(3, '0'));

    const distSoFar = interpAt(telemetry.gps.dist, t);
    const speed = telemetry.airspeed.length ? interpAt(telemetry.airspeed, t) : interpAt(telemetry.gps.speed, t);
    updateStatusBar(t, alt, yaw, distSoFar, speed);

    updateMotorsPanel(t);
    updateBatteryPanel(t);
    updateServoPanel(t);

    if (!isUserInteractingWithSlider) {
        const slider = document.getElementById('timelineSlider');
        if (slider) slider.value = t;
    }
    setText('currentTimeStamp', formatClock(t));
}

function updateAircraftMarker(lng, lat, yawDeg) {
    if (!aircraftMarker || lng == null || lat == null) return;
    aircraftMarker.setLngLat([lng, lat]);
    const rotator = document.getElementById('aircraftRotator');
    if (rotator) rotator.style.transform = `rotate(${yawDeg}deg)`;
}

// Rebuilds the "traveled so far" bright polyline, throttled to ~8 updates/sec since a
// full GeoJSON rebuild every single animation frame would be wasted work on long flights.
function updateTraveledPath(t, lng, lat) {
    if (!simMap || !simMap.getSource('route-traveled')) return;
    if (Math.abs(t - lastPathUpdateTime) < 0.12) return;
    lastPathUpdateTime = t;

    const coords = [];
    for (let i = 0; i < telemetry.gps.lat.length; i++) {
        if (telemetry.gps.lat[i].time > t) break;
        coords.push([telemetry.gps.lng[i].value, telemetry.gps.lat[i].value]);
    }
    if (lng != null && lat != null) coords.push([lng, lat]);
    if (coords.length < 2) coords.push(coords[0] || [lng, lat]);
    simMap.getSource('route-traveled').setData(lineFeature(coords));
}

// ArduPilot GPS_FIX_TYPE values (dataflash GPS.Status field).
const GPS_FIX_LABELS = { 0: 'SIN GPS', 1: 'SIN FIX', 2: '2D', 3: '3D', 4: 'DGPS', 5: 'RTK FLOAT', 6: 'RTK FIJO' };

function updateStatusBar(t, alt, yaw, distSoFar, speed) {
    setText('statusClock', formatClock(t));
    setHtml('statusAlt', `${(alt ?? 0).toFixed(1)} <small>m</small>`);
    setHtml('statusSpeed', `${(speed ?? 0).toFixed(1)} <small>m/s</small>`);
    setText('statusHdg', Math.round(((yaw % 360) + 360) % 360).toString().padStart(3, '0') + '°');
    setHtml('statusDist', `${Math.round(distSoFar || 0)} <small>m</small>`);
    const modeTxt = telemetry.mode.length ? stepAtOrBefore(telemetry.mode, t, 'value') : null;
    setText('statusMode', modeTxt || '—');

    const nsats = telemetry.gps.nsats.length ? stepAtOrBefore(telemetry.gps.nsats, t) : null;
    setText('statusSats', nsats != null ? Math.round(nsats) : '—');
    const fix = telemetry.gps.fixStatus.length ? stepAtOrBefore(telemetry.gps.fixStatus, t) : null;
    setText('statusFix', fix != null ? (GPS_FIX_LABELS[Math.round(fix)] || fix) : '—');
}

// Flips the brand subtitle between "live mission" and a "signal lost" warning whenever
// playback crosses a real multi-second hole in the log (see dataGapAt / parseBinFile).
let lastSignalState = null;
function updateSignalBadge(isLost) {
    if (isLost === lastSignalState) return;
    lastSignalState = isLost;
    const dot = document.getElementById('signalDot');
    const text = document.getElementById('signalText');
    if (dot) dot.classList.toggle('signal-lost', isLost);
    if (text) text.textContent = isLost ? 'SEÑAL PERDIDA · SIN TELEMETRÍA' : 'MISIÓN EN VIVO';
}

// ─── Propulsion Panel: ESC[4..7] ──────────────────────────────────────────────
function updateMotorsPanel(t) {
    Object.keys(MOTOR_MAP).forEach(instStr => {
        const inst = Number(instStr);
        const d = telemetry.esc[inst];
        if (!d) return;
        const rpm = interpAt(d.rpm, t);
        const curr = interpAt(d.curr, t);
        const volt = interpAt(d.volt, t);
        const temp = interpAt(d.temp, t) ?? interpAt(d.motTemp, t);
        const err = interpAt(d.err, t);

        setText(`m${inst}-rpm`, rpm != null ? Math.round(rpm).toLocaleString('es-ES') : '—');
        setText(`m${inst}-volt`, volt != null ? volt.toFixed(1) : '—');
        setText(`m${inst}-curr`, curr != null ? curr.toFixed(1) : '—');
        setText(`m${inst}-temp`, temp != null ? temp.toFixed(0) : '—');

        const dot = document.getElementById(`m${inst}-status`);
        if (dot) dot.classList.toggle('warn', (temp != null && temp > 70) || (err != null && err > 5));
    });

    // Tail/pusher motor: only Volt/Curr/Temp are available, no RPM readout.
    const tail = telemetry.esc[TAIL_MOTOR_INST];
    if (tail) {
        const curr = interpAt(tail.curr, t);
        const volt = interpAt(tail.volt, t);
        const temp = interpAt(tail.temp, t) ?? interpAt(tail.motTemp, t);
        const err = interpAt(tail.err, t);

        setText(`m${TAIL_MOTOR_INST}-volt`, volt != null ? volt.toFixed(1) : '—');
        setText(`m${TAIL_MOTOR_INST}-curr`, curr != null ? curr.toFixed(1) : '—');
        setText(`m${TAIL_MOTOR_INST}-temp`, temp != null ? temp.toFixed(0) : '—');

        const dot = document.getElementById(`m${TAIL_MOTOR_INST}-status`);
        if (dot) dot.classList.toggle('warn', (temp != null && temp > 70) || (err != null && err > 5));
    }
}

// ─── Power System Panel: dynamic BAT[n] cards, tail node highlighted ─────────
function buildBatteryCards() {
    const grid = document.getElementById('batteryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const instances = Object.keys(telemetry.bat).map(Number).sort((a, b) => a - b);
    if (!instances.length) {
        grid.innerHTML = '<div class="empty-note">Sin datos de batería en este log.</div>';
        return;
    }

    // Heuristic: the instance with the highest average voltage is treated as the main
    // propulsion pack feeding the tail power-distribution node (per the CAN bus diagram).
    let tailInst = instances[0], bestV = -Infinity;
    instances.forEach(inst => {
        const arr = telemetry.bat[inst].volt;
        if (arr && arr.length) {
            const avg = arr.reduce((s, p) => s + p.value, 0) / arr.length;
            if (avg > bestV) { bestV = avg; tailInst = inst; }
        }
    });

    instances.forEach(inst => {
        const isTail = inst === tailInst;
        const card = document.createElement('div');
        card.className = 'battery-card' + (isTail ? ' tail-node' : '');
        
        // Determine battery title based on voltage heuristic
        let batTitle = `BATERÍA [${inst}]`;
        const arr = telemetry.bat[inst].volt;
        if (arr && arr.length) {
            const avg = arr.reduce((s, p) => s + p.value, 0) / arr.length;
            if (avg > 85) {
                batTitle = 'BATERÍA DE BOOMS VTOL';
            } else if (avg > 43) {
                batTitle = 'BATERÍA DE COLA';
            } else if (avg >= 20) {
                batTitle = 'BATERÍA DE AUTOPILOTO';
            }
        }
        
        card.innerHTML = `
            <div class="battery-card-head">
                <span class="battery-name">${batTitle}</span>
                <span class="battery-dot" id="bat${inst}-dot"></span>
            </div>
            <div class="battery-metrics">
                <div class="metric"><span class="metric-lbl">VOLT</span><span class="metric-val" id="bat${inst}-volt">—</span></div>
                <div class="metric"><span class="metric-lbl">CURR</span><span class="metric-val" id="bat${inst}-curr">—</span></div>
                <div class="metric"><span class="metric-lbl">USO</span><span class="metric-val" id="bat${inst}-used">—</span></div>
                <div class="metric"><span class="metric-lbl">TEMP</span><span class="metric-val" id="bat${inst}-temp">—</span></div>
            </div>
            <div class="battery-bar-track"><div class="battery-bar-fill" id="bat${inst}-fill"></div></div>`;
        grid.appendChild(card);
    });
}

function updateBatteryPanel(t) {
    Object.keys(telemetry.bat).forEach(k => {
        const inst = Number(k);
        const d = telemetry.bat[inst];
        const volt = interpAt(d.volt, t);
        const curr = interpAt(d.curr, t);
        const used = interpAt(d.currTot, t);
        const temp = interpAt(d.temp, t);
        const remPct = interpAt(d.remPct, t);

        setText(`bat${inst}-volt`, volt != null ? `${volt.toFixed(2)} V` : '—');
        setText(`bat${inst}-curr`, curr != null ? `${curr.toFixed(1)} A` : '—');
        setText(`bat${inst}-used`, used != null ? `${Math.round(used)} mAh` : '—');
        setText(`bat${inst}-temp`, temp != null ? `${temp.toFixed(0)}°C` : '—');

        const fill = document.getElementById(`bat${inst}-fill`);
        if (fill && remPct != null) fill.style.width = `${Math.max(0, Math.min(100, remPct))}%`;

        const dot = document.getElementById(`bat${inst}-dot`);
        if (dot) dot.classList.toggle('warn', remPct != null && remPct < 25);
    });
}

// ─── Control Surfaces Panel: CSRV[1,2,4,9] ────────────────────────────────────
function updateServoPanel(t) {
    [1, 9, 2, 4].forEach(id => {
        const d = telemetry.csrv[id];
        if (!d) return;
        const posRad = interpAt(d.pos, t);
        const posDeg = posRad != null ? posRad * (180 / Math.PI) : null; // CSRV.Pos is logged in radians
        const pow = interpAt(d.pow, t);
        const temp = interpAt(d.motT, t);

        setText(`csrv${id}-pos`, posDeg != null ? `${posDeg.toFixed(1)}°` : '—');
        setText(`csrv${id}-pow`, pow != null ? `${pow.toFixed(0)}%` : '—');
        setText(`csrv${id}-temp`, temp != null ? `${temp.toFixed(0)}°` : '—');

        const needle = document.getElementById(`csrv${id}-needle`);
        if (needle && posDeg != null) needle.style.transform = `translateX(-50%) rotate(${Math.max(-60, Math.min(60, posDeg))}deg)`;
    });
}

// ─── Primary Flight Display (attitude indicator) ──────────────────────────────
function drawPFD(roll, pitch) {
    const canvas = document.getElementById('pfdCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const s = w / 180; // every constant below was tuned for a 180px canvas; this keeps proportions at any size

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    const radius = Math.min(w, h) * 0.48;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-roll * Math.PI / 180);

    const pixelsPerDegree = 4 * s;
    const pitchOffset = pitch * pixelsPerDegree;

    ctx.fillStyle = "#1e40af";
    ctx.fillRect(-w * 2, -h * 4 + pitchOffset, w * 4, h * 4);
    ctx.fillStyle = "#451a03";
    ctx.fillRect(-w * 2, pitchOffset, w * 4, h * 4);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(-w, pitchOffset);
    ctx.lineTo(w, pitchOffset);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `bold ${Math.max(8, 11 * s)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = -30; i <= 30; i += 5) {
        if (i === 0) continue;
        const yPos = pitchOffset - (i * pixelsPerDegree);
        if (yPos < -h / 2 || yPos > h / 2) continue;

        let barWidth = (i % 10 === 0 ? 50 : 25) * s;
        ctx.lineWidth = (i % 10 === 0 ? 2 : 1) * s;

        ctx.beginPath();
        ctx.moveTo(-barWidth, yPos); ctx.lineTo(-10 * s, yPos);
        ctx.moveTo(10 * s, yPos); ctx.lineTo(barWidth, yPos);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-barWidth, yPos); ctx.lineTo(-barWidth, yPos + (i > 0 ? 5 * s : -5 * s));
        ctx.moveTo(barWidth, yPos); ctx.lineTo(barWidth, yPos + (i > 0 ? 5 * s : -5 * s));
        ctx.stroke();

        if (i % 10 === 0) {
            ctx.fillText(Math.abs(i).toString(), -barWidth - 14 * s, yPos);
            ctx.fillText(Math.abs(i).toString(), barWidth + 14 * s, yPos);
        }
    }
    ctx.restore();

    ctx.save();
    ctx.translate(w / 2, h / 2);

    const rollArcRadius = radius * 0.85;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2 * s;

    ctx.beginPath();
    ctx.arc(0, 0, rollArcRadius, -150 * Math.PI / 180, -30 * Math.PI / 180);
    ctx.stroke();

    const rollAngles = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60];
    rollAngles.forEach(angle => {
        const rad = (angle - 90) * Math.PI / 180;
        const innerX = Math.cos(rad) * rollArcRadius;
        const innerY = Math.sin(rad) * rollArcRadius;

        const tickLen = (Math.abs(angle) % 30 === 0 || angle === 0 ? 10 : 6) * s;
        const outerX = Math.cos(rad) * (rollArcRadius - tickLen);
        const outerY = Math.sin(rad) * (rollArcRadius - tickLen);

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
    });

    ctx.save();
    ctx.rotate(-roll * Math.PI / 180);
    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    ctx.moveTo(0, -rollArcRadius + 2 * s);
    ctx.lineTo(-7 * s, -rollArcRadius + 14 * s);
    ctx.lineTo(7 * s, -rollArcRadius + 14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3.5 * s;
    ctx.shadowBlur = 4 * s;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";

    ctx.beginPath();
    ctx.moveTo(w / 2 - 40 * s, h / 2); ctx.lineTo(w / 2 - 15 * s, h / 2); ctx.lineTo(w / 2 - 15 * s, h / 2 + 8 * s);
    ctx.moveTo(w / 2 + 40 * s, h / 2); ctx.lineTo(w / 2 + 15 * s, h / 2); ctx.lineTo(w / 2 + 15 * s, h / 2 + 8 * s);
    ctx.moveTo(w / 2 - 2 * s, h / 2); ctx.lineTo(w / 2 + 2 * s, h / 2);
    ctx.moveTo(w / 2, h / 2 - 2 * s); ctx.lineTo(w / 2, h / 2 + 2 * s);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
}

// ─── Auto-hiding playback toolbar (video-player style) ─────────────────────────
// Controls fade away after a moment of inactivity so the map/HUD feel like a live
// mission view rather than a log scrubber, and reappear on any mouse/touch activity.
let toolbarHideTimer = null;
function showToolbar() {
    const bar = document.querySelector('.playback-timeline-toolbar');
    if (!bar) return;
    bar.classList.remove('toolbar-hidden');
    clearTimeout(toolbarHideTimer);
    toolbarHideTimer = setTimeout(() => {
        if (!isUserInteractingWithSlider) bar.classList.add('toolbar-hidden');
    }, 2800);
}
function setupAutoHideToolbar() {
    const bar = document.querySelector('.playback-timeline-toolbar');
    if (!bar) return;
    document.addEventListener('mousemove', showToolbar);
    document.addEventListener('touchstart', showToolbar, { passive: true });
    bar.addEventListener('mouseenter', () => clearTimeout(toolbarHideTimer));
    bar.addEventListener('mouseleave', showToolbar);
    showToolbar();
}
document.addEventListener('DOMContentLoaded', setupAutoHideToolbar);

// Keeps the side columns from ever overlapping the top status bar, even if its chips
// wrap onto a second row on a narrower window (measured live instead of hard-coded).
function syncTopbarHeight() {
    const bar = document.querySelector('.top-status-bar');
    if (!bar) return;
    document.documentElement.style.setProperty('--topbar-h', `${bar.offsetHeight}px`);
}
document.addEventListener('DOMContentLoaded', syncTopbarHeight);
window.addEventListener('resize', syncTopbarHeight);