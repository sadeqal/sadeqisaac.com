// ═══════════════════════════════════════════════════════════════════════════════
// Flight Simulator & Telemetry State
// ═══════════════════════════════════════════════════════════════════════════════

// Standardized initial telemetry matrices
let telemetry = {
    gps: { lat: [], lng: [], alt: [] },
    pos: { lat: [], lng: [], alt: [] },
    baro: [],
    rangefinder: [],
    imu: { z: [] },
    airspeed: [],
    vibrations: { x: [], y: [], z: [] },
    battery: { volt: [], curr: [] },
    att: { roll: [], pitch: [], yaw: [] } // NEW: real ArduPilot attitude (roll/pitch/yaw), see parseBinFile
};

// Executive default metrics - prevents empty fields if export triggers early
let flightInfo = {
    firmware: 'PX4 v1.14 Pro',
    vehicle: 'Custom VTOL UAV (Fixed-Wing)',
    duration: 0,
    distance: 0,
    maxAlt: 0,
    maxSpeed: 0
};

// Structured technical test protocol layout data
let tproData = {
    objectives: [
        { id: 1, text: "Verify autonomous transition transitions from hover to fixed-wing cruise.", checked: true },
        { id: 2, text: "Evaluate pitch/roll stability under simulated 15-knot crosswind anomalies.", checked: true },
        { id: 3, text: "Validate fail-safe return-to-land protocols upon link degradation.", checked: true }
    ],
    aircraftConfig: [
        { system: "Avionics", detail: "Pixhawk 6X Connected via high-reliability telemetry links" },
        { system: "Propulsion", detail: "4x Vertical lift motors + 1x High-efficiency pusher motor" }
    ],
    flightProfiles: [
        { profile: "Profile Alpha", altitude: "120m AGL", duration: "25 min" }
    ]
};

let map = null;
let comparisonMap = null;
let charts = {};
const mapStyle = 'mapbox://styles/mapbox/satellite-streets-v12';

// Safe Chart configurations that won't paint invisible text on white paper backgrounds
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = '"Helvetica Neue", "Arial", sans-serif';

    // SMART COLOR: Use dark slate if printing, otherwise fallback to light blue for the web UI
    const isPrinting = window.matchMedia('print').matches || document.body.classList.contains('pdf-export-active');
    Chart.defaults.color = isPrinting ? '#111111' : '#eef2ff';

    // Stabilize high-res rendering mechanics securely
    Chart.defaults.devicePixelRatio = Math.max(2, Math.round((window.devicePixelRatio || 2) * 1.5));
    Chart.defaults.animation = false;
}

let simMap = null;
let simCanvasElement = null;
let isSimulatingFlight = false;
let simFrameIndex = 0;
let simAnimationId = null;
let simStartTimeReal = 0;   // performance.now() when playback was last (re)started
let simStartTimeLog = 0;    // telemetry log-time (seconds) that corresponds to simStartTimeReal
let lastFrameTimeReal = 0;

// Global State Controllers
let currentViewMode = 'cockpit'; // cockpit (belly cam) | nadir (straight down) | orbit (third-eye chase)
let isUserInteractingWithSlider = false;
let playbackSpeed = 1; // 1 = real time. Adjustable from the speed selector in the toolbar.

// ─── 3D VTOL Model + Free Camera state ─────────────────────────────────────────
// NOTE: adjust this path to wherever VTOL5M.glb actually lives relative to the site root.
const VTOL_MODEL_URL = '../3dmodels/vtol/VTOL5M.glb';
// If the model looks too big/small once it renders, tweak this.
const MODEL_SCALE_FACTOR = 1.0;
// If the model's nose/roll axis doesn't line up with real heading/attitude once you see it
// rendered, tweak these offsets (in degrees) until it looks right. x=pitch, y=roll, z=yaw.
const MODEL_ROTATION_OFFSET_DEG = { x: 0, y: 0, z: 0 };
// How far above the aircraft's real altitude the top-down (nadir) camera sits.
const NADIR_CAMERA_OFFSET_M = 80;

let vtolModelLayer = null;
let vtolModelReady = false;
let vtolModelTransform = null;
let terrainElevCache = { key: null, value: 0 };

// Orbit ("third eye") camera controls - like plot.ardupilot.org's 3D view
let orbitAzimuth = 30;     // degrees, 0 = looking from the north
let orbitElevation = 35;   // degrees above the horizon
let orbitDistance = 120;   // meters from the aircraft
const ORBIT_MIN_DIST = 20, ORBIT_MAX_DIST = 600;
const ORBIT_MIN_ELEV = 8, ORBIT_MAX_ELEV = 85;
let isOrbitDragging = false;
let lastPointerX = 0, lastPointerY = 0;

// Cache of the last rendered telemetry frame, so orbit drag/zoom can redraw the
// camera immediately even while playback is paused.
let lastFrame = { lng: null, lat: null, relAlt: 0, yaw: 0, pitch: 0, roll: 0 };


// ─── Utility Functions ─────────────────────────────────────────────────────────

function setStatus(msg) {
    const statusBox = document.getElementById('statusBox');
    if (statusBox) {
        statusBox.textContent = msg;
    } else {
        console.log("Status update: " + msg); // Fallback to console log
    }
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// NEW: zero-padded mm:ss (or h:mm:ss) clock format, used by the sim playback toolbar
// so it actually matches the "00:00" style already shown in the HTML.
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
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// NEW: great-circle bearing between two GPS points, in degrees (0-360).
// Used as a fallback heading source when the log has no ATT message.
function computeBearingDeg(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
}

// NEW: binary search for the closest sample (by `.time`) in a sorted-ascending array.
// Used both for real-time playback (find the GPS index matching elapsed real time)
// and for cross-referencing ATT samples against the current GPS frame.
function findNearestIndexByTime(sortedArr, t) {
    if (!sortedArr || !sortedArr.length) return -1;
    const hi0 = sortedArr.length - 1;
    if (t <= sortedArr[0].time) return 0;
    if (t >= sortedArr[hi0].time) return hi0;
    let lo = 0, hi = hi0;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (sortedArr[mid].time < t) lo = mid + 1; else hi = mid;
    }
    if (lo > 0 && Math.abs(sortedArr[lo - 1].time - t) < Math.abs(sortedArr[lo].time - t)) return lo - 1;
    return lo;
}

