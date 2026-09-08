/* ==========================================================
INTERCEPTOR BAY — simulation engine
========================================================== */

// -------- CONFIG --------------------------------------------------
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
const BASE = { lat: 40.2085, lng: -3.7792 };   // CONTAINER-01 location
const MAX_RANGE_KM = 8;
const INTERCEPT_THRESHOLD_KM = 0.12;
const RTB_THRESHOLD_KM = 0.05;
const TERMINAL_RANGE_KM = 2.4;   // seeker lock range — holds for pilot confirmation (opens the feed earlier in the run)
const ATTACK_STEP_KM = 0.9;      // per-tick closure once weapons release is confirmed
const CRUISE_STEP_KM = 0.65;     // per-tick closure while inbound, pre-lock
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

// seeker / nose-camera feed state
let seekerActive = null;   // { droneId, objId, phase, lockT, engageStartRange, closureLast, shake, designateT, designateX, designateY, pingAt }
let seekerQueue = [];       // [{droneId, objId}] pending locks while feed is busy
let seekerRAF = null;
let seekerFrameT = 0;
let sctx = null;

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

    seekerOverlay: document.getElementById('seekerOverlay'),
    seekerCanvas: document.getElementById('seekerCanvas'),
    seekerViewport: document.getElementById('seekerViewport'),
    seekerFlash: document.getElementById('seekerFlash'),
    seekerDroneId: document.getElementById('seekerDroneId'),
    seekerMode: document.getElementById('seekerMode'),
    seekerStatusLine: document.getElementById('seekerStatusLine'),
    seekerControls: document.getElementById('seekerControls'),
    seekerConfirmText: document.getElementById('seekerConfirmText'),
    seekerEngageBtn: document.getElementById('seekerEngageBtn'),
    seekerAbortBtn: document.getElementById('seekerAbortBtn'),
    hudReticle: document.getElementById('hudReticle'),
    reticleBox: document.getElementById('reticleBox'),
    hudCompass: document.getElementById('hudCompass'),
    hudAlt: document.getElementById('hudAlt'),
    hudSpd: document.getElementById('hudSpd'),
    hudRng: document.getElementById('hudRng'),
    hudClsr: document.getElementById('hudClsr'),
    hudTgt: document.getElementById('hudTgt'),
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

    function bearingTo(lat1, lng1, lat2, lng2){
        const la1 = toRad(lat1), la2 = toRad(lat2);
        const dLng = toRad(lng2 - lng1);
        const y = Math.sin(dLng) * Math.cos(la2);
        const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
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
            cell.classList.remove('op', 'fault', 'flying', 'returning', 'engaging');
            if (d.state === 'terminal') cell.classList.add('engaging');
            else if (d.state === 'enroute' || d.state === 'armed') cell.classList.add('flying');
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
        // SEEKER / NOSE CAMERA FEED
        // simulated EO/IR video (procedural canvas) — no real camera source,
        // so the feed is generated: scrolling horizon/terrain, grain, and a
        // tracked target box that tightens into a lock, then a confirmed
        // terminal attack run with zoom + shake before impact.
        // ==========================================================
        function initSeekerCanvas(){
            sctx = el.seekerCanvas.getContext('2d');
        }

        function queueSeekerLock(drone, obj){
            seekerQueue.push({ droneId: drone.id, objId: obj.id });
            logLine('arm', `SEEKER FEED BUSY — INT-${pad2(drone.id)} lock queued`);
        }

        function processSeekerQueue(){
            if (seekerActive || seekerQueue.length === 0) return;
            const next = seekerQueue.shift();
            const drone = fleet.find(d => d.id === next.droneId);
            const obj = objectives.find(o => o.id === next.objId);
            if (!drone || !obj || drone.state !== 'terminal'){ processSeekerQueue(); return; }
            openSeekerFeed(drone, obj);
        }

        function openSeekerFeed(drone, obj){
            seekerActive = {
                droneId: drone.id,
                objId: obj.id,
                phase: 'locking',      // locking -> tracking -> awaiting -> engaged -> impact
                lockT: 0,
                engageStartRange: null,
                closureLast: null,
                zoom: 1,
                shake: 0,
                designateT: 0,
                designateX: 0,
                designateY: 0,
                pingAt: null,
            };
            seekerFrameT = 0;
            el.seekerDroneId.textContent = `INT-${pad2(drone.id)}`;
            el.seekerOverlay.classList.add('show');
            el.seekerViewport.classList.add('designatable');
            el.seekerControls.style.display = '';
            el.seekerEngageBtn.disabled = true;
            el.seekerAbortBtn.disabled = false;
            el.seekerMode.textContent = 'ACQUIRING';
            el.seekerMode.className = 'seeker-mode';
            el.seekerStatusLine.textContent = 'ACQUIRING TARGET LOCK...';
            el.seekerStatusLine.classList.remove('locked');
            el.seekerConfirmText.textContent = 'CLICK FEED TO ASSIST TRACKING — STAND BY';
            el.reticleBox.classList.remove('locked', 'engaged');
            el.hudReticle.style.left = '50%';
            el.hudReticle.style.top = '50%';
            el.seekerCanvas.style.transform = 'scale(1)';
            logLine('arm', `SEEKER FEED ONLINE → INT-${pad2(drone.id)} nose camera streaming, tracking CT-${pad2(obj.id)}`);
            if (!seekerRAF) seekerLoop();
        }

        function closeSeekerFeed(){
            el.seekerOverlay.classList.remove('show');
            el.seekerViewport.classList.remove('designatable');
            el.seekerFlash.classList.remove('hit');
            el.seekerCanvas.style.transform = 'scale(1)';
            seekerActive = null;
            processSeekerQueue();
        }

        function confirmEngage(){
            if (!seekerActive || seekerActive.phase !== 'awaiting') return;
            const drone = fleet.find(d => d.id === seekerActive.droneId);
            const obj = objectives.find(o => o.id === seekerActive.objId);
            if (!drone || !obj) return;
            drone.confirmed = true;
            drone.attackRun = true;
            drone.state = 'enroute';
            seekerActive.phase = 'engaged';
            seekerActive.engageStartRange = distanceKm(drone.lat, drone.lng, obj.lat, obj.lng);
            el.seekerMode.textContent = 'ENGAGED';
            el.seekerMode.className = 'seeker-mode engaged';
            el.reticleBox.classList.add('engaged');
            el.seekerStatusLine.textContent = 'WEAPONS RELEASED — TERMINAL ATTACK RUN';
            el.seekerConfirmText.textContent = 'TERMINAL ATTACK RUN IN PROGRESS';
            el.seekerEngageBtn.disabled = true;
            el.seekerViewport.classList.remove('designatable');
            logLine('hit', `WEAPONS RELEASE AUTHORIZED → INT-${pad2(drone.id)} executing terminal attack on CT-${pad2(obj.id)}`);
            refreshUnitClasses();
        }

        function triggerImpact(){
            if (!seekerActive) return;
            seekerActive.phase = 'impact';
            el.seekerFlash.classList.add('hit');
            el.seekerMode.textContent = 'IMPACT';
            el.seekerStatusLine.textContent = 'TARGET NEUTRALIZED';
            el.seekerControls.style.display = 'none';
            setTimeout(() => { closeSeekerFeed(); }, 1500);
        }

        function updateSeekerPhase(){
            const s = seekerActive;
            if (s.phase === 'locking'){
                s.lockT++;
                if (s.lockT >= 35){
                    s.phase = 'tracking';
                    el.seekerMode.textContent = 'TRACKING';
                    el.seekerMode.className = 'seeker-mode tracking';
                    el.seekerStatusLine.textContent = 'TRACKING CONTACT — REFINING LOCK...';
                }
            } else if (s.phase === 'tracking'){
                s.lockT++;
                if (s.lockT >= 85){
                    s.phase = 'awaiting';
                    el.seekerMode.textContent = 'LOCKED';
                    el.seekerMode.className = 'seeker-mode locked';
                    el.seekerStatusLine.textContent = 'TARGET LOCKED — CONFIRM WEAPONS RELEASE';
                    el.seekerStatusLine.classList.add('locked');
                    el.seekerConfirmText.textContent = 'WEAPONS HOLD — PILOT CONFIRMATION REQUIRED TO ENGAGE';
                    el.reticleBox.classList.add('locked');
                    el.seekerEngageBtn.disabled = false;
                    el.seekerViewport.classList.remove('designatable');
                    const drone = fleet.find(d => d.id === s.droneId);
                    const obj = objectives.find(o => o.id === s.objId);
                    if (drone && obj) logLine('arm', `TARGET LOCK ESTABLISHED → CT-${pad2(obj.id)} — awaiting pilot confirmation`);
                }
            }
        }

        function drawSeekerNoise(w, h){
            sctx.fillStyle = 'rgba(255,255,255,0.035)';
            for (let i = 0; i < 70; i++){
                sctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
            }
            const vg = sctx.createRadialGradient(w/2, h/2, h*0.22, w/2, h/2, h*0.75);
            vg.addColorStop(0, 'rgba(0,0,0,0)');
            vg.addColorStop(1, 'rgba(0,0,0,0.55)');
            sctx.fillStyle = vg;
            sctx.fillRect(0, 0, w, h);
        }

        function drawSeekerMountains(w, h, cy, t){
            // two semi-transparent parallax ridgelines along the horizon, so the feed reads as a real aerial view
            const step = 14;
            const layers = [
                { speed: 0.15, base: 20, amp: [14, 8, 4], freq: [0.010, 0.023, 0.051], phase: [0, 1.7, 4.1], color: 'rgba(50,80,76,0.32)' },
                { speed: 0.34, base: 8,  amp: [10, 5],     freq: [0.016, 0.037],        phase: [2.2, 0.6],      color: 'rgba(18,38,36,0.45)' },
            ];
            layers.forEach(L => {
                const parallax = (t * L.speed) % w;
                sctx.beginPath();
                sctx.moveTo(-20, cy);
                for (let x = -20; x <= w + 20; x += step){
                    const sx = x + parallax;
                    let ridge = 0;
                    for (let i = 0; i < L.amp.length; i++) ridge += Math.sin(sx * L.freq[i] + L.phase[i]) * L.amp[i];
                    sctx.lineTo(x, cy - L.base - ridge);
                }
                sctx.lineTo(w + 20, cy);
                sctx.closePath();
                sctx.fillStyle = L.color;
                sctx.fill();
            });
        }

        function drawSeekerFrame(){
            const s = seekerActive;
            if (s.phase === 'impact') return; // freeze last frame under the flash/impact text

            const drone = fleet.find(d => d.id === s.droneId);
            const obj = objectives.find(o => o.id === s.objId);
            if (!drone || !obj){ closeSeekerFeed(); return; }

            const w = el.seekerCanvas.width, h = el.seekerCanvas.height;
            const cx = w / 2, cy = h / 2;
            const range = distanceKm(drone.lat, drone.lng, obj.lat, obj.lng);
            const t = seekerFrameT++;

            // zoom/shake ramps up during the confirmed terminal attack run
            let zoomFrac = 0;
            if (s.phase === 'engaged' && s.engageStartRange){
                const span = Math.max(0.01, s.engageStartRange - INTERCEPT_THRESHOLD_KM);
                zoomFrac = Math.max(0, Math.min(1, (s.engageStartRange - range) / span));
            }
            const zoom = 1 + zoomFrac * 0.9;
            s.shake = zoomFrac * 7;
            el.seekerCanvas.style.transform = `scale(${zoom.toFixed(3)})`;

            const roll = Math.sin(t / 140) * 2 + (s.shake ? rand(-s.shake, s.shake) : 0);
            sctx.save();
            sctx.clearRect(0, 0, w, h);
            sctx.translate(cx, cy);
            sctx.rotate(toRad(roll));
            sctx.translate(-cx, -cy);

            const grad = sctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#1a2e33');
            grad.addColorStop(0.48, '#243b3f');
            grad.addColorStop(0.5, '#0d1a12');
            grad.addColorStop(1, '#050b07');
            sctx.fillStyle = grad;
            sctx.fillRect(-60, -60, w + 120, h + 120);

            drawSeekerMountains(w, h, cy, t);

            // scrolling ground grid — speed tied to interceptor airspeed
            const spd = drone.speedKmh || 260;
            const scroll = (t * (spd / 260) * 2) % 40;
            sctx.strokeStyle = 'rgba(70,224,196,0.10)';
            sctx.lineWidth = 1;
            for (let gy = cy + scroll; gy < h + 40; gy += 40){
                sctx.beginPath(); sctx.moveTo(0, gy); sctx.lineTo(w, gy); sctx.stroke();
            }
            for (let gx = -w; gx < w * 2; gx += 60){
                sctx.beginPath();
                sctx.moveTo(cx + (gx - cx) * 0.2, cy);
                sctx.lineTo(gx, h);
                sctx.stroke();
            }

            // drifting haze puffs
            for (let i = 0; i < 5; i++){
                const px = ((t * 0.3 + i * 160) % (w + 200)) - 100;
                const py = 60 + i * 22 + Math.sin(t / 200 + i) * 6;
                sctx.fillStyle = 'rgba(255,255,255,0.03)';
                sctx.beginPath(); sctx.ellipse(px, py, 70, 14, 0, 0, Math.PI * 2); sctx.fill();
            }
            sctx.restore();

            // target: jitters toward screen center as lock quality improves
            const lockProgress = Math.min(1, s.lockT / 90);
            const jitter = (1 - lockProgress) * 36;
            let tx = cx + Math.sin(t / 17) * jitter * 0.6 + Math.sin(t / 9) * jitter * 0.3;
            let ty = cy + Math.cos(t / 15) * jitter * 0.5;

            // manual designate: operator click pulls the seeker box onto the target directly
            if (s.designateT > 0){
                const blend = s.designateT / 45;
                tx = tx * (1 - blend) + s.designateX * blend;
                ty = ty * (1 - blend) + s.designateY * blend;
                s.designateT--;
            }

            sctx.save();
            sctx.translate(tx, ty);
            sctx.strokeStyle = 'rgba(255,255,255,0.6)';
            sctx.fillStyle = 'rgba(8,16,15,0.9)';
            sctx.beginPath(); sctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2); sctx.fill(); sctx.stroke();
            sctx.restore();

            if (s.pingAt){
                s.pingAt.t++;
                const p = s.pingAt.t / 20;
                if (p <= 1){
                    sctx.strokeStyle = `rgba(70,224,196,${1 - p})`;
                    sctx.lineWidth = 2;
                    sctx.beginPath();
                    sctx.arc(s.pingAt.x, s.pingAt.y, 10 + p * 30, 0, Math.PI * 2);
                    sctx.stroke();
                } else {
                    s.pingAt = null;
                }
            }

            drawSeekerNoise(w, h);

            // reticle box: tightens while acquiring lock, holds while awaiting confirm — always centered on the target
            const boxSize = s.phase === 'engaged' || s.phase === 'impact'
                ? 90
                : Math.max(90, 240 - lockProgress * 150);
            el.reticleBox.style.width = boxSize + 'px';
            el.reticleBox.style.height = boxSize + 'px';
            el.hudReticle.style.left = (tx / w * 100) + '%';
            el.hudReticle.style.top = (ty / h * 100) + '%';

            updateSeekerPhase();

            if (t % 12 === 0){
                const closure = s.closureLast != null ? (s.closureLast - range) : 0;
                s.closureLast = range;
                el.hudAlt.textContent = (drone.state === 'returning' ? randInt(35, 60) : randInt(60, 120)) + 'm';
                el.hudSpd.textContent = (drone.speedKmh || 260) + 'km/h';
                el.hudRng.textContent = range.toFixed(2) + 'km';
                el.hudClsr.textContent = (closure >= 0 ? '-' : '+') + Math.abs(Math.round(closure * 1000)) + 'm/s';
                el.hudTgt.textContent = 'CT-' + pad2(obj.id);
                el.hudCompass.textContent = 'HDG ' + Math.round(bearingTo(drone.lat, drone.lng, obj.lat, obj.lng)) + '°';
            }
        }

        function seekerLoop(){
            if (!seekerActive){ seekerRAF = null; return; }
            drawSeekerFrame();
            seekerRAF = requestAnimationFrame(seekerLoop);
        }

        el.seekerViewport.addEventListener('click', (e) => {
            if (!seekerActive || (seekerActive.phase !== 'locking' && seekerActive.phase !== 'tracking')) return;
            const rect = el.seekerCanvas.getBoundingClientRect();
            const w = el.seekerCanvas.width, h = el.seekerCanvas.height;
            const x = (e.clientX - rect.left) / rect.width * w;
            const y = (e.clientY - rect.top) / rect.height * h;
            seekerActive.designateT = 45;
            seekerActive.designateX = x;
            seekerActive.designateY = y;
            seekerActive.lockT = Math.min(seekerActive.lockT + 25, 84);
            seekerActive.pingAt = { x, y, t: 0 };
            el.seekerStatusLine.textContent = 'MANUAL DESIGNATE — RE-SLAVING SEEKER...';
        });

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
                drone.confirmed = false;
                drone.attackRun = false;
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
            if (!drone || !['enroute', 'armed', 'terminal'].includes(drone.state)) return;
            const obj = objectives.find(o => o.assignedDroneId === droneId);
            drone.state = 'returning';
            drone.confirmed = false;
            drone.attackRun = false;
            seekerQueue = seekerQueue.filter(q => q.droneId !== droneId);
            if (seekerActive && seekerActive.droneId === droneId) closeSeekerFeed();
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

                const preDist = distanceKm(d.lat, d.lng, obj.lat, obj.lng);

                // seeker lock range reached — hold position, stream nose camera, await pilot confirmation
                if (!d.confirmed && preDist <= TERMINAL_RANGE_KM){
                    d.state = 'terminal';
                    logLine('arm', `SEEKER LOCK RANGE → INT-${pad2(d.id)} holding, nose camera streaming CT-${pad2(obj.id)}`);
                    if (seekerActive) queueSeekerLock(d, obj); else openSeekerFeed(d, obj);
                    refreshUnitClasses();
                    return;
                }

                const stepKm = d.attackRun ? ATTACK_STEP_KM : CRUISE_STEP_KM;
                const p = moveToward(d.lat, d.lng, obj.lat, obj.lng, stepKm);
                d.lat = p.lat; d.lng = p.lng;
                const rec = droneMarkers.get(d.id);
                if (rec) rec.marker.setLngLat([d.lng, d.lat]);
                
                const dist = distanceKm(d.lat, d.lng, obj.lat, obj.lng);
                if (dist <= INTERCEPT_THRESHOLD_KM){
                    logLine('hit', `INTERCEPT CONFIRMED → CT-${pad2(obj.id)} neutralized by INT-${pad2(d.id)} (range ${dist.toFixed(2)}km)`);
                    obj.status = 'intercepted';
                    d.state = 'returning';
                    d.confirmed = false;
                    d.attackRun = false;
                    if (seekerActive && seekerActive.droneId === d.id) triggerImpact();
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
            const active = fleet.filter(d => d.state === 'enroute' || d.state === 'armed' || d.state === 'returning' || d.state === 'terminal');
            if (active.length === 0){
                el.missionsList.innerHTML = '<div class="missions-empty">No active intercepts</div>';
                return;
            }
            el.missionsList.innerHTML = active.map(d => {
                const obj = objectives.find(o => o.assignedDroneId === d.id);
                const label = d.state === 'returning' ? 'RETURNING TO BASE' :
                d.state === 'terminal' ? 'SEEKER LOCK — AWAITING PILOT CONFIRM' :
                d.state === 'armed' ? 'ARMING' :
                obj ? `INTERCEPT CT-${pad2(obj.id)}` : 'ENROUTE';
                const dist = obj ? distanceKm(d.lat, d.lng, obj.lat, obj.lng) : 0;
                const pct = obj ? Math.max(4, 100 - Math.min(100, (dist / 2) * 100)) : (d.state === 'returning' ? 60 : 15);
                return `
      <div class="mission-row">
        <div class="mr-top">
          <span class="mr-title">INT-${pad2(d.id)}</span>
          ${(d.state === 'enroute' || d.state === 'armed' || d.state === 'terminal') ? `<button class="mr-cancel" data-abort-id="${d.id}">ABORT</button>` : ''}
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
            el.statFlying.textContent = fleet.filter(d => d.state === 'enroute' || d.state === 'armed' || d.state === 'returning' || d.state === 'terminal').length;
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
            seekerQueue = [];
            if (seekerActive) closeSeekerFeed();
            logLine('sys', 'SYSTEM STANDBY — simulation paused');
            updateRadarReadout();
        }
        
        el.startGameBtn.addEventListener('click', () => { gameLive ? stopGame() : startGame(); });
        el.startSimBtn.addEventListener('click', () => {
            if (!gameLive) return;
            spawnObjective();
            assignMissions();
        });

        el.seekerEngageBtn.addEventListener('click', confirmEngage);
        el.seekerAbortBtn.addEventListener('click', () => {
            if (!seekerActive) return;
            abortMission(seekerActive.droneId);
        });
        
        // ==========================================================
        // INIT
        // ==========================================================
        function init(){
            buildFleet();
            renderFleetGrid();
            updateStats();
            initMap();
            initSeekerCanvas();
            drawRadar();
            updateRadarReadout();
            tickClock();
            setInterval(tickClock, 1000);
            logLine('sys', 'INTERCEPTOR BAY interface initialized — 100 units racked, awaiting START GAME');
        }
        
        init();