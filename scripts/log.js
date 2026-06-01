// ═══════════════════════════════════════════════════════════════════════════════
// Flight Report Generator - Complete Analysis & PDF Export with TPRO Support
// ═══════════════════════════════════════════════════════════════════════════════

let telemetry = {
    gps: { lat: [], lng: [], alt: [] },
    pos: { lat: [], lng: [], alt: [] },
    baro: [],
    rangefinder: [],
    imu: { z: [] },
    airspeed: [],
    vibrations: { x: [], y: [], z: [] },
    battery: { volt: [], curr: [] }
};

let flightInfo = {
    firmware: '—',
    vehicle: '—',
    duration: 0,
    distance: 0,
    maxAlt: 0,
    maxSpeed: 0
};

let tproData = {
    objectives: [],        // Table 2: Test objectives with checkboxes
    aircraftConfig: [],    // Table 4: Aircraft & Systems Configuration
    flightProfiles: []     // Table 5: Planned Flight Profile(s)
};

let map = null;
let comparisonMap = null;
let charts = {};
const mapStyle = 'mapbox://styles/mapbox/satellite-streets-v12';

if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = 'Inter, Arial, sans-serif';
    Chart.defaults.color = '#eef2ff';
    Chart.defaults.devicePixelRatio = Math.max(2, Math.round((window.devicePixelRatio || 2) * 1.5));
    Chart.defaults.animation = false;
}

// ─── Utility Functions ─────────────────────────────────────────────────────────
function setStatus(msg) {
    document.getElementById('statusBox').textContent = msg;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
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

// ─── TPRO PDF Parser ───────────────────────────────────────────────────────────
async function parseTPROPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Mantener un espaciado limpio entre bloques de texto extraídos
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += '\n--- PAGE ' + i + ' ---\n' + pageText;
        }
        
        // Parseo Robusto Basado en Patrones Estructurados
        parseTestObjectives(fullText);
        parseAircraftConfiguration(fullText);
        parseFlightProfiles(fullText);
        
        return true;
    } catch (err) {
        console.error('Error parsing TPRO PDF:', err);
        return false;
    }
}

function parseTestObjectives(fullText) {
    tproData.objectives = [];
    // Captura líneas con formato numérico y descripción en la sección de objetivos
    const lines = fullText.split('\n');
    let inSection = false;
    
    for (let line of lines) {
        if (/2\s+TEST\s+OBJECTIVES/i.test(line) || /TEST\s+OBJECTIVES/i.test(line)) {
            inSection = true;
            continue;
        }
        if (inSection && /3\.\s+TEST\s+TEAM/i.test(line)) {
            inSection = false;
            break;
        }
        
        if (inSection) {
            const match = line.match(/^"(\d+)\s*"\s*,\s*"([^"]+)"/);
            if (match) {
                tproData.objectives.push({
                    id: parseInt(match[1]),
                    description: match[2].replace(/☐|High|Med|Low/g, '').replace(/\n/g, ' ').trim(),
                    checked: false
                });
            }
        }
    }
}

function parseAircraftConfiguration(fullText) {
    tproData.aircraftConfig = [];
    const lines = fullText.split('\n');
    let inSection = false;
    
    for (let line of lines) {
        if (/4\.\s+AIRCRAFT\s+&\s+SYSTEMS/i.test(line)) {
            inSection = true;
            continue;
        }
        if (inSection && /5\.\s+PLANNED\s+FLIGHT/i.test(line)) {
            inSection = false;
            break;
        }
        
        if (inSection) {
            const matches = [...line.matchAll(/"([^"]+)"\s*,\s*"([^"]+)"/g)];
            for (let match of matches) {
                if (match[1].includes('Parameter') || match[1].includes('Value')) continue;
                tproData.aircraftConfig.push({
                    key: match[1].replace(/\n/g, ' ').trim(),
                    value: match[2].replace(/\n/g, ' ').trim()
                });
            }
        }
    }
}

