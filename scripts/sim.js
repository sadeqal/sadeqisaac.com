// ═══════════════════════════════════════════════════════════════════════════════
// Flight Simulator
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

let simMap = null;
let simCanvasElement = null;
let isSimulatingFlight = false;
let simFrameIndex = 0;
let simAnimationId = null;
let simStartTimeReal = 0;
let simStartTimeLog = 0;
let lastFrameTimeReal = 0; // Tracking variable for smooth fallback rendering

// Global State Controllers
let currentViewMode = 'inclined'; 
let isUserInteractingWithSlider = false;


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

function haversineMetres(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

async function loadAndAnalyze() {
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
}

// ─── Flight Simulation ───────────────────────────────────────────────

function toggleFlightSimulation() {
    // FIX: Changed from 'simControlBtn' to 'playPauseBtn'
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
        simAnimationId = requestAnimationFrame(runSimulationFrameLoop);
    }
}

function runSimulationFrameLoop() {
    if (!isSimulatingFlight) return;
    
    // Advance the timeframe track index safely
    simFrameIndex++;
    
    if (simFrameIndex >= telemetry.gps.lat.length) {
        isSimulatingFlight = false;
        simFrameIndex = 0;
        const btn = document.getElementById('playPauseBtn');
        if (btn) btn.textContent = "▶️";
        return;
    }
    
    // Reuse your new optimized camera and PFD rendering matrix smoothly!
    updateFlightPositionFrame(simFrameIndex);
    
    simAnimationId = requestAnimationFrame(runSimulationFrameLoop);
}

