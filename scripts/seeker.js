/* ==========================================================
INTERCEPTOR BAY — simulation engine
========================================================== */

// -------- CONFIG --------------------------------------------------
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
const BASE = { lat: 40.2085, lng: -3.7792 };   // CONTAINER-01 location
const MAX_RANGE_KM = 8;
const INTERCEPT_THRESHOLD_KM = 0.12;
const RTB_THRESHOLD_KM = 0.05;
const TICK_MS = 1000;
const AUTO_CONTACT_MIN_MS = 13000;
const AUTO_CONTACT_MAX_MS = 22000;

const ISSUES = [
    'IMU calibration drift beyond tolerance',
    'Battery cell imbalance detected (cell 3)',
    'Intermittent telemetry link dropout',
    'GPS lock unstable — HDOP > 2.5',
    'ESC over-temperature warning, motor 2',
    'Payload release servo fault',
    'RC failsafe triggered during pre-arm check',
    'Low battery voltage on standby rail (13.9V)',
    'Compass interference near mount',
    'Barometer offset out of range',
    'Jetson thermal throttling (mission computer)',
    'Vibration levels above threshold, Z-axis',
];

// -------- STATE -----------------------------------------------------
let fleet = [];          // 100 interceptor units
let objectives = [];     // active radar contacts
let missionSeq = 1;
let contactSeq = 1;
let gameLive = false;
let tickTimer = null;
let autoContactTimer = null;
let map = null;
let baseMarker = null;
const droneMarkers = new Map();   // id -> {marker, el, popup}
const targetMarkers = new Map();  // id -> marker

// -------- DOM refs --------------------------------------------------
const el = {
    fleetGrid: document.getElementById('fleetGrid'),
    statOperational: document.getElementById('statOperational'),
    statFlying: document.getElementById('statFlying'),
    statIssues: document.getElementById('statIssues'),
    statContacts: document.getElementById('statContacts'),
    clock: document.getElementById('clock'),
    startGameBtn: document.getElementById('startGameBtn'),
    startSimBtn: document.getElementById('startSimBtn'),
    radarCanvas: document.getElementById('radarCanvas'),
    radarSweep: document.getElementById('radarSweep'),
    radarReadout: document.getElementById('radarReadout'),
    radarHint: document.getElementById('radarHint'),
    missionsList: document.getElementById('missionsList'),
    consoleLog: document.getElementById('consoleLog'),
    tooltip: document.getElementById('unitTooltip'),
};

// -------- GEO HELPERS -------------------------------------------------
function toRad(d){ return d * Math.PI / 180; }
function toDeg(r){ return r * 180 / Math.PI; }