// ─── BIN File Parser ───────────────────────────────────────────────────────────
async function parseBinFile(file) {
    const buffer = await file.arrayBuffer();

    if (typeof DataflashParser === 'undefined') {
        throw new Error('DataflashParser no disponible.');
    }

    const parser = new DataflashParser(false);
    const parsed = parser.processData(buffer, [
        'GPS', 'POS', 'BARO', 'RFND', 'IMU', 'ARSP', 'VIBE', 'BAT', 'MSG', 'FMT', 'ATT'
    ]);

    // Reset telemetry
    telemetry = {
        gps: { lat: [], lng: [], alt: [] },
        pos: { lat: [], lng: [], alt: [] },
        baro: [],
        rangefinder: [],
        imu: { z: [] },
        airspeed: [],
        vibrations: { x: [], y: [], z: [] },
        battery: { volt: [], curr: [] },
        att: { roll: [], pitch: [], yaw: [] }
    };

    let baseTime = null;

    // ─── GPS ───────────────────────────────────────────────────
    const gpsMsg = parsed?.messages?.['GPS[0]'] || parsed?.messages?.GPS;
    if (gpsMsg?.time_boot_ms && gpsMsg?.Lat && gpsMsg?.Lng && gpsMsg?.Alt) {
        const mk = (arr, scale = 1) =>
            Array.from(arr || [])
        .map((v, i) => ({ 
            timeAbs: Number(gpsMsg.time_boot_ms[i]) / 1000, 
            value: Number(v) * scale 
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
        
        const rawLat = mk(gpsMsg.Lat, 1/1e7);
        const rawLng = mk(gpsMsg.Lng, 1/1e7);
        const rawAlt = mk(gpsMsg.Alt, 1/1000); // mm to m
        
        // Filter (0,0) GPS glitches
        const validIndices = rawLat.map((p, i) => {
            const lat = p.value;
            const lng = rawLng[i]?.value;
            return (Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01 && 
            Math.abs(lat) <= 90 && Math.abs(lng) <= 180) ? i : -1;
        }).filter(i => i >= 0);
        
        telemetry.gps.lat = validIndices.map(i => rawLat[i]);
        telemetry.gps.lng = validIndices.map(i => rawLng[i]);
        telemetry.gps.alt = validIndices.map(i => rawAlt[i]);
        
        if (telemetry.gps.lat.length) baseTime = telemetry.gps.lat[0].timeAbs;
    }
    
    // ─── POS (EKF) CON FALLBACK AUTOMÁTICO ─────────────────────────────────────
    let posMsg = parsed?.messages?.['POS'];
    let isStandardPos = true;
    
    // Fallback inteligente: Si POS no existe, revisamos AHR2 (que SÍ suele estar presente en ArduPilot)
    if ((!posMsg || !posMsg.Lat || posMsg.Lat.length === 0) && parsed?.messages?.['AHR2']) {
        posMsg = parsed.messages['AHR2'];
        isStandardPos = false; // Indica que viene del sistema AHR2 y necesita escalado 1e7
    }
    
    if (posMsg && posMsg.time_boot_ms && posMsg.Lat && posMsg.Lng) {
        // Si viene de AHR2 o logs viejos el factor de escala es 1/1e7. Si es POS nativo es 1.
        const firstLat = Number(posMsg.Lat[0] || 0);
        const posScale = (Math.abs(firstLat) > 180 || !isStandardPos) ? 1/10000000 : 1;
        const altScale = !isStandardPos ? 1 : 1; // AHR2 Alt suele venir en metros directos o cm (si es cm cambiar a 1/100)
        
        const mk = (arr, scale = 1) =>
            Array.from(arr || [])
        .map((v, i) => ({ 
            timeAbs: Number(posMsg.time_boot_ms[i]) / 1000, 
            value: Number(v) * scale 
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
        
        const rawLat = mk(posMsg.Lat, posScale);
        const rawLng = mk(posMsg.Lng, posScale);
        const rawAlt = mk(posMsg.Alt || posMsg.AltTop, altScale); 
        
        const validIndices = rawLat.map((p, i) => {
            const lat = p.value;
            const lng = rawLng[i]?.value;
            return (Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01 &&
            Math.abs(lat) <= 90 && Math.abs(lng) <= 180) ? i : -1;
        }).filter(i => i >= 0);
        
        telemetry.pos.lat = validIndices.map(i => rawLat[i]);
        telemetry.pos.lng = validIndices.map(i => rawLng[i]);
        telemetry.pos.alt = validIndices.map(i => rawAlt[i]);
        
        if (!baseTime && telemetry.pos.lat.length) baseTime = telemetry.pos.lat[0].timeAbs;
    } else if (parsed?.messages?.['AHR2']) {
        // Último recurso: Si no hay POS ni NKF1, usamos la actitud estimada global AHR2 (viene escalada en 1e7)
        const ahrMsg = parsed.messages['AHR2'];
        if (ahrMsg.time_boot_ms && ahrMsg.Lat && ahrMsg.Lng) {
            const mk = (arr, scale = 1) => Array.from(arr || []).map((v, i) => ({ timeAbs: Number(ahrMsg.time_boot_ms[i]) / 1000, value: Number(v) * scale })).filter(p => Number.isFinite(p.timeAbs)).sort((a, b) => a.timeAbs - b.timeAbs);
            const rawLat = mk(ahrMsg.Lat, 1/1e7);
            const rawLng = mk(ahrMsg.Lng, 1/1e7);
            const rawAlt = mk(ahrMsg.Alt, 1);
            const validIndices = rawLat.map((p, i) => (Math.abs(p.value) > 0.01 && Math.abs(rawLng[i]?.value) > 0.01) ? i : -1).filter(i => i >= 0);
            telemetry.pos.lat = validIndices.map(i => rawLat[i]);
            telemetry.pos.lng = validIndices.map(i => rawLng[i]);
            telemetry.pos.alt = validIndices.map(i => rawAlt[i]);
        }
    }
    
    // ─── BARO ──────────────────────────────────────────────────
    const baroMsg = parsed?.messages?.['BARO[0]'] || parsed?.messages?.BARO;
    if (baroMsg?.time_boot_ms && baroMsg?.Alt) {
        telemetry.baro = Array.from(baroMsg.Alt)
        .map((v, i) => ({ 
            timeAbs: Number(baroMsg.time_boot_ms[i]) / 1000, 
            value: Number(v) 
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
        
        if (!baseTime && telemetry.baro.length) baseTime = telemetry.baro[0].timeAbs;
    }
    
    // ─── RANGEFINDER ───────────────────────────────────────────
    const rfndMsg = parsed?.messages?.['RFND[0]'] || parsed?.messages?.RFND;
    if (rfndMsg?.time_boot_ms && rfndMsg?.Dist) {
        telemetry.rangefinder = Array.from(rfndMsg.Dist)
        .map((v, i) => ({ 
            timeAbs: Number(rfndMsg.time_boot_ms[i]) / 1000, 
            value: Number(v) 
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
    }
    
    // ─── IMU ───────────────────────────────────────────────────
    const imuMsg = parsed?.messages?.['IMU[0]'] || parsed?.messages?.IMU;
    if (imuMsg?.time_boot_ms && imuMsg?.AccZ) {
        telemetry.imu.z = Array.from(imuMsg.AccZ)
        .map((v, i) => ({ 
            timeAbs: Number(imuMsg.time_boot_ms[i]) / 1000, 
            value: Number(v) 
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
    }
    
    // ─── AIRSPEED ──────────────────────────────────────────────
    const arspMsg = parsed?.messages?.['ARSP[0]'] || parsed?.messages?.ARSP;
    if (arspMsg?.time_boot_ms && arspMsg?.Airspeed) {
        telemetry.airspeed = Array.from(arspMsg.Airspeed)
        .map((v, i) => ({ 
            timeAbs: Number(arspMsg.time_boot_ms[i]) / 1000, 
            value: Number(v) 
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
    }
    
    // ─── VIBRATIONS ────────────────────────────────────────────
    const vibeMsg = parsed?.messages?.['VIBE'];
    if (vibeMsg?.time_boot_ms && vibeMsg?.VibeX) {
        const mk = (arr) => Array.from(arr || [])
        .map((v, i) => ({ 
            timeAbs: Number(vibeMsg.time_boot_ms[i]) / 1000, 
            value: Number(v) 
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
        
        telemetry.vibrations.x = mk(vibeMsg.VibeX);
        telemetry.vibrations.y = mk(vibeMsg.VibeY);
        telemetry.vibrations.z = mk(vibeMsg.VibeZ);
    }
    
    // ─── BATTERY ───────────────────────────────────────────────
    const batMsg = parsed?.messages?.['BAT'] || parsed?.messages?.['POWR'];
    if (batMsg?.time_boot_ms && batMsg?.Volt) {
        const mk = (arr) => Array.from(arr || [])
        .map((v, i) => ({ 
            timeAbs: Number(batMsg.time_boot_ms[i]) / 1000, 
            value: Number(v) 
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
        
        telemetry.battery.volt = mk(batMsg.Volt);
        telemetry.battery.curr = mk(batMsg.Curr);
    }

    // ─── ATTITUDE (NEW) ─────────────────────────────────────────
    // This is the real Roll/Pitch/Yaw of the aircraft. Previously nothing populated
    // telemetry.att, so the simulator was silently drawing a fake sine-wave wobble
    // and a fake slowly-spinning heading instead of the actual flight attitude.
    const attMsg = parsed?.messages?.['ATT[0]'] || parsed?.messages?.ATT;
    if (attMsg?.time_boot_ms && attMsg?.Roll) {
        const mk = (arr) => Array.from(arr || [])
        .map((v, i) => ({
            timeAbs: Number(attMsg.time_boot_ms[i]) / 1000,
            value: Number(v)
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);

        telemetry.att.roll = mk(attMsg.Roll);
        telemetry.att.pitch = mk(attMsg.Pitch);
        telemetry.att.yaw = mk(attMsg.Yaw);
    }
    
    // ─── Normalize times ───────────────────────────────────────
    if (!baseTime) throw new Error('No se encontraron datos de telemetría.');
    
    const normalize = series => series.map(p => ({ 
        ...p, 
        time: p.timeAbs - baseTime 
    }));
    
    telemetry.gps.lat = normalize(telemetry.gps.lat);
    telemetry.gps.lng = normalize(telemetry.gps.lng);
    telemetry.gps.alt = normalize(telemetry.gps.alt);
    telemetry.pos.lat = normalize(telemetry.pos.lat);
    telemetry.pos.lng = normalize(telemetry.pos.lng);
    telemetry.pos.alt = normalize(telemetry.pos.alt);
    telemetry.baro = normalize(telemetry.baro);
    telemetry.rangefinder = normalize(telemetry.rangefinder);
    telemetry.imu.z = normalize(telemetry.imu.z);
    telemetry.airspeed = normalize(telemetry.airspeed);
    telemetry.vibrations.x = normalize(telemetry.vibrations.x);
    telemetry.vibrations.y = normalize(telemetry.vibrations.y);
    telemetry.vibrations.z = normalize(telemetry.vibrations.z);
    telemetry.battery.volt = normalize(telemetry.battery.volt);
    telemetry.battery.curr = normalize(telemetry.battery.curr);
    telemetry.att.roll = normalize(telemetry.att.roll);
    telemetry.att.pitch = normalize(telemetry.att.pitch);
    telemetry.att.yaw = normalize(telemetry.att.yaw);
    
    // ─── Flight info ───────────────────────────────────────────
    const msgData = parsed?.messages?.MSG;
    if (msgData?.Message) {
        const msgs = Array.from(msgData.Message || []).map(m => String(m));
        const fwMsg = msgs.find(m => m.includes('ArduPlane') || m.includes('ArduCopter') || m.includes('ArduRover'));
        if (fwMsg) {
            flightInfo.firmware = fwMsg.trim();
            if (fwMsg.includes('ArduPlane')) flightInfo.vehicle = 'Avión';
            else if (fwMsg.includes('ArduCopter')) flightInfo.vehicle = 'Multirrotor';
            else if (fwMsg.includes('ArduRover')) flightInfo.vehicle = 'Rover';
        }
    }
    
    // Calculate duration across all available telemetry data arrays safely
    const allTimes = [
        ...telemetry.gps.lat, 
        ...telemetry.pos.lat,
        ...telemetry.baro,
        ...telemetry.rangefinder,
        ...telemetry.imu.z,
        ...telemetry.airspeed,
        ...telemetry.vibrations.x,
        ...telemetry.battery.volt
    ];
    
    if (allTimes.length > 0) {
        let maxTime = -Infinity;
        for (let i = 0; i < allTimes.length; i++) {
            if (allTimes[i].time > maxTime) {
                maxTime = allTimes[i].time;
            }
        }
        flightInfo.duration = maxTime;
    } else {
        flightInfo.duration = 0;
    }
    
    // Calculate distance
    if (telemetry.gps.lat.length > 1) {
        let totalDist = 0;
        for (let i = 1; i < telemetry.gps.lat.length; i++) {
            const lat1 = telemetry.gps.lat[i-1].value;
            const lng1 = telemetry.gps.lng[i-1].value;
            const lat2 = telemetry.gps.lat[i].value;
            const lng2 = telemetry.gps.lng[i].value;
            totalDist += haversineMetres(lat1, lng1, lat2, lng2);
        }
        flightInfo.distance = totalDist;
    }
    
    // Max altitude
    if (telemetry.baro.length) {
        flightInfo.maxAlt = Math.max(...telemetry.baro.map(p => p.value));
    }
    
    // Max speed
    if (telemetry.airspeed.length) {
        flightInfo.maxSpeed = Math.max(...telemetry.airspeed.map(p => p.value));
    }
    
    return flightInfo;
}


// ─── Main Load and Analyze Function ────────────────────────────────────────────

/*async function loadAndAnalyze() {
    // FIX: Fallback to the new window file reference if the old input element does not exist
    const binInput = document.getElementById('binFile') || window.uploadedBinFileRef;
    const tproInput = document.getElementById('tproFile') || { files: [] };
    
    // Extra safety to ensure binInput has files
    if (!binInput || !binInput.files || !binInput.files.length) {
        alert('Por favor, selecciona un archivo .bin');
        return;
    }
    
    // Create a safety fallback check for old panel containers that might be missing
    const simPanel = document.getElementById('simPanel');
    if (simPanel) simPanel.style.display = 'block';
    
    try {
        setStatus('⏳ Analizando archivos...');
        
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) generateBtn.disabled = true;
        
        // Reset TPRO data
        tproData = {
            objectives: [],
            aircraftConfig: [],
            flightProfiles: []
        };
        
        // Parse TPRO if provided
        if (tproInput.files && tproInput.files.length) {
            const tproFile = tproInput.files[0];
            if (tproFile.type === 'application/pdf' || tproFile.name.endsWith('.pdf')) {
                await parseTPROPDF(tproFile);
                if (typeof renderObjectivesList === 'function') renderObjectivesList();
                if (typeof renderAircraftConfig === 'function') renderAircraftConfig();
                if (typeof renderFlightProfiles === 'function') renderFlightProfiles();
                setStatus('✅ Archivo TPRO cargado. Analizando archivo .bin...');
            }
        }
        
        // --- DOM SAFETY HELPERS ---
        // These ensure the code doesn't crash if an element ID doesn't exist in the new HTML
        const setElText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        const showPanelEl = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'flex'; };
        
        // Update file info chip safely
        setElText('fileInfo', `📁 ${binInput.files[0].name}`);
        
        // Parse BIN file
        await parseBinFile(binInput.files[0]);
        
        // Update statistics safely
        setElText('durationStat', formatTime(flightInfo.duration));
        setElText('distanceStat', (flightInfo.distance / 1000).toFixed(2) + ' km');
        setElText('maxAltStat', flightInfo.maxAlt.toFixed(1) + ' m');
        setElText('maxSpeedStat', flightInfo.maxSpeed.toFixed(1) + ' m/s');
        setElText('fwVersionStat', flightInfo.firmware !== '—' ? flightInfo.firmware.split(' ')[0] : '—');
        setElText('vehicleTypeStat', flightInfo.vehicle);
        setElText('gpsPointsStat', String(telemetry.gps.lat.length));
        setElText('imuSamplesStat', String(telemetry.imu.z.length));
        setElText('parseInfo', '✅ Análisis completado');
        
        // Render all charts safely
        if (telemetry.baro && telemetry.baro.length) {
            showPanelEl('altCompPanel');
            if (typeof renderAltCompChart === 'function') renderAltCompChart();
        }
        if (telemetry.imu && telemetry.imu.z && telemetry.imu.z.length) {
            showPanelEl('imuPanel');
            if (typeof renderIMUChart === 'function') renderIMUChart();
        }
        if (telemetry.airspeed && telemetry.airspeed.length) {
            showPanelEl('airspeedPanel');
            if (typeof renderAirspeedChart === 'function') renderAirspeedChart();
        }
        if (telemetry.vibrations && telemetry.vibrations.x && telemetry.vibrations.x.length) {
            showPanelEl('vibrationsPanel');
            if (typeof renderVibrationsChart === 'function') renderVibrationsChart();
        }
        if (telemetry.battery && telemetry.battery.volt && telemetry.battery.volt.length) {
            showPanelEl('batteryPanel');
            if (typeof renderBatteryChart === 'function') renderBatteryChart();
        }    
        
        // 3. NOW DATA EXISTS: Safe to initialize the Synthetic Vision Simulation Map!
        if (telemetry.gps && telemetry.gps.lat && telemetry.gps.lat.length) {
            if (typeof mapboxgl !== 'undefined' && !simMap) {
                
                // CRITICAL FIX: Explicitly assign your token right before building the map
                mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
                
                // Only initialize if simMap container exists
                const mapContainer = document.getElementById('simMap');
                if (mapContainer) {
                    simMap = new mapboxgl.Map({
                        container: 'simMap',
                        style: 'mapbox://styles/mapbox/satellite-streets-v12',
                        center: [telemetry.gps.lng[0].value, telemetry.gps.lat[0].value],
                        zoom: 18.5,
                        pitch: 0,
                        bearing: 0,
                        interactive: false,
                        pixelRatio: 2 
                    });
                    
                    simMap.on('load', () => {
                        // We target the canvas specifically inside the simulation panel wrapper
                        simCanvasElement = document.querySelector('#simPanel .mapboxgl-canvas');
                        
                        // Add real 3D mountain/hill terrain elevation metrics
                        simMap.addSource('mapbox-dem-sim', {
                            'type': 'raster-dem',
                            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                            'tileSize': 512
                        });
                        simMap.setTerrain({ 'source': 'mapbox-dem-sim', 'exaggeration': 1.0 });
                        
                        // Add 3D Tower/Skyscraper extrusions
                        simMap.addLayer({
                            'id': 'sim-3d-buildings',
                            'source': 'composite',
                            'source-layer': 'building',
                            'filter': ['==', 'extrude', 'true'],
                            'type': 'fill-extrusion',
                            'minzoom': 15,
                            'paint': {
                                'fill-extrusion-color': '#cbd5e1',
                                'fill-extrusion-height': ['get', 'height'],
                                'fill-extrusion-base': ['get', 'min_height'],
                                'fill-extrusion-opacity': 0.6
                            }
                        });
                        
                        const coordinates3D = telemetry.gps.lat.map((p, idx) => [
                            telemetry.gps.lng[idx].value,
                            p.value,
                            telemetry.baro[idx]?.value || telemetry.gps.alt[idx]?.value || 0
                        ]);
                        
                        simMap.addSource('flight-path-source', {
                            'type': 'geojson',
                            'data': {
                                'type': 'Feature',
                                'properties': {},
                                'geometry': {
                                    'type': 'LineString',
                                    'coordinates': coordinates3D
                                }
                            }
                        });
                        
                        simMap.addLayer({
                            'id': 'flight-path-3d',
                            'type': 'line',
                            'source': 'flight-path-source',
                            'layout': { 'line-join': 'round', 'line-cap': 'round' },
                            'paint': {
                                'line-color': '#06b6d4',
                                'line-width': 4,
                                'line-opacity': 0.85
                            }
                        });
                        
                        // Set up timeline slider metrics safely
                        const slider = document.getElementById('timelineSlider');
                        if (slider) {
                            slider.max = telemetry.gps.lat.length - 1;
                            slider.value = 0;
                        }
                        setElText('totalDurationStamp', formatTime(flightInfo.duration));
                        
                        // Unlock manual map exploration features 
                        simMap.interactive = true; 
                        if (typeof switchView === 'function') switchView('inclined');
                    });
                }
            } else if (simMap) {
                // Reset map viewpoint position if a second file gets loaded later
                simMap.jumpTo({
                    center: [telemetry.gps.lng[0].value, telemetry.gps.lat[0].value],
                    zoom: 18.5,
                    pitch: 0,
                    bearing: 0
                });
                simFrameIndex = 0;
                
                const coordinates3D = telemetry.gps.lat.map((p, idx) => [
                    telemetry.gps.lng[idx].value,
                    p.value,
                    telemetry.baro[idx]?.value || telemetry.gps.alt[idx]?.value || 0
                ]);
                
                if (simMap.getSource('flight-path-source')) {
                    simMap.getSource('flight-path-source').setData({
                        'type': 'Feature',
                        'properties': {},
                        'geometry': { 'type': 'LineString', 'coordinates': coordinates3D }
                    });
                }
                
                const slider = document.getElementById('timelineSlider');
                if (slider) {
                    slider.max = telemetry.gps.lat.length - 1;
                    slider.value = 0;
                }
                setElText('totalDurationStamp', formatTime(flightInfo.duration));
            }
            
            // Standard trajectory display map initialization logic block safely mapped
            const mapPanel = document.getElementById('mapPanel');
            if (mapPanel) {
                mapPanel.style.display = 'flex';
                setTimeout(() => { if (typeof initMap === 'function') initMap(); }, 300);
            }
        }
        
        if (generateBtn) generateBtn.disabled = false;
        setStatus('✅ Análisis completado. Listo para generar PDF.');
        
    } catch (err) {
        console.error(err);
        alert(err.message || 'Error al analizar el archivo');
        setStatus('❌ Error al analizar el archivo.');
    }
}*/

// Change the name here back to match your HTML input element trigger
async function loadAndAnalyze() { 
    const binInput = document.getElementById('binFile') || window.uploadedBinFileRef;
    
    if (!binInput || !binInput.files || !binInput.files.length) {
        alert('Por favor, selecciona un archivo .bin');
        return;
    }
    
    const simPanel = document.getElementById('simPanel');
    if (simPanel) simPanel.style.display = 'block';
    
    try {
        if (typeof setStatus === 'function') setStatus('⏳ Analizando archivo .bin...');
        
        await parseBinFile(binInput.files[0]);
        
        if (telemetry.gps && telemetry.gps.lat && telemetry.gps.lat.length) {
            if (typeof mapboxgl !== 'undefined' && !simMap) {
                mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
                
                const mapContainer = document.getElementById('simMap');
                if (mapContainer) {
                    simMap = new mapboxgl.Map({
                        container: 'simMap',
                        style: 'mapbox://styles/mapbox/satellite-streets-v12',
                        center: [telemetry.gps.lng[0].value, telemetry.gps.lat[0].value],
                        zoom: 18.5,
                        pitch: 0,
                        bearing: 0,
                        interactive: false, // camera is fully driven by the Free Camera system below
                        pixelRatio: 2 
                    });
                    
                    simMap.on('load', () => {
                        simCanvasElement = document.querySelector('#simPanel .mapboxgl-canvas');

                        // Disable every built-in interaction handler: in every view mode the
                        // camera is now explicitly positioned every frame via setFreeCameraOptions,
                        // so letting Mapbox's own pan/zoom/rotate run would just fight it.
                        // (The orbit view gets its own custom drag/scroll handlers - see setupOrbitControls.)
                        simMap.dragPan.disable();
                        simMap.scrollZoom.disable();
                        simMap.dragRotate.disable();
                        simMap.touchZoomRotate.disable();
                        simMap.doubleClickZoom.disable();
                        simMap.boxZoom.disable();
                        if (simMap.keyboard) simMap.keyboard.disable();
                        
                        simMap.addSource('mapbox-dem-sim', {
                            'type': 'raster-dem',
                            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                            'tileSize': 512
                        });
                        simMap.setTerrain({ 'source': 'mapbox-dem-sim', 'exaggeration': 1.0 });
                        
                        simMap.addLayer({
                            'id': 'sim-3d-buildings',
                            'source': 'composite',
                            'source-layer': 'building',
                            'filter': ['==', 'extrude', 'true'],
                            'type': 'fill-extrusion',
                            'minzoom': 15,
                            'paint': {
                                'fill-extrusion-color': '#cbd5e1',
                                'fill-extrusion-height': ['get', 'height'],
                                'fill-extrusion-base': ['get', 'min_height'],
                                'fill-extrusion-opacity': 0.6
                            }
                        });
                        
                        const coordinates3D = telemetry.gps.lat.map((p, idx) => [
                            telemetry.gps.lng[idx].value,
                            p.value,
                            telemetry.baro[idx]?.value || telemetry.gps.alt[idx]?.value || 0
                        ]);
                        
                        simMap.addSource('flight-path-source', {
                            'type': 'geojson',
                            'data': {
                                'type': 'Feature',
                                'properties': {},
                                'geometry': { 'type': 'LineString', 'coordinates': coordinates3D }
                            }
                        });
                        
                        simMap.addLayer({
                            'id': 'flight-path-3d',
                            'type': 'line',
                            'source': 'flight-path-source',
                            'layout': { 'line-join': 'round', 'line-cap': 'round' },
                            'paint': {
                                'line-color': '#06b6d4',
                                'line-width': 4,
                                'line-opacity': 0.85
                            }
                        });

                        // NEW: live 3D VTOL model, positioned/rotated every frame in updateSimCamera()
                        addVtolModelLayer();
                        
                        const slider = document.getElementById('timelineSlider');
                        if (slider) {
                            slider.max = telemetry.gps.lat.length - 1;
                            slider.value = 0;
                        }
                        const totalEl = document.getElementById('totalDurationStamp');
                        if (totalEl) totalEl.textContent = formatClock(flightInfo.duration);
                        
                        if (typeof switchView === 'function') switchView('cockpit');
                        updateFlightPositionFrame(0);
                    });
                }
            } else if (simMap) {
                simFrameIndex = 0;
                
                const coordinates3D = telemetry.gps.lat.map((p, idx) => [
                    telemetry.gps.lng[idx].value,
                    p.value,
                    telemetry.baro[idx]?.value || telemetry.gps.alt[idx]?.value || 0
                ]);
                
                if (simMap.getSource('flight-path-source')) {
                    simMap.getSource('flight-path-source').setData({
                        'type': 'Feature',
                        'properties': {},
                        'geometry': { 'type': 'LineString', 'coordinates': coordinates3D }
                    });
                }
                
                const slider = document.getElementById('timelineSlider');
                if (slider) {
                    slider.max = telemetry.gps.lat.length - 1;
                    slider.value = 0;
                }
                const totalEl = document.getElementById('totalDurationStamp');
                if (totalEl) totalEl.textContent = formatClock(flightInfo.duration);

                // Immediately snap the camera/model to the new flight's starting frame
                updateFlightPositionFrame(0);
            }
        }
        
        if (typeof setStatus === 'function') setStatus('✅ Simulación cargada correctamente.');
        
    } catch (err) {
        console.error(err);
        alert(err.message || 'Error al procesar la simulación');
        if (typeof setStatus === 'function') setStatus('❌ Error al cargar la simulación.');
    }
}

// ─── Flight Simulation ───────────────────────────────────────────────

function toggleFlightSimulation() {
    const btn = document.getElementById('playPauseBtn');
    
    if (isSimulatingFlight) {
        isSimulatingFlight = false;
        cancelAnimationFrame(simAnimationId);
        if (btn) btn.textContent = "▶️";
    } else {
        if (!telemetry.gps.lat || telemetry.gps.lat.length === 0) {
            alert("No hay datos de telemetría válidos cargados.");
            return;
        }
        isUserInteractingWithSlider = false; // Reset slider interaction flag
        isSimulatingFlight = true;
        if (btn) btn.textContent = "⏸️";

        // Anchor the real-world clock to whatever log-time the current frame sits at,
        // so playback resumes from exactly where the slider/last frame left off.
        simStartTimeReal = performance.now();
        simStartTimeLog = telemetry.gps.lat[simFrameIndex]?.time ?? 0;

        simAnimationId = requestAnimationFrame(runSimulationFrameLoop);
    }
}

// NEW: change playback speed without causing a jump - re-anchors the real/log time pair.
function setPlaybackSpeed(value) {
    const v = parseFloat(value);
    if (!Number.isFinite(v) || v <= 0) return;
    if (isSimulatingFlight) {
        simStartTimeLog = telemetry.gps.lat[simFrameIndex]?.time ?? simStartTimeLog;
        simStartTimeReal = performance.now();
    }
    playbackSpeed = v;
}

// NEW: pause cleanly the moment the user grabs the scrubber, so the animation loop
// stops fighting the manual drag (this is what made the timestamp/position feel broken
// while scrubbing).
function onTimelineDragStart() {
    isUserInteractingWithSlider = true;
    if (isSimulatingFlight) toggleFlightSimulation();
}

// REWRITTEN: this used to advance simFrameIndex by a fixed +1 every animation frame,
// i.e. tied to screen refresh rate (~60/s) rather than to real elapsed time - that's
// exactly why a minute of flight blew by in a couple of seconds. Now the frame index
// is derived from actual elapsed wall-clock time mapped onto the log's own timestamps,
// so 1x playback really is real time (and the speed selector changes that ratio on purpose).
function runSimulationFrameLoop(nowMs) {
    if (!isSimulatingFlight) return;

    const arr = telemetry.gps.lat;
    if (!arr.length) { isSimulatingFlight = false; return; }

    const elapsedRealSec = (nowMs - simStartTimeReal) / 1000;
    const targetLogTime = simStartTimeLog + elapsedRealSec * playbackSpeed;

    if (targetLogTime >= arr[arr.length - 1].time) {
        simFrameIndex = arr.length - 1;
        updateFlightPositionFrame(simFrameIndex);
        isSimulatingFlight = false;
        const btn = document.getElementById('playPauseBtn');
        if (btn) btn.textContent = "▶️";
        return;
    }

    simFrameIndex = findNearestIndexByTime(arr, targetLogTime);
    updateFlightPositionFrame(simFrameIndex);

    simAnimationId = requestAnimationFrame(runSimulationFrameLoop);
}


// ─── Map Functions ─────────────────────────────────────────────────────────────

function initMap() {
    if (map || !telemetry.gps.lat.length) return;
    
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
    
    const midIdx = Math.floor(telemetry.gps.lat.length / 2);
    const centerLat = telemetry.gps.lat[midIdx].value;
    const centerLng = telemetry.gps.lng[midIdx].value;
    
    // 1. Inicializamos el mapa primero para que monte el contenedor correctamente
    map = new mapboxgl.Map({
        container: 'map',
        style: mapStyle,
        center: [centerLng, centerLat],
        zoom: 15,
        pitch: 60,
        bearing: 0,
        preserveDrawingBuffer: true,
        antialias: true
    });
    
    // 2. Toda la lógica visual y de capas se ejecuta al cargar el mapa
    map.on('load', () => {
        renderFlightPath();
        fitMapToFlight();
        
        map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512
        });
        // Introduce el terreno tridimensional con relieve real de montañas
        map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        
        // ─── CREACIÓN DE LA LEYENDA CUANDO EL MAPA YA EXISTE ───
        const mapElement = document.getElementById('map');
        if (mapElement) {
            const mapContainer = mapElement.parentElement;
            
            if (mapContainer) {
                mapContainer.style.position = 'relative';
                
                // Buscamos si ya existe para no duplicarla al recargar logs
                if (!mapContainer.querySelector('#mapbox-custom-legend')) {
                    const legend = document.createElement('div');
                    legend.id = 'mapbox-custom-legend';
                    legend.style.position = 'absolute';
                    legend.style.top = '20%';       // Separación desde el borde superior del mapa
                    legend.style.right = '2%';     // Separación desde el borde derecho del mapa
                    legend.style.backgroundColor = '#0f172a'; 
                    legend.style.border = '1px solid #334155';
                    legend.style.borderRadius = '6px';
                    legend.style.padding = '10px 16px'; // Corregido un poco el padding horizontal para que no quede gigante
                    legend.style.zIndex = '10';       // Flota sobre el canvas perfectamente
                    legend.style.fontFamily = 'Inter, Arial, sans-serif';
                    legend.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.3)';
                    legend.style.display = 'flex';
                    legend.style.flexDirection = 'column';
                    legend.style.gap = '8px';
                    legend.style.pointerEvents = 'none'; // No interrumpe los arrastres del ratón por debajo
                    
                    legend.innerHTML = `
                        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Trayectorias</div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #f1f5f9;">
                            <span style="display: inline-block; width: 14px; height: 5px; background-color: #0066ff; border-radius: 2px;"></span>
                            <span style="font-weight: 500;">GNSS Satelital (Crudo)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #f1f5f9;">
                            <span style="display: inline-block; width: 14px; height: 3px; background-color: #ff5500; border-radius: 1px;"></span>
                            <span style="font-weight: 500;">EKF POS (Estimado)</span>
                        </div>
                    `;
                    
                    mapContainer.appendChild(legend);
                }
            }
        }
    });
}

function initComparisonMap() {
    if (comparisonMap || !telemetry.gps.lat.length || !telemetry.pos.lat.length) return;
    
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
    
    const midIdx = Math.floor(telemetry.gps.lat.length / 2);
    const centerLat = telemetry.gps.lat[midIdx].value;
    const centerLng = telemetry.gps.lng[midIdx].value;
    
    comparisonMap = new mapboxgl.Map({
        container: 'gpsCompMap',
        style: mapStyle,
        center: [centerLng, centerLat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        preserveDrawingBuffer: true,
        antialias: true
    });
    
    comparisonMap.on('load', () => {
        renderComparisonPath();
        fitComparisonToFlight();
    });
}

function fitComparisonToFlight() {
    if (!comparisonMap || !telemetry.gps.lat.length) return;
    
    const lats = telemetry.gps.lat.map(p => p.value);
    const lngs = telemetry.gps.lng.map(p => p.value);
    comparisonMap.fitBounds([
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
    ], { padding: 40, duration: 1200 });
}

function buildGeoCoords(latArr, lngArr, altArr) {
    const coords = [];
    const len = Math.min(latArr.length, lngArr.length);
    const baroData = telemetry.baro || [];
    
    for (let i = 0; i < len; i++) {
        const lat = latArr[i].value;
        const lng = lngArr[i].value;
        const gpsTime = latArr[i].timeAbs;
        
        let altRelativa = 0;
        
        // Sincronizamos con la altura del barómetro
        if (baroData.length > 0) {
            let closestBaro = baroData.reduce((prev, curr) => {
                return (Math.abs(curr.timeAbs - gpsTime) < Math.abs(prev.timeAbs - gpsTime)) ? curr : prev;
            });
            altRelativa = closestBaro.value || 0;
        } else if (altArr[i]) {
            altRelativa = altArr[i].value;
        }
        
        if (Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01) {
            // [Longitud, Latitud, Altitud] -> Mapbox exige este orden exacto
            coords.push([lng, lat, altRelativa]); 
        }
    }
    return coords;
}

function addLineLayer(mapObj, sourceId, layerId, coordinates, color, width, dashArray = null) {
    if (mapObj.getSource(sourceId)) {
        mapObj.getSource(sourceId).setData({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        });
        return;
    }
    
    mapObj.addSource(sourceId, {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        }
    });
    
    mapObj.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': color,
            'line-width': width,
            'line-opacity': 0.95
        }
    });
}

function renderFlightPath() {
    if (!map) return;
    
    const gpsCoords = buildGeoCoords(telemetry.gps.lat, telemetry.gps.lng, telemetry.gps.alt);
    const posCoords = buildGeoCoords(telemetry.pos.lat, telemetry.pos.lng, telemetry.pos.alt);
    
    // 1. Capa Base: GPS en color Azul Eléctrico y más gruesa (Ancho: 5)
    if (gpsCoords.length) {
        addLineLayer(map, 'gps-track', 'gps-track', gpsCoords, '#0066ff', 5);
    }
    
    // 2. Capa Superior: EKF POS en color Naranja Brillante y más fina (Ancho: 2)
    if (posCoords.length) {
        // Al ser más delgada y estar encima, verás el "hilo" naranja correr perfectamente por el centro del azul
        addLineLayer(map, 'pos-track', 'pos-track', posCoords, '#ff5500', 2);
    }
}

function renderComparisonPath() {
    if (!comparisonMap) return;
    
    const gpsCoords = buildGeoCoords(telemetry.gps.lat, telemetry.gps.lng, telemetry.gps.alt);
    const posCoords = buildGeoCoords(telemetry.pos.lat, telemetry.pos.lng, telemetry.pos.alt);
    
    // Mismo principio visual de superposición para el mapa estático del PDF
    if (gpsCoords.length) {
        addLineLayer(comparisonMap, 'comp-gps-track', 'comp-gps-layer', gpsCoords, '#0066ff', 5);
    }
    
    if (posCoords.length) {
        addLineLayer(comparisonMap, 'comp-pos-track', 'comp-pos-layer', posCoords, '#ff5500', 2);
    }
}

function setMapPitch(pitch) {
    if (map) map.setPitch(pitch);
}

function fitMapToFlight() {
    if (!map || !telemetry.gps.lat.length) return;
    const lats = telemetry.gps.lat.map(p => p.value);
    const lngs = telemetry.gps.lng.map(p => p.value);
    map.fitBounds([
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
    ], { padding: 60, duration: 1200 });
}

async function handleFileLoading(inputElement) {
    if (!inputElement.files.length) return;
    
    document.getElementById('uploadSpinner').style.display = 'block';
    
    // FIX: Instead of trying to assign to a getElementById call, we mock the object mapping safely
    window.uploadedBinFileRef = inputElement; 
    
    // Call your primary data engine
    await loadAndAnalyze();
    
    // Dismiss the landing panel view seamlessly
    document.getElementById('uploadLayer').classList.add('fade-out');
}

// REWRITTEN: three real view modes instead of three cosmetic pitch/bearing presets.
// cockpit = belly-mounted onboard camera (follows real position/altitude/heading/attitude)
// nadir   = straight-down chase drone shot, altitude-locked to the real telemetry altitude
// orbit   = third-eye chase camera around the live 3D VTOL model, mouse-drag to rotate / scroll to zoom
function switchView(mode) {
    currentViewMode = mode;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${mode}`);
    if (activeBtn) activeBtn.classList.add('active');

    const hint = document.getElementById('orbitHint');
    if (hint) hint.style.display = (mode === 'orbit') ? 'block' : 'none';

    const simMapEl = document.getElementById('simMap');
    if (simMapEl) simMapEl.classList.toggle('orbit-mode', mode === 'orbit');

    refreshCameraNow();
}

function onTimelineSliderChange(value) {
    simFrameIndex = parseInt(value);
    updateFlightPositionFrame(simFrameIndex);
}

// REWRITTEN: real attitude (from ATT, with a GPS-bearing fallback instead of a fake
// sine-wave wobble), a real elapsed-time readout (instead of an index-proportion guess),
// and camera placement handed off to the new Free Camera system.
function updateFlightPositionFrame(index) {
    if (!telemetry.gps.lat[index]) return;
    
    const lat = telemetry.gps.lat[index].value;
    const lng = telemetry.gps.lng[index].value;
    const alt = telemetry.baro[index]?.value || telemetry.gps.alt[index]?.value || 0;
    const currentTime = telemetry.gps.lat[index].time;
    
    let yaw = 0, pitch = 0, roll = 0;
    
    if (telemetry.att.yaw.length) {
        // Real logged attitude - look up the ATT sample closest in time to this GPS frame,
        // since ATT is usually logged at a different rate than GPS.
        const ai = findNearestIndexByTime(telemetry.att.yaw, currentTime);
        yaw = telemetry.att.yaw[ai]?.value ?? 0;
        const pi = findNearestIndexByTime(telemetry.att.pitch, currentTime);
        pitch = telemetry.att.pitch[pi]?.value ?? 0;
        const ri = findNearestIndexByTime(telemetry.att.roll, currentTime);
        roll = telemetry.att.roll[ri]?.value ?? 0;
    } else if (index > 0 && telemetry.gps.lat[index - 1]) {
        // No ATT message in this log: derive heading from consecutive GPS fixes instead
        // of fabricating one. No attitude data means no roll/pitch is claimed either.
        yaw = computeBearingDeg(
            telemetry.gps.lat[index - 1].value, telemetry.gps.lng[index - 1].value,
            lat, lng
        );
    }
    
    // Synchronize slider and HUD elements
    if(!isUserInteractingWithSlider) {
        document.getElementById('timelineSlider').value = index;
    }
    
    document.getElementById('currentTimeStamp').textContent = formatClock(currentTime);
    document.getElementById('pfd-alt').textContent = alt.toFixed(1) + 'm';
    document.getElementById('pfd-hdg').textContent = Math.round(yaw).toString().padStart(3, '0') + '°';
    
    // Draw Primary Flight Display
    drawPFD(roll, pitch);

    // Cache this frame so orbit drag/zoom can redraw the camera even while paused
    lastFrame = { lng, lat, relAlt: alt, yaw, pitch, roll };

    // Apply the real 3D camera + model transform for whichever view is active
    updateSimCamera(lng, lat, alt, yaw, pitch, roll);
}


// ─── Free Camera / Live 3D Model System (NEW) ──────────────────────────────────

// Looks up ground elevation under a point using the loaded terrain-DEM, so altitude
// (which is relative-to-home in the log) can be converted into a true height above
// sea level for camera/model placement. Falls back to the last known value while
// terrain tiles are still loading.
function getGroundElevation(lng, lat) {
    if (!simMap || typeof simMap.queryTerrainElevation !== 'function') return terrainElevCache.value;
    try {
        const e = simMap.queryTerrainElevation([lng, lat]);
        if (e !== null && Number.isFinite(e)) {
            terrainElevCache = { key: `${lng.toFixed(5)},${lat.toFixed(5)}`, value: e };
            return e;
        }
    } catch (err) { /* terrain not ready yet - use cached value */ }
    return terrainElevCache.value;
}

// Given a camera position and a target, both as MercatorCoordinates, works out the
// pitch/bearing Mapbox's FreeCameraOptions needs to look at the target. Mapbox's own
// lookAtPoint() helper only accepts a 2D lng/lat (no altitude), which isn't precise
// enough once the target has real height, so this computes it directly from geometry.
function computePitchBearing(camMerc, targetMerc, metersToMerc) {
    const dxM = (targetMerc.x - camMerc.x) / metersToMerc;       // + east
    const dyNorthM = -(targetMerc.y - camMerc.y) / metersToMerc; // + north
    const dzM = (targetMerc.z - camMerc.z) / metersToMerc;       // + up

    const horizontalDist = Math.max(Math.sqrt(dxM * dxM + dyNorthM * dyNorthM), 0.001);
    const verticalDrop = -dzM; // how far the camera must look down to reach the target

    const depressionDeg = Math.atan2(verticalDrop, horizontalDist) * 180 / Math.PI;
    let pitch = 90 - depressionDeg; // Mapbox: 0 = straight down, 90 = horizon
    pitch = Math.max(0, Math.min(180, pitch));

    let bearing = Math.atan2(dxM, dyNorthM) * 180 / Math.PI;
    if (bearing < 0) bearing += 360;

    return { pitch, bearing };
}

// Recomputes the Three.js model transform (translate + rotate + scale) for the current
// frame. The base +90° X rotation converts Three.js's Y-up convention into Mapbox's
// Z-up convention; MODEL_ROTATION_OFFSET_DEG is there for you to fine-tune once you see
// VTOL5M.glb actually rendered, in case its authored nose/up axes don't match this.
function updateVtolModelTransform(lng, lat, alt, yawDeg, pitchDeg, rollDeg, targetMerc, metersToMerc) {
    const merc = targetMerc || mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], alt);
    const scaleUnit = metersToMerc || merc.meterInMercatorCoordinateUnits();

    const yawRad = (yawDeg + MODEL_ROTATION_OFFSET_DEG.z) * Math.PI / 180;
    const pitchRad = (pitchDeg + MODEL_ROTATION_OFFSET_DEG.x) * Math.PI / 180;
    const rollRad = (rollDeg + MODEL_ROTATION_OFFSET_DEG.y) * Math.PI / 180;

    vtolModelTransform = {
        translateX: merc.x,
        translateY: merc.y,
        translateZ: merc.z,
        rotateX: Math.PI / 2 + pitchRad,
        rotateY: rollRad,
        rotateZ: -yawRad,
        scale: scaleUnit * MODEL_SCALE_FACTOR
    };
}

// Main per-frame camera update. Positions the Free Camera according to the active
// view mode, using the aircraft's real altitude (ground elevation + relative height)
// instead of a fixed pitch/zoom illusion - this is what makes altitude changes actually
// change what you see, in every view.
function updateSimCamera(lng, lat, relAlt, yawDeg, pitchDeg, rollDeg) {
    if (!simMap || !mapboxgl.FreeCameraOptions) return;

    const groundElev = getGroundElevation(lng, lat);
    const targetAlt = groundElev + Math.max(relAlt, 0);
    const targetMerc = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], targetAlt);
    const metersToMerc = targetMerc.meterInMercatorCoordinateUnits();

    updateVtolModelTransform(lng, lat, targetAlt, yawDeg, pitchDeg, rollDeg, targetMerc, metersToMerc);

    const camera = simMap.getFreeCameraOptions();

    if (currentViewMode === 'cockpit') {
        // Belly-mounted onboard camera: sits exactly at the aircraft's real position and
        // altitude, faces the direction of travel, and tips up/down with the vehicle's
        // own pitch attitude - a rigid mount, so it moves 1:1 with the airframe.
        camera.position = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], targetAlt);
        const lookPitch = Math.max(15, Math.min(165, 78 + pitchDeg));
        camera.setPitchBearing(lookPitch, yawDeg);

    } else if (currentViewMode === 'nadir') {
        // Straight-down chase-drone shot, positioned a fixed height above the aircraft's
        // own real altitude so it always frames both the vehicle and the ground below.
        const nadirAlt = groundElev + Math.max(relAlt, 0) + NADIR_CAMERA_OFFSET_M;
        camera.position = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], nadirAlt);
        camera.setPitchBearing(0, yawDeg);

    } else if (currentViewMode === 'orbit') {
        // Third-eye chase camera orbiting the aircraft's live 3D position, like
        // plot.ardupilot.org's 3D view - drag to rotate, scroll to zoom (setupOrbitControls).
        const azRad = orbitAzimuth * Math.PI / 180;
        const elRad = orbitElevation * Math.PI / 180;
        const dxE = orbitDistance * Math.cos(elRad) * Math.sin(azRad);
        const dyN = orbitDistance * Math.cos(elRad) * Math.cos(azRad);
        const dzUp = orbitDistance * Math.sin(elRad);

        const camMerc = new mapboxgl.MercatorCoordinate(
            targetMerc.x + dxE * metersToMerc,
            targetMerc.y - dyN * metersToMerc,
            targetMerc.z + dzUp * metersToMerc
        );
        camera.position = camMerc;
        const { pitch, bearing } = computePitchBearing(camMerc, targetMerc, metersToMerc);
        camera.setPitchBearing(pitch, bearing);
    }

    simMap.setFreeCameraOptions(camera);
}

// Adds the custom Mapbox layer that renders the live 3D VTOL model (Three.js + glTF)
// at the aircraft's real position/attitude. Hidden in cockpit view, since the camera
// sits at the aircraft itself there and would just be looking at the inside of its own
// model.
function addVtolModelLayer() {
    if (!simMap || vtolModelLayer) return;
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
        console.warn('THREE.js / GLTFLoader no están disponibles; el modelo 3D del VTOL no se mostrará.');
        return;
    }

    vtolModelLayer = {
        id: 'vtol-3d-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd(mbMap, gl) {
            this.map = mbMap;
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            const sun = new THREE.DirectionalLight(0xffffff, 1.0);
            sun.position.set(0, -70, 100).normalize();
            this.scene.add(sun);
            const fill = new THREE.DirectionalLight(0xffffff, 0.5);
            fill.position.set(0, 70, 50).normalize();
            this.scene.add(fill);
            this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

            this.modelGroup = new THREE.Group();
            this.scene.add(this.modelGroup);

            const loader = new THREE.GLTFLoader();
            loader.load(
                VTOL_MODEL_URL,
                (gltf) => {
                    this.modelGroup.add(gltf.scene);
                    vtolModelReady = true;
                },
                undefined,
                (err) => {
                    console.warn('No se pudo cargar el modelo 3D del VTOL. Revisa VTOL_MODEL_URL en sim.js:', err);
                }
            );

            this.renderer = new THREE.WebGLRenderer({
                canvas: mbMap.getCanvas(),
                context: gl,
                antialias: true
            });
            this.renderer.autoClear = false;
        },
        render(gl, matrix) {
            if (currentViewMode === 'cockpit' || !vtolModelTransform) {
                this.map && this.map.triggerRepaint();
                return;
            }

            const t = vtolModelTransform;
            const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), t.rotateX);
            const rotY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), t.rotateY);
            const rotZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), t.rotateZ);

            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(t.translateX, t.translateY, t.translateZ)
                .scale(new THREE.Vector3(t.scale, -t.scale, t.scale))
                .multiply(rotX).multiply(rotY).multiply(rotZ);

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
        }
    };

    simMap.addLayer(vtolModelLayer);
}

// Re-draws the camera from the last known telemetry frame without waiting for playback -
// used by the orbit drag/zoom handlers so the view responds instantly even while paused.
function refreshCameraNow() {
    if (lastFrame.lng === null) return;
    updateSimCamera(lastFrame.lng, lastFrame.lat, lastFrame.relAlt, lastFrame.yaw, lastFrame.pitch, lastFrame.roll);
}

// Mouse (and touch) controls for the orbit / third-eye view: drag to rotate around the
// aircraft, scroll wheel to zoom in/out - only active while currentViewMode === 'orbit'.
function setupOrbitControls() {
    const container = document.getElementById('simMap');
    if (!container) return;

    container.addEventListener('wheel', (e) => {
        if (currentViewMode !== 'orbit') return;
        e.preventDefault();
        orbitDistance = Math.max(ORBIT_MIN_DIST, Math.min(ORBIT_MAX_DIST, orbitDistance * (1 + e.deltaY * 0.001)));
        refreshCameraNow();
    }, { passive: false });

    container.addEventListener('mousedown', (e) => {
        if (currentViewMode !== 'orbit') return;
        isOrbitDragging = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isOrbitDragging) return;
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        orbitAzimuth = (orbitAzimuth + dx * 0.4 + 360) % 360;
        orbitElevation = Math.max(ORBIT_MIN_ELEV, Math.min(ORBIT_MAX_ELEV, orbitElevation - dy * 0.3));
        refreshCameraNow();
    });

    window.addEventListener('mouseup', () => { isOrbitDragging = false; });

    // Touch equivalents (tablets/phones)
    container.addEventListener('touchstart', (e) => {
        if (currentViewMode !== 'orbit' || e.touches.length !== 1) return;
        isOrbitDragging = true;
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isOrbitDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - lastPointerX;
        const dy = e.touches[0].clientY - lastPointerY;
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
        orbitAzimuth = (orbitAzimuth + dx * 0.4 + 360) % 360;
        orbitElevation = Math.max(ORBIT_MIN_ELEV, Math.min(ORBIT_MAX_ELEV, orbitElevation - dy * 0.3));
        refreshCameraNow();
    }, { passive: true });

    window.addEventListener('touchend', () => { isOrbitDragging = false; });
}

document.addEventListener('DOMContentLoaded', setupOrbitControls);


function drawPFD(roll, pitch) {
    const canvas = document.getElementById('pfdCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width; 
    const h = canvas.height;
    
    // Clear the whole canvas frame first
    ctx.clearRect(0, 0, w, h);
    
    // Save state before setting up the circular mask
    ctx.save();
    
    // --- CREATE THE CIRCULAR CLIP MASK ---
    const radius = Math.min(w, h) * 0.48; // Calculates maximum circle radius based on dimensions
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.clip(); // LOCKS ALL SUBSEQUENT DRAWING INSIDE THIS CIRCLE

    // --- 1. DRAW ATTITUDE BACKGROUND (ROTATING & TRANSLATING) ---
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-roll * Math.PI / 180);
    
    const pixelsPerDegree = 4; 
    const pitchOffset = pitch * pixelsPerDegree; 
    
    // Sky / Ground Drawing (Locked within the circle bounds)
    ctx.fillStyle = "#1e40af"; // Deep Professional Avionics Sky Blue
    ctx.fillRect(-w * 2, -h * 4 + pitchOffset, w * 4, h * 4);
    ctx.fillStyle = "#451a03"; // Modern Charcoal Muted Earth Brown
    ctx.fillRect(-w * 2, pitchOffset, w * 4, h * 4);
    
    // Horizon Line
    ctx.strokeStyle = "#ffffff"; 
    ctx.lineWidth = 3;
    ctx.beginPath(); 
    ctx.moveTo(-w, pitchOffset); 
    ctx.lineTo(w, pitchOffset); 
    ctx.stroke();
    
    // --- 2. DRAW PITCH LADDER CALIBRATION MARKS ---
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    for (let i = -30; i <= 30; i += 5) {
        if (i === 0) continue;
        const yPos = pitchOffset - (i * pixelsPerDegree);
        if (yPos < -h/2 || yPos > h/2) continue;
        
        let barWidth = i % 10 === 0 ? 50 : 25;
        ctx.lineWidth = i % 10 === 0 ? 2 : 1;
        
        ctx.beginPath();
        ctx.moveTo(-barWidth, yPos); ctx.lineTo(-10, yPos);
        ctx.moveTo(10, yPos); ctx.lineTo(barWidth, yPos);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-barWidth, yPos); ctx.lineTo(-barWidth, yPos + (i > 0 ? 5 : -5));
        ctx.moveTo(barWidth, yPos); ctx.lineTo(barWidth, yPos + (i > 0 ? 5 : -5));
        ctx.stroke();
        
        if (i % 10 === 0) {
            ctx.fillText(Math.abs(i).toString(), -barWidth - 14, yPos);
            ctx.fillText(Math.abs(i).toString(), barWidth + 14, yPos);
        }
    }
    ctx.restore(); // Restores context back out of the rotation matrix
    
    // --- 3. DRAW FIXED STATIC BANK/ROLL INDICATOR ---
    ctx.save();
    ctx.translate(w / 2, h / 2);
    
    const rollArcRadius = radius * 0.85; // Scales arc relative to the circle width
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(0, 0, rollArcRadius, -150 * Math.PI / 180, -30 * Math.PI / 180);
    ctx.stroke();
    
    const rollAngles = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60];
    rollAngles.forEach(angle => {
        const rad = (angle - 90) * Math.PI / 180;
        const innerX = Math.cos(rad) * rollArcRadius;
        const innerY = Math.sin(rad) * rollArcRadius;
        
        const tickLen = Math.abs(angle) % 30 === 0 || angle === 0 ? 10 : 6;
        const outerX = Math.cos(rad) * (rollArcRadius - tickLen);
        const outerY = Math.sin(rad) * (rollArcRadius - tickLen);
        
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
    });
    
    // Dynamic Rolling Pointer Pointer
    ctx.save();
    ctx.rotate(-roll * Math.PI / 180);
    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    ctx.moveTo(0, -rollArcRadius + 2);
    ctx.lineTo(-7, -rollArcRadius + 14);
    ctx.lineTo(7, -rollArcRadius + 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
    
    // --- 4. FIXED AIRCRAFT CROSSHAIR INDICATOR ---
    ctx.strokeStyle = "#f43f5e"; 
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    
    ctx.beginPath();
    ctx.moveTo(w / 2 - 40, h / 2); ctx.lineTo(w / 2 - 15, h / 2); ctx.lineTo(w / 2 - 15, h / 2 + 8);
    ctx.moveTo(w / 2 + 40, h / 2); ctx.lineTo(w / 2 + 15, h / 2); ctx.lineTo(w / 2 + 15, h / 2 + 8);
    ctx.moveTo(w / 2 - 2, h / 2); ctx.lineTo(w / 2 + 2, h / 2);
    ctx.moveTo(w / 2, h / 2 - 2); ctx.lineTo(w / 2, h / 2 + 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore(); // REMOVES CLIPPING MASK COMPLETELY FOR NEXT GLOBAL DRAWS

    // --- 5. OPTIONAL: DRAW COCKPIT INSTRUMENT BEZEL RING ---
    // This gives it a slight outer rim border so it sits elegantly on screen
    ctx.strokeStyle = "#475569"; // Sleek gray rim
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
}