/*function runSimulationFrame(timestamp) {
    if (!isSimulatingFlight) return;
    
    const maxFrames = telemetry.gps.lat.length;
    let exactIndex = 0;
    
    // 1. --- CALCULATE FRACTIONAL TIMELINE POSITION ---
    if (telemetry.gps.time && telemetry.gps.time.length > 0) {
        if (!simStartTimeReal) {
            simStartTimeReal = performance.now();
            simStartTimeLog = telemetry.gps.time[0].value; 
        }
        
        const elapsedRealMs = performance.now() - simStartTimeReal;
        
        while (simFrameIndex < maxFrames - 1) {
            const nextFrameLogTime = telemetry.gps.time[simFrameIndex + 1].value;
            const elapsedLogMs = nextFrameLogTime - simStartTimeLog;
            
            if (elapsedLogMs > elapsedRealMs) break;
            simFrameIndex++;
        }
        
        // Calculate interpolation factor between this log frame and the next
        if (simFrameIndex < maxFrames - 1) {
            const currentLogTime = telemetry.gps.time[simFrameIndex].value;
            const nextLogTime = telemetry.gps.time[simFrameIndex + 1].value;
            const frameDuration = nextLogTime - currentLogTime;
            const frameElapsed = elapsedRealMs - (currentLogTime - simStartTimeLog);
            exactIndex = simFrameIndex + (frameDuration > 0 ? (frameElapsed / frameDuration) : 0);
        } else {
            exactIndex = simFrameIndex;
        }
    } else {
        // Fallback Timeline Percentages
        if (!simStartTimeReal) simStartTimeReal = performance.now();
        
        const elapsedRealSeconds = (performance.now() - simStartTimeReal) / 1000;
        const totalFlightDurationSeconds = flightInfo.duration || (maxFrames / 10);
        const progressPercent = elapsedRealSeconds / totalFlightDurationSeconds;
        
        // Maintain a continuous decimal representation of the index
        exactIndex = progressPercent * (maxFrames - 1);
    }
    
    // 2. --- ESCAPE GUARD: End of Flight Reached ---
    if (exactIndex >= maxFrames - 1) {
        isSimulatingFlight = false;
        simFrameIndex = 0;
        simStartTimeReal = 0;
        const btn = document.getElementById('simControlBtn');
        btn.textContent = "▶️ Start Simulation";
        btn.style.background = "#0284c7";
        return;
    }
    
    // 3. --- LINEAR INTERPOLATION (LERP) ENGINE ---
    // Break down the decimal index into integer bounding rows
    const indexBase = Math.floor(exactIndex);
    const lerpFactor = exactIndex - indexBase; // The decimal fraction (0.0 to 1.0)
    const nextIndex = Math.min(indexBase + 1, maxFrames - 1);
    
    // Smoothly blend Latitude and Longitude coordinates
    const lat1 = telemetry.gps.lat[indexBase].value;
    const lat2 = telemetry.gps.lat[nextIndex].value;
    const lat = lat1 + (lat2 - lat1) * lerpFactor;
    
    const lng1 = telemetry.gps.lng[indexBase].value;
    const lng2 = telemetry.gps.lng[nextIndex].value;
    const lng = lng1 + (lng2 - lng1) * lerpFactor;
    
    // Smoothly blend Altitude
    let alt1 = 100, alt2 = 100;
    if (telemetry.baro && telemetry.baro[indexBase]) {
        alt1 = telemetry.baro[indexBase].value;
        alt2 = telemetry.baro[nextIndex] ? telemetry.baro[nextIndex].value : alt1;
    } else if (telemetry.gps.alt && telemetry.gps.alt[indexBase]) {
        alt1 = telemetry.gps.alt[indexBase].value;
        alt2 = telemetry.gps.alt[nextIndex] ? telemetry.gps.alt[nextIndex].value : alt1;
    }
    const alt = alt1 + (alt2 - alt1) * lerpFactor;
    
    // Smoothly blend Attitude Angles (Roll, Pitch, Yaw)
    let yaw = 0, pitch = 0, roll = 0;
    if (telemetry.att && telemetry.att.Roll && telemetry.att.Roll[indexBase]) {
        const roll1  = telemetry.att.Roll[indexBase].value || 0;
        const roll2  = telemetry.att.Roll[nextIndex]?.value || roll1;
        roll = roll1 + (roll2 - roll1) * lerpFactor;
        
        const pitch1 = telemetry.att.Pitch[indexBase].value || 0;
        const pitch2 = telemetry.att.Pitch[nextIndex]?.value || pitch1;
        pitch = pitch1 + (pitch2 - pitch1) * lerpFactor;
        
        let yaw1   = telemetry.att.Yaw[indexBase].value || 0;
        let yaw2   = telemetry.att.Yaw[nextIndex]?.value || yaw1;
        
        // Handle compass wrap-around handling (e.g., smoothly transition from 359° to 1°)
        let diff = yaw2 - yaw1;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        yaw = yaw1 + diff * lerpFactor;
    } else {
        // Math vector heading calculation fallback
        const nextLat = telemetry.gps.lat[nextIndex].value;
        const nextLng = telemetry.gps.lng[nextIndex].value;
        yaw = Math.atan2(nextLng - lng, nextLat - lat) * (180 / Math.PI);
        pitch = Math.sin(exactIndex * 0.02) * 4;
        roll  = Math.cos(exactIndex * 0.02) * 6;
    }
    
    // 4. --- UPDATE 3D MAP WINDOW VIEWPORT ---
    const zoomCalculado = 18.5 - Math.log2(Math.max(alt, 10) / 100);
    const mapboxPitch = Math.abs(pitch);
    let adjustedBearing = yaw;
    if (pitch < 0) {
        adjustedBearing = (yaw + 180) % 360;
    }
    
    simMap.jumpTo({
        center: [lng, lat],
        zoom: zoomCalculado,
        bearing: adjustedBearing,
        pitch: mapboxPitch
    });
    
    if (simCanvasElement) {
        simCanvasElement.style.transform = `scale(1.4) rotate(${-roll}deg)`;
    }
    
    // 5. --- UPDATE HUD UI METRICS ---
    document.getElementById('sim-hud-lat').textContent = lat.toFixed(6);
    document.getElementById('sim-hud-lng').textContent = lng.toFixed(6);
    document.getElementById('sim-hud-alt').textContent = alt.toFixed(1) + ' m';
    document.getElementById('sim-hud-yaw').textContent = ((yaw % 360 + 360) % 360).toFixed(1) + '°';
    document.getElementById('sim-hud-pitch').textContent = pitch.toFixed(1) + '°';
    document.getElementById('sim-hud-roll').textContent = roll.toFixed(1) + '°';
    
    // Store integer progress step for base evaluations
    simFrameIndex = Math.floor(exactIndex);
    
    simAnimationId = requestAnimationFrame(runSimulationFrame);
}*/


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