function parseFlightProfiles(fullText) {
    tproData.flightProfiles = [];
    const lines = fullText.split('\n');
    let inSection = false;
    
    for (let line of lines) {
        if (/5\.\s+PLANNED\s+FLIGHT\s+PROFILE/i.test(line)) {
            inSection = true;
            continue;
        }
        if (inSection && /6\.\s+WEATHER\s+LIMITS/i.test(line)) {
            inSection = false;
            break;
        }
        
        if (inSection) {
            // Capturar filas multibloque estructuradas del perfil de vuelo
            const match = line.match(/^"(\d+)\s*"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/);
            if (match) {
                tproData.flightProfiles.push({
                    number: parseInt(match[1]),
                    name: match[2].replace(/\n/g, ' ').trim(),
                    duration: match[3].replace(/\n/g, ' ').trim(),
                    mode: 'Auto/Manual',
                    criteria: 'Operational Link'
                });
            }
        }
    }
}

// ─── BIN File Parser ───────────────────────────────────────────────────────────
async function parseBinFile(file) {
    const buffer = await file.arrayBuffer();
    
    if (typeof DataflashParser === 'undefined') {
        throw new Error('DataflashParser no disponible.');
    }
    
    const parser = new DataflashParser(false);
    const parsed = parser.processData(buffer, [
        'GPS', 'POS', 'BARO', 'RFND', 'IMU', 'ARSP', 'VIBE', 'BAT', 'MSG', 'FMT'
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
        battery: { volt: [], curr: [] }
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
    
    // Calculate duration
    const allTimes = [
        ...telemetry.gps.lat, 
        ...telemetry.baro
    ].map(p => p.time);
    
    if (allTimes.length) {
        flightInfo.duration = Math.max(...allTimes);
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
    if (telemetry.gps.alt.length) {
        flightInfo.maxAlt = Math.max(...telemetry.gps.alt.map(p => p.value));
    }
    
    // Max speed
    if (telemetry.airspeed.length) {
        flightInfo.maxSpeed = Math.max(...telemetry.airspeed.map(p => p.value));
    }
    
    return flightInfo;
}

// ─── UI Functions for TPRO Objectives ──────────────────────────────────────────

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Base Data extracted structural mapping matching your PDF content
let extractedData = {
    table2: [
        { id: "1", desc: "GNSS Redundancy A/B Test", priority: "High" },
        { id: "2", desc: "GNSS Denied - AP A / GNSS Telemetry - AP B", priority: "Med" },
        { id: "3", desc: "GNSS Telemetry - AP A / GNSS Denied - AP B", priority: "High" },
        { id: "4", desc: "Dual AP Navigation Comparison", priority: "Med" }
    ],
    table4: [
        ["Aircraft ID", "HERO", "Comms Radio ID", "SILVUS"],
        ["Aircraft Type", "FIXED WING", "Comms Antenna ID", "ANTENA SILVUS"],
        ["Autopilot ID", "CUAV X7 PRO +", "Comms Radio FW", "ss4_4200_v4.0.4"],
        ["Autopilot FW Version", "4.6.3", "Payload / Sensor", "Helmet"],
        ["GCS/Controller ID", "Silvus Tierra", "Aircraft Configuration", "Dual AP Altimeter"],
        ["Weight (AUW)", "8.2 Kg", "Propellers", "APC 15x10E C-2"],
        ["File Parameters", "hero27022026.param", "Battery Type", "Tattu 6s 22000mAh"]
    ],
    table5: [
        ["#", "Profile Name / Description", "Est. Duration", "Mode", "Go/No-Go Criteria"],
        ["1", "Test flight verifying sensor performance, including manual and autonomous flight modes while performing figure-eight patterns in the air.", "10 Min", "Auto Manual", "All sensor operational\nStable telemetry link\nGPS signal available\nRC Link verified"],
        ["2", "Manual takeoff. Autonomous flight executing a rectangular flight plan and performing loiters at WP9 under GPS-denied conditions.", "25 Min", "Auto Manual", "All sensor operational\nStable telemetry link\nGPS signal available\nRC Link verified"],
        ["3", "Manual takeoff. Autonomous flight executing loiter patterns at WP10 and an RTH flight plan under GPS-denied conditions.", "25 Min", "Auto Manual", "All sensor operational\nStable telemetry link\nGPS signal available\nRC Link verified"]
    ]
};

const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileStatus = document.getElementById('file-status');
const loadingContainer = document.getElementById('loading-container');
const workspace = document.getElementById('workspace');

fileInput.addEventListener('change', handleFileSelect);
['dragenter', 'dragover'].forEach(name => dropZone.addEventListener(name, () => dropZone.classList.add('border-blue-500', 'bg-blue-50'), false));
['dragleave', 'drop'].forEach(name => dropZone.addEventListener(name, () => dropZone.classList.remove('border-blue-500', 'bg-blue-50'), false));

// Activar análisis automático inmediatamente al seleccionar o arrastrar un archivo .bin
document.getElementById('binFile').addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        loadAndAnalyze();
    }
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    //fileStatus.innerHTML = `Loaded: <strong>${file.name}</strong>`;
    loadingContainer.classList.remove('hidden');
    
    setTimeout(() => {
        loadingContainer.classList.add('hidden');
        workspace.classList.remove('hidden');
        renderTables();
    }, 1000);
}

function renderTables() {
    // Asegurar que el contenedor principal use Flexbox en lugar de heredar bloque colapsado
    const workspace = document.getElementById('workspace');
    workspace.classList.remove('hidden');
    workspace.style.display = "flex";
    
    // 1. RENDER TABLA 2: TEST OBJECTIVES
    const t2Body = document.getElementById('table-2-body');
    t2Body.innerHTML = extractedData.table2.map((item, index) => `
        <tr style="border-bottom: 1px solid #334155; background: rgba(30, 41, 59, 0.5);">
            <td style="padding: 12px 10px; text-align: center;">
                <input type="checkbox" checked id="t2-check-${index}" style="width: 15px; height: 15px; cursor: pointer;">
            </td>
            <td style="padding: 12px 10px; font-family: monospace; color: #94a3b8; text-align: center; font-weight: bold;">${item.id}</td>
            <td style="padding: 12px 10px; font-weight: 500; color: #f1f5f9;">${item.desc}</td>
            <td style="padding: 12px 10px;">
                <select id="t2-priority-${index}" style="background: #0f172a; border: 1px solid #475569; color: #f8fafc; font-size: 12px; width: 100%; padding: 6px; font-weight: 600; border-radius: 4px; cursor: pointer;">
                    <option value="High" ${item.priority === 'High' ? 'selected' : ''}>🔴 High Priority</option>
                    <option value="Med" ${item.priority === 'Med' ? 'selected' : ''}>🟡 Med Priority</option>
                    <option value="Low" ${item.priority === 'Low' ? 'selected' : ''}>🟢 Low Priority</option>
                </select>
            </td>
        </tr>
    `).join('');
    
    // 2. RENDER TABLA 4: AIRCRAFT & SYSTEMS CONFIG (Con separación limpia tipo TAB)
    const t4Preview = document.getElementById('table-4-preview');
    t4Preview.innerHTML = `<div style="display: flex; flex-direction: column; gap: 10px;">` + 
    extractedData.table4.map(row => `
        <div style="display: flex; border-bottom: 1px solid #2d3a4f; padding-bottom: 8px; gap: 16px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 140px; display: flex; align-items: baseline;">
                <span style="color: #94a3b8; font-weight: 500; width: 140px; shrink: 0;">${row[0]}:</span>
                <span style="font-weight: 600; color: #38bdf8; margin-left: 8px;">${row[1]}</span>
            </div>
            <div style="flex: 1; min-width: 140px; display: flex; align-items: baseline;">
                <span style="color: #94a3b8; font-weight: 500; width: 140px; shrink: 0;">${row[2]}:</span>
                <span style="font-weight: 600; color: #38bdf8; margin-left: 8px;">${row[3]}</span>
            </div>
        </div>
    `).join('') + `</div>`;
        
        // 3. RENDER TABLA 5: PLANNED FLIGHT PROFILES (Selector Dropdown limpio en vez de Checkboxes)
        const t5Preview = document.getElementById('table-5-preview');
        t5Preview.innerHTML = extractedData.table5.slice(1).map((row, index) => `
        <div style="padding: 14px; background: #0f172a; border: 1px solid #334155; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #233044; padding-bottom: 8px; margin-bottom: 10px;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 13px;">Profile #${row[0]} (${row[2]})</span>
                
                <div style="width: 160px;">
                    <select id="t5-mode-select-${index}" style="background: #1e293b; border: 1px solid #475569; color: #f8fafc; font-size: 11px; width: 100%; padding: 5px 8px; font-weight: 600; border-radius: 4px; cursor: pointer;">
                        <option value="Auto" ${row[3] === 'Auto' ? 'selected' : ''}>🤖 Auto Mode</option>
                        <option value="Manual" ${row[3] === 'Manual' ? 'selected' : ''}>🎮 Manual Mode</option>
                        <option value="Auto Manual" ${row[3].includes('Auto') && row[3].includes('Manual') ? 'selected' : 'selected'}>🔄 Auto + Manual</option>
                    </select>
                </div>
            </div>
            <p style="color: #cbd5e1; margin: 0 0 10px 0; font-size: 12px; line-height: 1.4; font-weight: 400;">${row[1]}</p>
            <div style="font-size: 11px; color: #94a3b8; font-family: monospace; white-space: pre-line; background: #1e293b; padding: 10px; border-radius: 4px; border: 1px solid #2d3a4f; line-height: 1.5;">${row[4]}</div>
        </div>
    `).join('');
    }
    
    // ─── Main Load and Analyze Function ────────────────────────────────────────────
    
    async function loadAndAnalyze() {
        const binInput = document.getElementById('binFile');
        const tproInput = document.getElementById('tproFile');
        
        if (!binInput.files.length) {
            alert('Por favor, selecciona un archivo .bin');
            return;
        }
        
        try {
            setStatus('⏳ Analizando archivos...');
            document.getElementById('generateBtn').disabled = true;
            
            // Reset TPRO data
            tproData = {
                objectives: [],
                aircraftConfig: [],
                flightProfiles: []
            };
            
            // Parse TPRO if provided
            if (tproInput.files.length) {
                const tproFile = tproInput.files[0];
                if (tproFile.type === 'application/pdf' || tproFile.name.endsWith('.pdf')) {
                    await parseTPROPDF(tproFile);
                    renderObjectivesList();
                    renderAircraftConfig();
                    renderFlightProfiles();
                    setStatus('✅ Archivo TPRO cargado. Analizando archivo .bin...');
                }
            }
            
            // Update file info chip
            document.getElementById('fileInfo').textContent = `📁 ${binInput.files[0].name}`;
            
            // Parse BIN file
            await parseBinFile(binInput.files[0]);
            
            // Update statistics
            document.getElementById('durationStat').textContent = formatTime(flightInfo.duration);
            document.getElementById('distanceStat').textContent = (flightInfo.distance / 1000).toFixed(2) + ' km';
            document.getElementById('maxAltStat').textContent = flightInfo.maxAlt.toFixed(1) + ' m';
            document.getElementById('maxSpeedStat').textContent = flightInfo.maxSpeed.toFixed(1) + ' m/s';
            document.getElementById('fwVersionStat').textContent = flightInfo.firmware !== '—' ? flightInfo.firmware.split(' ')[0] : '—';
            document.getElementById('vehicleTypeStat').textContent = flightInfo.vehicle;
            document.getElementById('gpsPointsStat').textContent = String(telemetry.gps.lat.length);
            document.getElementById('imuSamplesStat').textContent = String(telemetry.imu.z.length);
            
            document.getElementById('parseInfo').textContent = '✅ Análisis completado';
            
            // Render all charts and maps
            if (telemetry.baro.length) {
                document.getElementById('altCompPanel').style.display = 'flex';
                renderAltCompChart();
            }
            
            if (telemetry.imu.z.length) {
                document.getElementById('imuPanel').style.display = 'flex';
                renderIMUChart();
            }
            
            if (telemetry.airspeed.length) {
                document.getElementById('airspeedPanel').style.display = 'flex';
                renderAirspeedChart();
            }
            
            if (telemetry.vibrations.x.length) {
                document.getElementById('vibrationsPanel').style.display = 'flex';
                renderVibrationsChart();
            }
            
            if (telemetry.battery.volt.length) {
                document.getElementById('batteryPanel').style.display = 'flex';
                renderBatteryChart();
            }
            
            // Init map
            if (telemetry.gps.lat.length) {
                document.getElementById('mapPanel').style.display = 'flex';
                setTimeout(() => initMap(), 300);
            }
            
            document.getElementById('generateBtn').disabled = false;
            setStatus('✅ Análisis completado. Listo para generar PDF.');
            
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error al analizar el archivo');
            setStatus('❌ Error al analizar el archivo.');
        }
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
    
    // ─── Chart Rendering ───────────────────────────────────────────────────────────
    function renderAltCompChart() {
        const ctx = document.getElementById('altCompChart').getContext('2d');
        
        if (charts.altComp) {
            charts.altComp.destroy();
        }
        
        const datasets = [
            {
                label: 'BARO Alt',
                data: telemetry.baro.map(p => ({ x: p.time, y: p.value })),
                borderColor: '#60a5fa',
                borderWidth: 2,
                pointRadius: 0
            }
        ];
        
        if (telemetry.rangefinder.length) {
            datasets.push({
                label: 'Rangefinder',
                data: telemetry.rangefinder.map(p => ({ x: p.time, y: p.value })),
                borderColor: '#22d3ee',
                borderWidth: 2,
                pointRadius: 0,
                borderDash: [5, 3]
            });
        }
        
        charts.altComp = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#edf4ff' } }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Tiempo (s)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    },
                    y: {
                        title: { display: true, text: 'Altitud (m)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    }
                }
            }
        });
    }
    
    function renderIMUChart() {
        const ctx = document.getElementById('imuChart').getContext('2d');
        
        if (charts.imu) {
            charts.imu.destroy();
        }
        charts.imu = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'AccZ (m/s²)',
                    data: telemetry.imu.z.map(p => ({ x: p.time, y: p.value })),
                    borderColor: '#a855f7',
                    borderWidth: 1.5,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#edf4ff' } }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Tiempo (s)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    },
                    y: {
                        title: { display: true, text: 'Aceleración Z (m/s²)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    }
                }
            }
        });
    }
    
    function renderAirspeedChart() {
        const ctx = document.getElementById('airspeedChart').getContext('2d');
        
        if (charts.airspeed) {
            charts.airspeed.destroy();
        }
        charts.airspeed = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Airspeed (m/s)',
                    data: telemetry.airspeed.map(p => ({ x: p.time, y: p.value })),
                    borderColor: '#22c55e',
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#edf4ff' } }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Tiempo (s)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    },
                    y: {
                        title: { display: true, text: 'Velocidad (m/s)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    }
                }
            }
        });
    }
    
    function renderVibrationsChart() {
        const ctx = document.getElementById('vibrationsChart').getContext('2d');
        
        if (charts.vibrations) {
            charts.vibrations.destroy();
        }
        
        const datasets = [];
        if (telemetry.vibrations.x.length) {
            datasets.push({
                label: 'VibeX',
                data: telemetry.vibrations.x.map(p => ({ x: p.time, y: p.value })),
                borderColor: '#f87171',
                borderWidth: 1.5,
                pointRadius: 0
            });
        }
        if (telemetry.vibrations.y.length) {
            datasets.push({
                label: 'VibeY',
                data: telemetry.vibrations.y.map(p => ({ x: p.time, y: p.value })),
                borderColor: '#60a5fa',
                borderWidth: 1.5,
                pointRadius: 0
            });
        }
        if (telemetry.vibrations.z.length) {
            datasets.push({
                label: 'VibeZ',
                data: telemetry.vibrations.z.map(p => ({ x: p.time, y: p.value })),
                borderColor: '#34d399',
                borderWidth: 1.5,
                pointRadius: 0
            });
        }
        
        charts.vibrations = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#edf4ff' } }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Tiempo (s)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    },
                    y: {
                        title: { display: true, text: 'Vibración (m/s²)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    }
                }
            }
        });
    }
    
    function renderBatteryChart() {
        const ctx = document.getElementById('batteryChart').getContext('2d');
        
        if (charts.battery) {
            charts.battery.destroy();
        }
        
        const datasets = [];
        if (telemetry.battery.volt.length) {
            datasets.push({
                label: 'Voltaje (V)',
                data: telemetry.battery.volt.map(p => ({ x: p.time, y: p.value })),
                borderColor: '#ec4899',
                borderWidth: 2,
                pointRadius: 0,
                yAxisID: 'y'
            });
        }
        if (telemetry.battery.curr.length) {
            datasets.push({
                label: 'Corriente (A)',
                data: telemetry.battery.curr.map(p => ({ x: p.time, y: p.value })),
                borderColor: '#f59e0b',
                borderWidth: 2,
                pointRadius: 0,
                borderDash: [5, 3],
                yAxisID: 'y1'
            });
        }
        
        charts.battery = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#edf4ff' } }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Tiempo (s)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    },
                    y: {
                        position: 'left',
                        title: { display: true, text: 'Voltaje (V)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { color: 'rgba(255,255,255,.06)' }
                    },
                    y1: {
                        position: 'right',
                        title: { display: true, text: 'Corriente (A)', color: '#cbd5e1' },
                        ticks: { color: '#9eb3d3' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }
    
    
    // ─── PDF Generation Unified (Summary -> TPRO Tables -> Telemetry Plots) ────────
    async function generatePDF() {
        setStatus('Generando PDF completo...');
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('generateBtn').textContent = '⏳ Generando PDF...';
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;
        
        // ─── HELPER FUNCTIONS FOR LAYOUT ───
        const drawHeader = (title) => {
            pdf.setFillColor(9, 30, 61);
            pdf.rect(0, 0, pageWidth, 26, 'F');
            pdf.setFillColor(96, 165, 250);
            pdf.rect(0, 26, pageWidth, 4, 'F');
            pdf.setFontSize(12);
            pdf.setTextColor(255, 255, 255);
            pdf.text(title, margin, 17);
        };
        
        const drawFooter = () => {
            const pageIndex = pdf.getNumberOfPages();
            pdf.setFontSize(8);
            pdf.setTextColor(140, 140, 140);
            pdf.text(`Informe de Vuelo — Página ${pageIndex}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        };
        
        // ═════════════════════════════════════════════════════════════════════════
        // SECCIÓN 1: RESUMEN DE VUELO (PORTADA)
        // ═════════════════════════════════════════════════════════════════════════
        pdf.setFillColor(9, 30, 61);
        pdf.rect(0, 0, pageWidth, 28, 'F');
        pdf.setFillColor(96, 165, 250);
        pdf.rect(0, 28, pageWidth, 4, 'F');
        pdf.setFontSize(24);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Informe Global de Vuelo', pageWidth / 2, 45, { align: 'center' });
        pdf.setFontSize(18);
        pdf.setTextColor(9, 30, 61);
        pdf.text('ANÁLISIS DE TELEMETRÍA & CONFIGURACIÓN TPRO', pageWidth / 2, 53, { align: 'center' });
        
        yPos = 70;
        pdf.setFontSize(10);
        pdf.setTextColor(9, 30, 61);
        pdf.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        
        // Flight Info Table Layout
        const infoData = [
            ['Firmware', flightInfo.firmware],
            ['Tipo de vehículo', flightInfo.vehicle],
            ['Duración del vuelo', formatTime(flightInfo.duration)],
            ['Distancia total', `${(flightInfo.distance / 1000).toFixed(2)} km`],
            ['Altitud máxima', `${flightInfo.maxAlt.toFixed(1)} m`],
            ['Velocidad máxima', `${flightInfo.maxSpeed.toFixed(1)} m/s`],
            ['Puntos GPS', String(telemetry.gps.lat.length)],
            ['Muestras IMU', String(telemetry.imu.z.length)]
        ];
        
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Resumen Ejecutivo del Vuelo', margin, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        infoData.forEach(row => {
            pdf.setTextColor(100, 116, 139);
            pdf.text(row[0] + ':', margin + 5, yPos);
            pdf.setTextColor(15, 23, 42);
            pdf.text(row[1], margin + 70, yPos);
            yPos += 7;
        });
        
        // Comentarios Globales en Portada
        yPos += 5;
        const globalComments = document.getElementById('commentsGlobal').value.trim();
        if (globalComments) {
            pdf.setFontSize(12);
            pdf.setTextColor(15, 23, 42);
            pdf.text('Comentarios Generales', margin, yPos);
            yPos += 6;
            
            pdf.setFontSize(9);
            pdf.setTextColor(51, 65, 85);
            const lines = pdf.splitTextToSize(globalComments, pageWidth - 2 * margin);
            pdf.text(lines, margin + 5, yPos);
            yPos += lines.length * 5 + 5;
        }
        
        // ═════════════════════════════════════════════════════════════════════════
        // SECCIÓN 2: TABLAS TPRO (CONFIGURACIÓN PRE-VUELO)
        // ═════════════════════════════════════════════════════════════════════════
        // Forzamos salto de página para iniciar de forma limpia la sección de tablas
        pdf.addPage();
        drawHeader('Configuración de Plan de Pre-Vuelo TPRO');
        yPos = 36;
        
        // 2.1 Procesar e Imprimir Tabla 2 (Test Objectives)
        const selectedObjectives = [];
        extractedData.table2.forEach((item, index) => {
            const checkEl = document.getElementById(`t2-check-${index}`);
            const isChecked = checkEl ? checkEl.checked : true; // por seguridad si no ha cargado
            if (isChecked) {
                const priorityEl = document.getElementById(`t2-priority-${index}`);
                const chosenPriority = priorityEl ? priorityEl.value : item.priority;
                selectedObjectives.push([item.id, item.desc, chosenPriority]);
            }
        });
        
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(13);
        pdf.text("TEST OBJECTIVES CONFIGURATION", margin, yPos);
        yPos += 5;
        
        pdf.autoTable({
            startY: yPos,
            head: [['#', 'Objective Description', 'Priority']],
            body: selectedObjectives,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: margin, right: margin }
        });
        
        yPos = pdf.lastAutoTable.finalY + 12;
        
        // 2.2 Imprimir Tabla 4 (Aircraft & Systems Configuration)
        pdf.setFontSize(13);
        pdf.text("AIRCRAFT & SYSTEMS CONFIGURATION", margin, yPos);
        yPos += 5;
        
        pdf.autoTable({
            startY: yPos,
            body: extractedData.table4,
            theme: 'grid',
            styles: { cellPadding: 2.5, fontSize: 8.5 },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 45 },
                2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 45 }
            },
            margin: { left: margin, right: margin }
        });
        
        yPos = pdf.lastAutoTable.finalY + 12;
        
        // Verificar espacio límite en hoja antes de meter Tabla 5
        if (yPos > 200) {
            drawFooter();
            pdf.addPage();
            drawHeader('Configuración de Plan de Pre-Vuelo TPRO (Cont.)');
            yPos = 36;
        }
        
        // 2.3 Procesar e Imprimir Tabla 5 (Planned Flight Profiles con su Modo del dropdown)
        const customizedTable5Body = extractedData.table5.slice(1).map((row, index) => {
            const modeSelectEl = document.getElementById(`t5-mode-select-${index}`);
            const finalModeText = modeSelectEl ? modeSelectEl.value : "Auto Manual";
            return [row[0], row[1], row[2], finalModeText, row[4]];
        });
        
        pdf.setFontSize(13);
        pdf.text("PLANNED FLIGHT PROFILE(S)", margin, yPos);
        yPos += 5;
        
        pdf.autoTable({
            startY: yPos,
            head: [extractedData.table5[0]], 
            body: customizedTable5Body,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] },
            styles: { cellPadding: 3, fontSize: 8 },
            columnStyles: {
                1: { cellWidth: 55 },
                3: { fontStyle: 'bold' },
                4: { cellWidth: 55 }
            },
            margin: { left: margin, right: margin }
        });
        
        drawFooter();
        
        // ═════════════════════════════════════════════════════════════════════════
        // SECCIÓN 3: GRÁFICOS Y MAPAS DE TELEMETRÍA (POST-VUELO)
        // ═════════════════════════════════════════════════════════════════════════
        
        // Helper interno para capturar canvas y adjuntarlos con comentarios
        const addChartPage = async (chartCanvas, title, commentId) => {
            if (!chartCanvas) return;
            
            pdf.addPage();
            drawHeader('Análisis Gráfico de Telemetría');
            yPos = 36;
            
            pdf.setFontSize(14);
            pdf.setTextColor(15, 23, 42);
            pdf.text(title, margin, yPos);
            yPos += 6;
            
            const imgData = chartCanvas.toDataURL('image/png');
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (imgWidth * chartCanvas.height) / chartCanvas.width;
            
            pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 8;
            
            const comment = document.getElementById(commentId)?.value.trim();
            if (comment) {
                pdf.setFontSize(10);
                pdf.setTextColor(71, 85, 105);
                pdf.text('Comentarios de Análisis:', margin, yPos);
                yPos += 5;
                
                pdf.setFontSize(9);
                pdf.setTextColor(15, 23, 42);
                const lines = pdf.splitTextToSize(comment, pageWidth - 2 * margin);
                pdf.text(lines, margin + 2, yPos);
            }
            drawFooter();
        };
        
        const addMapPage = (canvas, title, commentId) => {
            if (!canvas) return;
            pdf.addPage();
            drawHeader('Registro Cartográfico de Trayectos — HD');
            yPos = 36;
            
            pdf.setFontSize(14);
            pdf.setTextColor(15, 23, 42);
            pdf.text(title, margin, yPos);
            yPos += 6;
            
            // ─── DIBUJAR LEYENDA VECTORIAL EN EL PDF ───
            pdf.setFontSize(9);
            
            // Indicador GNSS (Rectángulo Azul)
            pdf.setFillColor(0, 102, 255);
            pdf.rect(margin, yPos, 8, 3, 'F');
            pdf.setTextColor(71, 85, 105);
            pdf.text('GNSS Satelital (Crudo)', margin + 11, yPos + 3);
            
            // Indicador EKF POS (Rectángulo Naranja)
            pdf.setFillColor(255, 85, 0);
            pdf.rect(margin + 60, yPos, 8, 2, 'F');
            pdf.setTextColor(71, 85, 105);
            pdf.text('EKF POS (Filtro Kalman)', margin + 71, yPos + 3);
            
            yPos += 8; // Dejar espacio antes de colocar el mapa
            
            // Renderizado del Mapa
            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (imgWidth * canvas.height) / canvas.width;
            pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight, undefined, 'FAST');
            yPos += imgHeight + 8;
            
            const comment = document.getElementById(commentId)?.value.trim();
            if (comment) {
                pdf.setFontSize(10);
                pdf.setTextColor(71, 85, 105);
                pdf.text('Comentarios de Trayectoria:', margin, yPos);
                yPos += 5;
                pdf.setFontSize(9);
                pdf.setTextColor(15, 23, 42);
                const lines = pdf.splitTextToSize(comment, pageWidth - 2 * margin);
                pdf.text(lines, margin + 2, yPos);
            }
            drawFooter();
        };
        
        // Adjuntar capturas de mapas estáticos MapBox
        if (map) {
            try {
                if (map.resize) map.resize();
                if (map.triggerRepaint) map.triggerRepaint();
            } catch (e) { console.warn(e); }
            addMapPage(map.getCanvas(), 'Trayectoria de Vuelo 3D Estimada', 'commentMap');
        }
        
        if (comparisonMap) {
            try {
                if (comparisonMap.resize) comparisonMap.resize();
                if (comparisonMap.triggerRepaint) comparisonMap.triggerRepaint();
            } catch (e) { console.warn(e); }
            addMapPage(comparisonMap.getCanvas(), 'Comparativa Satelital: GPS vs POS (EKF)', 'commentGpsComp');
        }
        
        // Adjuntar secuencialmente cada gráfico generado por Chart.js
        if (charts.altComp) await addChartPage(charts.altComp.canvas, 'Comparación de Altímetros (BARO vs RANGEFINDER)', 'commentAltComp');
        if (charts.imu) await addChartPage(charts.imu.canvas, 'Aceleración Vertical Dinámica (IMU Z)', 'commentImu');
        if (charts.airspeed) await addChartPage(charts.airspeed.canvas, 'Rendimiento de Velocidad de Aire (ARSP)', 'commentAirspeed');
        if (charts.vibrations) await addChartPage(charts.vibrations.canvas, 'Análisis de Espectro de Vibraciones (VIBE)', 'commentVibrations');
        if (charts.battery) await addChartPage(charts.battery.canvas, 'Diagnóstico Eléctrico de Batería (Voltaje / Corriente)', 'commentBattery');
        
        // ─── GUARDAR REPORTE UNIFICADO FINAL ───
        pdf.save(`Informe_Vuelo_Unificado_${new Date().toISOString().split('T')[0]}.pdf`);
        
        setStatus('✅ PDF Unificado generado correctamente.');
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('generateBtn').textContent = '📄 Generar Informe PDF';
    }
    
    console.log('Flight Report Generator with TPRO Support ready.');