function destPoint(lat, lng, distKm, bearingDeg){
    const R = 6371;
    const brng = toRad(bearingDeg);
    const lat1 = toRad(lat), lng1 = toRad(lng);
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distKm / R) +
    Math.cos(lat1) * Math.sin(distKm / R) * Math.cos(brng));
    const lng2 = lng1 + Math.atan2(
        Math.sin(brng) * Math.sin(distKm / R) * Math.cos(lat1),
        Math.cos(distKm / R) - Math.sin(lat1) * Math.sin(lat2));
        return { lat: toDeg(lat2), lng: toDeg(lng2) };
    }
    
    function distanceKm(lat1, lng1, lat2, lng2){
        const R = 6371;
        const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    
    function bearingFromBase(lat, lng){
        const lat1 = toRad(BASE.lat), lat2 = toRad(lat);
        const dLng = toRad(lng - BASE.lng);
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }
    
    function moveToward(fromLat, fromLng, toLat, toLng, stepKm){
        const d = distanceKm(fromLat, fromLng, toLat, toLng);
        if (d <= stepKm || d === 0) return { lat: toLat, lng: toLng, arrived: true };
        // bearing from (fromLat,fromLng) to (toLat,toLng)
        const lat1 = toRad(fromLat), lat2 = toRad(toLat);
        const dLng = toRad(toLng - fromLng);
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
        const p = destPoint(fromLat, fromLng, stepKm, bearing);
        return { lat: p.lat, lng: p.lng, arrived: false };
    }
    
    function rand(min, max){ return Math.random() * (max - min) + min; }
    function randInt(min, max){ return Math.floor(rand(min, max + 1)); }
    function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
    function pad2(n){ return n.toString().padStart(2, '0'); }
    function nowStamp(){
        const d = new Date();
        return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}Z`;
    }
    
    // ==========================================================
    // FLEET
    // ==========================================================
    function buildFleet(){
        fleet = [];
        for(let i = 1; i <= 100; i++){
            const hasIssue = Math.random() < 0.16;
            fleet.push({
                id: i,
                jetsonId: i,
                port: 14500 + (i - 1) * 10,
                status: hasIssue ? 'fault' : 'operational',
                issue: hasIssue ? pick(ISSUES) : null,
                state: 'standby',        // standby | armed | enroute | returning
                lat: null, lng: null,
                missionId: null,
            });
        }
    }
    
    function renderFleetGrid(){
        el.fleetGrid.innerHTML = '';
        fleet.forEach(d => {
            const div = document.createElement('div');
            div.className = 'unit ' + (d.status === 'operational' ? 'op' : 'fault');
            div.dataset.id = d.id;
            div.textContent = d.id;
            div.addEventListener('mouseenter', () => showUnitTooltip(d));
            div.addEventListener('mousemove', positionTooltip);
            div.addEventListener('mouseleave', hideUnitTooltip);
            el.fleetGrid.appendChild(div);
        });
    }
    
    function refreshUnitClasses(){
        fleet.forEach(d => {
            const cell = el.fleetGrid.querySelector(`.unit[data-id="${d.id}"]`);
            if (!cell) return;
            cell.classList.remove('op', 'fault', 'flying', 'returning');
            if (d.state === 'enroute' || d.state === 'armed') cell.classList.add('flying');
            else if (d.state === 'returning') cell.classList.add('returning');
            else cell.classList.add(d.status === 'operational' ? 'op' : 'fault');
        });
    }
    
    function showUnitTooltip(d){
        let html = `<div class="tt-id">INT-${pad2(d.id)}</div>`;
        html += `<div class="tt-row"><span>Jetson ID</span><b>${d.jetsonId}</b></div>`;
        html += `<div class="tt-row"><span>MAVLink UDP</span><b>${d.port}</b></div>`;
        html += `<div class="tt-row"><span>Status</span><b style="color:${d.status==='operational' ? 'var(--cyan)' : 'var(--amber)'}">${d.status === 'operational' ? 'OPERATIONAL' : 'FAULT'}</b></div>`;
        html += `<div class="tt-row"><span>State</span><b>${d.state.toUpperCase()}</b></div>`;
        if (d.issue) html += `<div class="tt-issue">⚠ ${d.issue}</div>`;
        el.tooltip.innerHTML = html;
        el.tooltip.classList.add('show');
    }
    function hideUnitTooltip(){ el.tooltip.classList.remove('show'); }
    function positionTooltip(e){
        const pad = 14;
        let x = e.clientX + pad, y = e.clientY + pad;
        const rect = el.tooltip.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - pad;
        if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - pad;
        el.tooltip.style.left = x + 'px';
        el.tooltip.style.top = y + 'px';
    }
    
    function availableDrones(){
        return fleet.filter(d => d.status === 'operational' && d.state === 'standby');
    }
    
    // ==========================================================
    // MAP
    // ==========================================================
    function initMap(){
        mapboxgl.accessToken = MAPBOX_TOKEN;
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [BASE.lng, BASE.lat],
            zoom: 15,
            pitch: 60,
            bearing: -18,
            antialias: true,
        });
        
        map.on('load', () => {
            // Add 3D Tower/Skyscraper extrusions
            map.addLayer({
                'id': 'sim-3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 14,
                'paint': {
                    'fill-extrusion-color': '#cbd5e1',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.6
                }
            });
            
            const baseEl = document.createElement('div');
            baseEl.className = 'base-marker';
            baseMarker = new mapboxgl.Marker({ element: baseEl })
            .setLngLat([BASE.lng, BASE.lat])
            .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(
                `<div class="flight-card"><div class="fc-id">CONTAINER-01</div>
         <div class="fc-row"><span>Role</span><b>Launch / recovery base</b></div>
         <div class="fc-row"><span>Fleet</span><b>100 units racked</b></div></div>`))
                .addTo(map);
            });
            
            map.on('error', (e) => {
                if (e && e.error && /access token|unauthorized/i.test(e.error.message || '')) {
                    logLine('sys', `⚠ Mapbox token missing/invalid — replace MAPBOX_TOKEN in interceptor-ops.js`);
                }
            });
        }
        
        function ensureDroneMarker(drone){
            if (droneMarkers.has(drone.id)) return droneMarkers.get(drone.id);
            const wrap = document.createElement('div');
            wrap.className = 'interceptor-marker';
            wrap.innerHTML = `<div class="ring"></div>
    <svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="#46e0c4" stroke="#052420" stroke-width="1.5"/></svg>`;
            const popup = new mapboxgl.Popup({ offset: 14, closeButton: true });
            const marker = new mapboxgl.Marker({ element: wrap })
            .setLngLat([drone.lng, drone.lat])
            .setPopup(popup)
            .addTo(map);
            const record = { marker, el: wrap, popup };
            droneMarkers.set(drone.id, record);
            return record;
        }
        
        function removeDroneMarker(id){
            const rec = droneMarkers.get(id);
            if (rec){ rec.marker.remove(); droneMarkers.delete(id); }
        }
        
        function updateDronePopup(drone, objective){
            const rec = droneMarkers.get(drone.id);
            if (!rec) return;
            const alt = drone.state === 'returning' ? randInt(35, 60) : randInt(60, 120);
            const spd = drone.speedKmh || randInt(240, 360);
            const heading = randInt(0, 359);
            const html = `
    <div class="flight-card">
      <div class="fc-id">INT-${pad2(drone.id)}</div>
      <div class="fc-row"><span>GCS mode</span><b>${drone.state === 'returning' ? 'RTL' : 'GUIDED'}</b></div>
      <div class="fc-row"><span>Alt</span><b>${alt} m</b></div>
      <div class="fc-row"><span>Speed</span><b>${spd} km/h</b></div>
      <div class="fc-row"><span>Heading</span><b>${heading}°</b></div>
      <div class="fc-row"><span>Battery</span><b>${drone.battery || 88}%</b></div>
      <div class="fc-row"><span>Target</span><b>${objective ? 'CT-' + pad2(objective.id) : '—'}</b></div>
      ${drone.state === 'enroute' ? `<button class="fc-abort" data-abort-id="${drone.id}">ABORT MISSION</button>` : ''}
    </div>`;
            rec.popup.setHTML(html);
        }
        
        function ensureTargetMarker(obj){
            if (targetMarkers.has(obj.id)) return targetMarkers.get(obj.id);
            const dot = document.createElement('div');
            dot.className = 'target-marker';
            const marker = new mapboxgl.Marker({ element: dot }).setLngLat([obj.lng, obj.lat]).addTo(map);
            targetMarkers.set(obj.id, marker);
            return marker;
        }
        function removeTargetMarker(id){
            const m = targetMarkers.get(id);
            if (m){ m.remove(); targetMarkers.delete(id); }
        }
        
        // ==========================================================
        // RADAR
        // ==========================================================
        const rctx = el.radarCanvas.getContext('2d');
        const R_CX = 160, R_CY = 160, R_MAXPX = 140;
        
        function drawRadar(){
            rctx.clearRect(0, 0, 320, 320);
            
            // range rings
            rctx.strokeStyle = 'rgba(70,224,196,0.16)';
            rctx.lineWidth = 1;
            for (let i = 1; i <= 4; i++){
                rctx.beginPath();
                rctx.arc(R_CX, R_CY, (R_MAXPX / 4) * i, 0, Math.PI * 2);
                rctx.stroke();
            }
            // crosshair
            rctx.beginPath();
            rctx.moveTo(R_CX - R_MAXPX, R_CY); rctx.lineTo(R_CX + R_MAXPX, R_CY);
            rctx.moveTo(R_CX, R_CY - R_MAXPX); rctx.lineTo(R_CX, R_CY + R_MAXPX);
            rctx.stroke();
            // 30deg spokes
            rctx.strokeStyle = 'rgba(70,224,196,0.08)';
            for (let a = 0; a < 360; a += 30){
                const rad = toRad(a);
                rctx.beginPath();
                rctx.moveTo(R_CX, R_CY);
                rctx.lineTo(R_CX + R_MAXPX * Math.sin(rad), R_CY - R_MAXPX * Math.cos(rad));
                rctx.stroke();
            }
            // range labels
            rctx.fillStyle = 'rgba(127,154,151,0.7)';
            rctx.font = '9px JetBrains Mono';
            for (let i = 1; i <= 4; i++){
                const km = (MAX_RANGE_KM / 4) * i;
                rctx.fillText(km.toFixed(1) + 'km', R_CX + 4, R_CY - (R_MAXPX / 4) * i + 3);
            }
            // center
            rctx.fillStyle = '#46e0c4';
            rctx.beginPath(); rctx.arc(R_CX, R_CY, 2.5, 0, Math.PI * 2); rctx.fill();
            
            // contacts
            objectives.forEach(o => {
                const r = Math.min(o.range / MAX_RANGE_KM, 1) * R_MAXPX;
                const rad = toRad(o.bearing);
                const x = R_CX + r * Math.sin(rad);
                const y = R_CY - r * Math.cos(rad);
                const color = o.assignedDroneId ? '#46e0c4' : '#ff5c5c';
                
                // velocity vector
                const vrad = toRad(o.heading);
                rctx.strokeStyle = color;
                rctx.globalAlpha = 0.7;
                rctx.beginPath();
                rctx.moveTo(x, y);
                rctx.lineTo(x + 14 * Math.sin(vrad), y - 14 * Math.cos(vrad));
                rctx.stroke();
                rctx.globalAlpha = 1;
                
                rctx.fillStyle = color;
                rctx.beginPath(); rctx.arc(x, y, 4, 0, Math.PI * 2); rctx.fill();
                rctx.shadowColor = color; rctx.shadowBlur = 8;
                rctx.beginPath(); rctx.arc(x, y, 4, 0, Math.PI * 2); rctx.fill();
                rctx.shadowBlur = 0;
                
                rctx.fillStyle = color;
                rctx.font = '9px JetBrains Mono';
                rctx.fillText(`CT-${pad2(o.id)}`, x + 7, y - 6);
            });
        }
        
        function updateRadarReadout(){
            if (!gameLive){
                el.radarReadout.textContent = 'STANDBY';
                el.radarHint.textContent = 'standby';
                return;
            }
            if (objectives.length === 0){
                el.radarReadout.textContent = 'NO CONTACTS — SCANNING';
                el.radarHint.textContent = 'scanning';
            } else {
                const nearest = objectives.reduce((a, b) => a.range < b.range ? a : b);
                el.radarReadout.textContent =
                `${objectives.length} CONTACT${objectives.length > 1 ? 'S' : ''} — NEAREST CT-${pad2(nearest.id)} @ ${nearest.range.toFixed(2)}km`;
                el.radarHint.textContent = `tracking ${objectives.length}`;
            }
        }
        
        // ==========================================================
        // MISSIONS / OBJECTIVES
        // ==========================================================
        function spawnObjective(){
            const bearing = randInt(0, 359);
            const range = rand(MAX_RANGE_KM * 0.85, MAX_RANGE_KM);
            const pos = destPoint(BASE.lat, BASE.lng, range, bearing);
            // heading roughly back toward base, with jitter
            const inboundBearing = (bearing + 180) % 360;
            const heading = (inboundBearing + rand(-25, 25) + 360) % 360;
            
            const obj = {
                id: contactSeq++,
                lat: pos.lat, lng: pos.lng,
                range, bearing, heading,
                stepKm: rand(0.15, 0.32),          // per-tick displacement
                speedKmh: Math.round(rand(90, 210)),
                assignedDroneId: null,
                status: 'inbound',
            };
            objectives.push(obj);
            ensureTargetMarker(obj);
            logLine('sys', `RADAR CONTACT CT-${pad2(obj.id)} acquired — brg ${bearing.toFixed(0)}° rng ${range.toFixed(2)}km spd ${obj.speedKmh}km/h`);
        }
        
        function assignMissions(){
            const unassigned = objectives.filter(o => !o.assignedDroneId && o.status === 'inbound');
            if (unassigned.length === 0) return;
            unassigned.forEach(obj => {
                const candidates = availableDrones();
                if (candidates.length === 0){
                    logLine('sys', `⚠ NO AVAILABLE INTERCEPTORS for CT-${pad2(obj.id)} — standing by`);
                    return;
                }
                // nearest standby drone to base is arbitrary (all start at base); pick lowest id for determinism-ish
                const drone = candidates.sort((a, b) => a.id - b.id)[0];
                drone.state = 'armed';
                drone.lat = BASE.lat; drone.lng = BASE.lng;
                drone.missionId = missionSeq++;
                drone.battery = randInt(78, 97);
                drone.speedKmh = randInt(240, 360);
                obj.assignedDroneId = drone.id;
                obj.missionId = drone.missionId;
                
                logLine('arm', `[UDP ${drone.port}] ARM CMD → INT-${pad2(drone.id)} (Jetson-${drone.jetsonId}) ... ACK`);
                ensureDroneMarker(drone);
                
                setTimeout(() => {
                    if (drone.state !== 'armed') return; // aborted meanwhile
                    drone.state = 'enroute';
                    logLine('arm', `MISSION SET → INT-${pad2(drone.id)} guided intercept of CT-${pad2(obj.id)} (${obj.lat.toFixed(4)}, ${obj.lng.toFixed(4)})`);
                }, 700);
                
                refreshUnitClasses();
            });
        }
        
        function abortMission(droneId){
            const drone = fleet.find(d => d.id === droneId);
            if (!drone || (drone.state !== 'enroute' && drone.state !== 'armed')) return;
            const obj = objectives.find(o => o.assignedDroneId === droneId);
            drone.state = 'returning';
            logLine('abort', `ABORT CMD → INT-${pad2(drone.id)} (operator) — RTL issued`);
            if (obj){
                obj.assignedDroneId = null;
                obj.missionId = null;
            }
            refreshUnitClasses();
            renderMissions();
        }
        
        function tick(){
            // move objectives
            objectives.forEach(o => {
                const p = destPoint(o.lat, o.lng, o.stepKm, o.heading);
                o.lat = p.lat; o.lng = p.lng;
                o.range = distanceKm(BASE.lat, BASE.lng, o.lat, o.lng);
                o.bearing = bearingFromBase(o.lat, o.lng);
                const marker = targetMarkers.get(o.id);
                if (marker) marker.setLngLat([o.lng, o.lat]);
                
                if (o.range < 0.15 && !o.assignedDroneId){
                    logLine('hit', `⚠ BREACH — CT-${pad2(o.id)} reached perimeter unintercepted`);
                    o.status = 'breach';
                }
            });
            objectives = objectives.filter(o => o.status !== 'breach' || (removeTargetMarker(o.id), false));
            
            assignMissions();
            
            // move drones
            fleet.filter(d => d.state === 'enroute').forEach(d => {
                const obj = objectives.find(o => o.assignedDroneId === d.id);
                if (!obj){ d.state = 'returning'; return; }
                const stepKm = 0.45;
                const p = moveToward(d.lat, d.lng, obj.lat, obj.lng, stepKm);
                d.lat = p.lat; d.lng = p.lng;
                const rec = droneMarkers.get(d.id);
                if (rec) rec.marker.setLngLat([d.lng, d.lat]);
                
                const dist = distanceKm(d.lat, d.lng, obj.lat, obj.lng);
                if (dist <= INTERCEPT_THRESHOLD_KM){
                    logLine('hit', `INTERCEPT CONFIRMED → CT-${pad2(obj.id)} neutralized by INT-${pad2(d.id)} (range ${dist.toFixed(2)}km)`);
                    obj.status = 'intercepted';
                    d.state = 'returning';
                }
                if (rec && rec.popup.isOpen()) updateDronePopup(d, obj);
            });
            
            objectives = objectives.filter(o => {
                if (o.status === 'intercepted'){ removeTargetMarker(o.id); return false; }
                return true;
            });
            
            // returning drones
            fleet.filter(d => d.state === 'returning').forEach(d => {
                const stepKm = 0.45;
                const p = moveToward(d.lat, d.lng, BASE.lat, BASE.lng, stepKm);
                d.lat = p.lat; d.lng = p.lng;
                const rec = droneMarkers.get(d.id);
                if (rec) rec.marker.setLngLat([d.lng, d.lat]);
                const dist = distanceKm(d.lat, d.lng, BASE.lat, BASE.lng);
                if (dist <= RTB_THRESHOLD_KM){
                    logLine('sys', `RECOVERED → INT-${pad2(d.id)} docked at CONTAINER-01`);
                    d.state = 'standby';
                    d.missionId = null;
                    removeDroneMarker(d.id);
                } else if (rec && rec.popup.isOpen()) {
                    updateDronePopup(d, null);
                }
            });
            
            refreshUnitClasses();
            drawRadar();
            updateRadarReadout();
            renderMissions();
            updateStats();
        }
        
        // ==========================================================
        // MISSIONS PANEL
        // ==========================================================
        function renderMissions(){
            const active = fleet.filter(d => d.state === 'enroute' || d.state === 'armed' || d.state === 'returning');
            if (active.length === 0){
                el.missionsList.innerHTML = '<div class="missions-empty">No active intercepts</div>';
                return;
            }
            el.missionsList.innerHTML = active.map(d => {
                const obj = objectives.find(o => o.assignedDroneId === d.id);
                const label = d.state === 'returning' ? 'RETURNING TO BASE' :
                d.state === 'armed' ? 'ARMING' :
                obj ? `INTERCEPT CT-${pad2(obj.id)}` : 'ENROUTE';
                const dist = obj ? distanceKm(d.lat, d.lng, obj.lat, obj.lng) : 0;
                const pct = obj ? Math.max(4, 100 - Math.min(100, (dist / 2) * 100)) : (d.state === 'returning' ? 60 : 15);
                return `
      <div class="mission-row">
        <div class="mr-top">
          <span class="mr-title">INT-${pad2(d.id)}</span>
          ${(d.state === 'enroute' || d.state === 'armed') ? `<button class="mr-cancel" data-abort-id="${d.id}">ABORT</button>` : ''}
        </div>
        <div class="mr-line"><span>Status</span><span>${label}</span></div>
        ${obj ? `<div class="mr-line"><span>Contact coord</span><span>${obj.lat.toFixed(4)}, ${obj.lng.toFixed(4)}</span></div>
        <div class="mr-line"><span>Contact vel</span><span>${obj.speedKmh} km/h @ ${obj.heading.toFixed(0)}°</span></div>
        <div class="mr-line"><span>Range to target</span><span>${dist.toFixed(2)} km</span></div>` : ''}
        <div class="mr-bar"><div class="mr-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
            }).join('');
        }
        
        el.missionsList.addEventListener('click', e => {
            const btn = e.target.closest('[data-abort-id]');
            if (btn) abortMission(Number(btn.dataset.abortId));
        });
        document.addEventListener('click', e => {
            const btn = e.target.closest('.fc-abort');
            if (btn) abortMission(Number(btn.dataset.abortId));
        });
        
        // ==========================================================
        // STATS + LOG + CLOCK
        // ==========================================================
        function updateStats(){
            el.statOperational.textContent = fleet.filter(d => d.status === 'operational').length;
            el.statFlying.textContent = fleet.filter(d => d.state === 'enroute' || d.state === 'armed' || d.state === 'returning').length;
            el.statIssues.textContent = fleet.filter(d => d.status === 'fault').length;
            el.statContacts.textContent = objectives.length;
        }
        
        function logLine(tag, text){
            const row = document.createElement('div');
            row.className = `log-line tag-${tag}`;
            row.innerHTML = `<span class="t">[${nowStamp()}]</span> ${text}`;
            el.consoleLog.appendChild(row);
            el.consoleLog.scrollTop = el.consoleLog.scrollHeight;
            while (el.consoleLog.children.length > 200) el.consoleLog.removeChild(el.consoleLog.firstChild);
        }
        
        function tickClock(){ el.clock.textContent = nowStamp(); }
        
        // ==========================================================
        // GAME CONTROL
        // ==========================================================
        function scheduleAutoContact(){
            clearTimeout(autoContactTimer);
            if (!gameLive) return;
            autoContactTimer = setTimeout(() => {
                if (gameLive){
                    spawnObjective();
                    scheduleAutoContact();
                }
            }, rand(AUTO_CONTACT_MIN_MS, AUTO_CONTACT_MAX_MS));
        }
        
        function startGame(){
            gameLive = true;
            el.startGameBtn.classList.add('is-live');
            el.startGameBtn.innerHTML = '<span class="btn-dot"></span>SYSTEM LIVE — STOP';
            el.startSimBtn.disabled = false;
            el.radarSweep.classList.add('live');
            logLine('sys', 'SYSTEM ARMED — fleet online, radar sweep engaged');
            tickTimer = setInterval(tick, TICK_MS);
            setTimeout(() => { if (gameLive) spawnObjective(); }, 2200);
            scheduleAutoContact();
            updateRadarReadout();
        }
        
        function stopGame(){
            gameLive = false;
            el.startGameBtn.classList.remove('is-live');
            el.startGameBtn.innerHTML = '<span class="btn-dot"></span>START GAME';
            el.startSimBtn.disabled = true;
            el.radarSweep.classList.remove('live');
            clearInterval(tickTimer);
            clearTimeout(autoContactTimer);
            logLine('sys', 'SYSTEM STANDBY — simulation paused');
            updateRadarReadout();
        }
        
        el.startGameBtn.addEventListener('click', () => { gameLive ? stopGame() : startGame(); });
        el.startSimBtn.addEventListener('click', () => {
            if (!gameLive) return;
            spawnObjective();
            assignMissions();
        });
        
        // ==========================================================
        // INIT
        // ==========================================================
        function init(){
            buildFleet();
            renderFleetGrid();
            updateStats();
            initMap();
            drawRadar();
            updateRadarReadout();
            tickClock();
            setInterval(tickClock, 1000);
            logLine('sys', 'INTERCEPTOR BAY interface initialized — 100 units racked, awaiting START GAME');
        }
        
        init();