function switchView(mode) {
    currentViewMode = mode;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');
    
    if (mode === 'inclined') {
        simMap.dragRotate.enable();
        simMap.pitch.enable();
    } else if (mode === 'downward') {
        simMap.dragRotate.disable();
        simMap.easeTo({ pitch: 0, bearing: 0, duration: 400 });
    } else if (mode === 'default') {
        simMap.dragRotate.enable();
        simMap.easeTo({ pitch: 45, duration: 400 });
    }
}

function onTimelineSliderChange(value) {
    simFrameIndex = parseInt(value);
    updateFlightPositionFrame(simFrameIndex);
}

function updateFlightPositionFrame(index) {
    if (!telemetry.gps.lat[index]) return;

    const lat = telemetry.gps.lat[index].value;
    const lng = telemetry.gps.lng[index].value;
    const alt = telemetry.baro[index]?.value || telemetry.gps.alt[index]?.value || 0;
    
    let yaw = 0, pitch = 0, roll = 0;
    if (telemetry.att && telemetry.att.Roll) {
        roll = telemetry.att.Roll[index].value || 0;
        pitch = telemetry.att.Pitch[index].value || 0;
        yaw = telemetry.att.Yaw[index].value || 0;
    } else {
        // Simple procedural values fallback if ATT array parsed empty
        yaw = (index * 0.1) % 360;
    }

    // Synchronize slider and HUD elements
    if(!isUserInteractingWithSlider) {
        document.getElementById('timelineSlider').value = index;
    }
    
    const elapsedSec = (index / (telemetry.gps.lat.length - 1)) * flightInfo.duration;
    document.getElementById('currentTimeStamp').textContent = formatTime(elapsedSec);
    document.getElementById('pfd-alt').textContent = alt.toFixed(1) + 'm';
    document.getElementById('pfd-hdg').textContent = Math.round(yaw).toString().padStart(3, '0') + '°';
    
    // Draw Primary Flight Display
    drawPFD(roll, pitch);

    // Apply Viewport Position Matrix Transformations
    if (currentViewMode === 'inclined') {
        simMap.jumpTo({ center: [lng, lat] });
    } else if (currentViewMode === 'downward') {
        simMap.jumpTo({ center: [lng, lat], pitch: 0, bearing: 0 });
    } else {
        simMap.jumpTo({ center: [lng, lat], pitch: 45, bearing: yaw });
    }
}

function drawPFD(roll, pitch) {
    const canvas = document.getElementById('pfdCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width; const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-roll * Math.PI / 180);

    // Sky / Ground split
    const pitchOffset = pitch * 2; 
    ctx.fillStyle = "#0284c7"; // Sky Blue
    ctx.fillRect(-w, -h*2 + pitchOffset, w*2, h*2);
    ctx.fillStyle = "#7c2d12"; // Earth Brown
    ctx.fillRect(-w, pitchOffset, w*2, h*2);
    
    // Horizon Separator Line
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-w/2, pitchOffset); ctx.lineTo(w/2, pitchOffset); ctx.stroke();
    ctx.restore();

    // Fixed Aircraft Cross Indicator
    ctx.strokeStyle = "#f43f5e"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w/2 - 25, h/2); ctx.lineTo(w/2 - 5, h/2);
    ctx.moveTo(w/2 + 5, h/2); ctx.lineTo(w/2 + 25, h/2);
    ctx.moveTo(w/2, h/2 - 5); ctx.lineTo(w/2, h/2 + 5);
    ctx.stroke();
}