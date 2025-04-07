// Enhanced MAVLink Parser
class MAVLinkParser {
    constructor() {
        this.buffer = new Uint8Array(0);
        this.messages = {};
        this.callbacks = {};
        this.MAVLINK_MSG_ID_HEARTBEAT = 0;
        this.MAVLINK_MSG_ID_SYS_STATUS = 1;
        this.MAVLINK_MSG_ID_PARAM_VALUE = 22;
        this.MAVLINK_MSG_ID_GPS_RAW_INT = 24;
        this.MAVLINK_MSG_ID_ATTITUDE = 30;
        this.MAVLINK_MSG_ID_VFR_HUD = 74;
        this.MAVLINK_MSG_ID_RAW_IMU = 27;
        this.MAVLINK_MSG_ID_SCALED_IMU = 26;
        this.MAVLINK_MSG_ID_AHRS = 163;
        this.MAVLINK_MSG_ID_LOCAL_POSITION_NED = 32;
        this.MAVLINK_MSG_ID_GLOBAL_POSITION_INT = 33;
    }

    on(messageType, callback) {
        this.callbacks[messageType] = callback;
    }

    parseBuffer(data) {
        const newBuffer = new Uint8Array(this.buffer.length + data.length);
        newBuffer.set(this.buffer);
        newBuffer.set(data, this.buffer.length);
        this.buffer = newBuffer;

        while (this.buffer.length >= 8) {
            if (this.buffer[0] === 0xFE || this.buffer[0] === 0xFD) {
                const len = this.buffer[1];
                const totalLen = (this.buffer[0] === 0xFE ? 8 : 12) + len;
                if (this.buffer.length < totalLen) break;

                const msgId = this.buffer[5];
                let msg = this.parseMessage(msgId, this.buffer.slice(0, totalLen));
                if (msg) {
                    this.messages[msg.name] = msg;
                    if (this.callbacks[msg.name]) {
                        this.callbacks[msg.name](msg);
                    }
                }
                this.buffer = this.buffer.slice(totalLen);
            } else {
                this.buffer = this.buffer.slice(1);
            }
        }
    }

    parseMessage(msgId, data) {
        try {
            if (msgId === this.MAVLINK_MSG_ID_HEARTBEAT) {
                return {
                    name: 'HEARTBEAT',
                    type: data[6],
                    autopilot: data[7],
                    base_mode: data[8],
                    custom_mode: data[9],
                    system_status: data[10]
                };
            } else if (msgId === this.MAVLINK_MSG_ID_SYS_STATUS) {
                if (data.length < 23) return null;
                return {
                    name: 'SYS_STATUS',
                    battery_voltage: new DataView(data.buffer, data.byteOffset + 18, 2).getUint16(0, true) / 1000.0,
                    battery_current: new DataView(data.buffer, data.byteOffset + 20, 2).getInt16(0, true) / 100.0,
                    battery_remaining: data[22]
                };
            } else if (msgId === this.MAVLINK_MSG_ID_PARAM_VALUE) {
                if (data.length < 31) return null;
                const paramId = String.fromCharCode.apply(null, data.slice(6, 22)).trim();
                return {
                    name: 'PARAM_VALUE',
                    param_id: paramId,
                    param_value: new DataView(data.buffer, data.byteOffset + 22, 4).getFloat32(0, true),
                    param_type: data[26],
                    param_count: new DataView(data.buffer, data.byteOffset + 27, 2).getUint16(0, true),
                    param_index: new DataView(data.buffer, data.byteOffset + 29, 2).getUint16(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_GPS_RAW_INT) {
                if (data.length < 32) return null;
                return {
                    name: 'GPS_RAW_INT',
                    fix_type: data[14],
                    lat: new DataView(data.buffer, data.byteOffset + 15, 4).getInt32(0, true) / 1e7,
                    lon: new DataView(data.buffer, data.byteOffset + 19, 4).getInt32(0, true) / 1e7,
                    alt: new DataView(data.buffer, data.byteOffset + 23, 4).getInt32(0, true) / 1000,
                    satellites_visible: data[31]
                };
            } else if (msgId === this.MAVLINK_MSG_ID_ATTITUDE) {
                if (data.length < 28) return null;
                return {
                    name: 'ATTITUDE',
                    roll: new DataView(data.buffer, data.byteOffset + 6, 4).getFloat32(0, true),
                    pitch: new DataView(data.buffer, data.byteOffset + 10, 4).getFloat32(0, true),
                    yaw: new DataView(data.buffer, data.byteOffset + 14, 4).getFloat32(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_VFR_HUD) {
                if (data.length < 26) return null;
                return {
                    name: 'VFR_HUD',
                    airspeed: new DataView(data.buffer, data.byteOffset + 6, 4).getFloat32(0, true),
                    groundspeed: new DataView(data.buffer, data.byteOffset + 10, 4).getFloat32(0, true),
                    heading: new DataView(data.buffer, data.byteOffset + 14, 2).getInt16(0, true),
                    throttle: new DataView(data.buffer, data.byteOffset + 16, 2).getUint16(0, true),
                    alt: new DataView(data.buffer, data.byteOffset + 18, 4).getFloat32(0, true),
                    climb: new DataView(data.buffer, data.byteOffset + 22, 4).getFloat32(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_RAW_IMU) {
                if (data.length < 28) return null;
                return {
                    name: 'RAW_IMU',
                    xacc: new DataView(data.buffer, data.byteOffset + 6, 2).getInt16(0, true),
                    yacc: new DataView(data.buffer, data.byteOffset + 8, 2).getInt16(0, true),
                    zacc: new DataView(data.buffer, data.byteOffset + 10, 2).getInt16(0, true),
                    xgyro: new DataView(data.buffer, data.byteOffset + 12, 2).getInt16(0, true),
                    ygyro: new DataView(data.buffer, data.byteOffset + 14, 2).getInt16(0, true),
                    zgyro: new DataView(data.buffer, data.byteOffset + 16, 2).getInt16(0, true),
                    xmag: new DataView(data.buffer, data.byteOffset + 18, 2).getInt16(0, true),
                    ymag: new DataView(data.buffer, data.byteOffset + 20, 2).getInt16(0, true),
                    zmag: new DataView(data.buffer, data.byteOffset + 22, 2).getInt16(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_SCALED_IMU) {
                if (data.length < 26) return null;
                return {
                    name: 'SCALED_IMU',
                    xacc: new DataView(data.buffer, data.byteOffset + 6, 2).getInt16(0, true),
                    yacc: new DataView(data.buffer, data.byteOffset + 8, 2).getInt16(0, true),
                    zacc: new DataView(data.buffer, data.byteOffset + 10, 2).getInt16(0, true),
                    xgyro: new DataView(data.buffer, data.byteOffset + 12, 2).getInt16(0, true),
                    ygyro: new DataView(data.buffer, data.byteOffset + 14, 2).getInt16(0, true),
                    zgyro: new DataView(data.buffer, data.byteOffset + 16, 2).getInt16(0, true),
                    xmag: new DataView(data.buffer, data.byteOffset + 18, 2).getInt16(0, true),
                    ymag: new DataView(data.buffer, data.byteOffset + 20, 2).getInt16(0, true),
                    zmag: new DataView(data.buffer, data.byteOffset + 22, 2).getInt16(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_AHRS) {
                if (data.length < 34) return null;
                return {
                    name: 'AHRS',
                    omegaIx: new DataView(data.buffer, data.byteOffset + 6, 4).getFloat32(0, true),
                    omegaIy: new DataView(data.buffer, data.byteOffset + 10, 4).getFloat32(0, true),
                    omegaIz: new DataView(data.buffer, data.byteOffset + 14, 4).getFloat32(0, true),
                    accel_weight: new DataView(data.buffer, data.byteOffset + 18, 4).getFloat32(0, true),
                    renorm_val: new DataView(data.buffer, data.byteOffset + 22, 4).getFloat32(0, true),
                    error_rp: new DataView(data.buffer, data.byteOffset + 26, 4).getFloat32(0, true),
                    error_yaw: new DataView(data.buffer, data.byteOffset + 30, 4).getFloat32(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_LOCAL_POSITION_NED) {
                if (data.length < 34) return null;
                return {
                    name: 'LOCAL_POSITION_NED',
                    x: new DataView(data.buffer, data.byteOffset + 6, 4).getFloat32(0, true),
                    y: new DataView(data.buffer, data.byteOffset + 10, 4).getFloat32(0, true),
                    z: new DataView(data.buffer, data.byteOffset + 14, 4).getFloat32(0, true),
                    vx: new DataView(data.buffer, data.byteOffset + 18, 4).getFloat32(0, true),
                    vy: new DataView(data.buffer, data.byteOffset + 22, 4).getFloat32(0, true),
                    vz: new DataView(data.buffer, data.byteOffset + 26, 4).getFloat32(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_GLOBAL_POSITION_INT) {
                if (data.length < 34) return null;
                return {
                    name: 'GLOBAL_POSITION_INT',
                    lat: new DataView(data.buffer, data.byteOffset + 6, 4).getInt32(0, true) / 1e7,
                    lon: new DataView(data.buffer, data.byteOffset + 10, 4).getInt32(0, true) / 1e7,
                    alt: new DataView(data.buffer, data.byteOffset + 14, 4).getInt32(0, true) / 1000,
                    relative_alt: new DataView(data.buffer, data.byteOffset + 18, 4).getInt32(0, true) / 1000,
                    vx: new DataView(data.buffer, data.byteOffset + 22, 2).getInt16(0, true) / 100,
                    vy: new DataView(data.buffer, data.byteOffset + 24, 2).getInt16(0, true) / 100,
                    vz: new DataView(data.buffer, data.byteOffset + 26, 2).getInt16(0, true) / 100,
                    hdg: new DataView(data.buffer, data.byteOffset + 28, 2).getUint16(0, true) / 100
                };
            }
        } catch (error) {
            console.error(`Error parsing message ID ${msgId}: ${error.message}`);
            return null;
        }
        return null;
    }

    pack(msgId, fields) {
        if (msgId === 21) { // PARAM_REQUEST_LIST
            const buffer = new Uint8Array(8);
            buffer[0] = 0xFE;
            buffer[1] = 2;
            buffer[2] = 0;
            buffer[3] = 1;
            buffer[4] = 1;
            buffer[5] = 21;
            buffer[6] = fields.target_system;
            buffer[7] = fields.target_component;
            return buffer;
        } else if (msgId === 20) { // REQUEST_DATA_STREAM
            const buffer = new Uint8Array(12);
            buffer[0] = 0xFE;
            buffer[1] = 6;
            buffer[2] = 0;
            buffer[3] = 1;
            buffer[4] = 1;
            buffer[5] = 20;
            buffer[6] = fields.target_system;
            buffer[7] = fields.target_component;
            buffer[8] = fields.req_stream_id;
            buffer[9] = fields.req_message_rate & 0xFF;
            buffer[10] = (fields.req_message_rate >> 8) & 0xFF;
            buffer[11] = fields.start_stop;
            return buffer;
        }
        return null;
    }
}

let port, reader;
const statusDiv = document.getElementById('status');
const dataRateDiv = document.getElementById('data-rate');
const mavlinkParser = new MAVLinkParser();
let byteCount = 0;
let lastUpdate = Date.now();
const telemetryData = {};
let map, marker;

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sadeqal/cl04dpzyq000v15o3nlcnpn9d',
    center: [-3.70405, 40.41662], // Madid, Sol
    zoom: 16,
    pitch: 75, // 3D tilt
    bearing: 0,
    interactive: true
});

// Add terrain
map.on('load', () => {
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.terrain-rgb'
    });
    map.addLayer({
        'id': 'terrain',
        'type': 'hillshade',
        'source': 'mapbox-dem'
    });
});

// Populate available ports
async function populatePorts() {
    const ports = await navigator.serial.getPorts();
    const portSelect = document.getElementById('portSelect');
    portSelect.innerHTML = '<option value="">Select Port</option>';
    ports.forEach((p, i) => {
        const option = document.createElement('option');
        option.value = i;
        option.text = `Port ${i + 1}`;
        portSelect.appendChild(option);
    });
}

// Connect to serial port
async function connectSerial() {
    const portSelect = document.getElementById('portSelect');
    const baudSelect = document.getElementById('baudSelect');
    const baudRate = parseInt(baudSelect.value) || 57600;

    try {
        if (portSelect.value === '') {
            port = await navigator.serial.requestPort({ baudRate });
        } else {
            const ports = await navigator.serial.getPorts();
            port = ports[portSelect.value];
        }
        await port.open({ baudRate });
        reader = port.readable.getReader();
        statusDiv.textContent = 'Connected to Pixhawk!';
        statusDiv.style.color = '#0f0';
        readData();
        requestParams();
        requestDataStreams();
    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
        statusDiv.style.color = '#f00';
    }
}

// Disconnect from serial port
async function disconnectSerial() {
    if (reader) {
        await reader.cancel();
        reader.releaseLock();
    }
    if (port) {
        await port.close();
        port = null;
        statusDiv.textContent = 'Disconnected';
        statusDiv.style.color = '#0ff';
        byteCount = 0;
        dataRateDiv.textContent = 'Data Rate: 0 B/s';
        if (marker) marker.remove();
    }
}

// Read and parse MAVLink data
async function readData() {
    while (true) {
        try {
            const { value, done } = await reader.read();
            if (done) {
                statusDiv.textContent = 'Stream closed';
                reader.releaseLock();
                break;
            }
            byteCount += value.length;
            updateDataRate();
            mavlinkParser.parseBuffer(value);
        } catch (error) {
            statusDiv.textContent = `Read error: ${error.message}`;
            statusDiv.style.color = '#f00';
            break;
        }
    }
}

// Update data rate display
function updateDataRate() {
    const now = Date.now();
    const deltaTime = (now - lastUpdate) / 1000;
    if (deltaTime >= 1) {
        const rate = byteCount / deltaTime;
        dataRateDiv.textContent = `Data Rate: ${rate.toFixed(2)} B/s`;
        byteCount = 0;
        lastUpdate = now;
    }
}

// Request all parameters from Pixhawk
function requestParams() {
    const msg = mavlinkParser.pack(21, { target_system: 1, target_component: 1 });
    if (port && port.writable) {
        const writer = port.writable.getWriter();
        writer.write(msg);
        writer.releaseLock();
    }
}

// Request data streams
function requestDataStreams() {
    const streams = [
        { req_stream_id: 0, req_message_rate: 10, start_stop: 1 }, //വ

        { req_stream_id: 1, req_message_rate: 10, start_stop: 1 }, // RAW_SENSORS
        { req_stream_id: 2, req_message_rate: 10, start_stop: 1 }, // EXTENDED_STATUS (SYS_STATUS)
        { req_stream_id: 3, req_message_rate: 10, start_stop: 1 }, // RC_CHANNELS
        { req_stream_id: 4, req_message_rate: 10, start_stop: 1 }, // RAW_CONTROLLER
        { req_stream_id: 6, req_message_rate: 10, start_stop: 1 }, // ATTITUDE
        { req_stream_id: 10, req_message_rate: 10, start_stop: 1 }, // RC_CHANNELS
        { req_stream_id: 12, req_message_rate: 10, start_stop: 1 }  // POSITION (GPS)
    ];
    streams.forEach(stream => {
        const msg = mavlinkParser.pack(20, {
            target_system: 1,
            target_component: 1,
            req_stream_id: stream.req_stream_id,
            req_message_rate: stream.req_message_rate,
            start_stop: stream.start_stop
        });
        if (port && port.writable) {
            const writer = port.writable.getWriter();
            writer.write(msg);
            writer.releaseLock();
        }
    });
}

// Handle incoming MAVLink messages
mavlinkParser.on('HEARTBEAT', (msg) => handleMessage('HEARTBEAT', msg));
mavlinkParser.on('SYS_STATUS', (msg) => handleMessage('SYS_STATUS', msg));
mavlinkParser.on('PARAM_VALUE', (msg) => handleMessage('PARAM_VALUE', msg));
mavlinkParser.on('GPS_RAW_INT', (msg) => handleMessage('GPS_RAW_INT', msg));
mavlinkParser.on('ATTITUDE', (msg) => handleMessage('ATTITUDE', msg));
mavlinkParser.on('VFR_HUD', (msg) => handleMessage('VFR_HUD', msg));
mavlinkParser.on('RAW_IMU', (msg) => handleMessage('RAW_IMU', msg));
mavlinkParser.on('SCALED_IMU', (msg) => handleMessage('SCALED_IMU', msg));
mavlinkParser.on('AHRS', (msg) => handleMessage('AHRS', msg));
mavlinkParser.on('LOCAL_POSITION_NED', (msg) => handleMessage('LOCAL_POSITION_NED', msg));
mavlinkParser.on('GLOBAL_POSITION_INT', (msg) => handleMessage('GLOBAL_POSITION_INT', msg));

function handleMessage(type, msg) {
    Object.assign(telemetryData[type] = telemetryData[type] || {}, msg);
    updateInspector();
    if (type === 'GPS_RAW_INT' || type === 'GLOBAL_POSITION_INT') {
        updateMapMarker(msg);
    }
}

// Update map marker
function updateMapMarker(msg) {
    const lat = msg.lat;
    const lon = msg.lon;
    const alt = msg.alt || msg.relative_alt || 0;

    if (lat && lon) {
        if (marker) marker.remove();
        marker = new mapboxgl.Marker({
            element: createMarkerElement()
        })
            .setLngLat([lon, lat])
            .addTo(map);
        map.flyTo({ center: [lon, lat], zoom: 16, speed: 0.8 });
    }
}

// Create FontAwesome marker element
function createMarkerElement() {
    const el = document.createElement('div');
    el.innerHTML = '<i class="fas fa-plane" style="font-size: 24px; color: #ff00ff;"></i>';
    return el;
}

// Update inspector content
function updateInspector() {
    const inspectorContent = document.getElementById('inspector-content');
    inspectorContent.innerHTML = '';
    for (const [type, data] of Object.entries(telemetryData)) {
        const table = document.createElement('table');
        table.className = 'telemetry-table';
        table.innerHTML = `<thead><tr><th>Field</th><th>Value</th></tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');
        for (const [field, value] of Object.entries(data)) {
            if (field === 'name') continue;
            const row = document.createElement('tr');
            row.innerHTML = `<td>${field}</td><td>${value}</td>`;
            tbody.appendChild(row);
        }
        const section = document.createElement('div');
        section.className = 'telemetry-container';
        section.innerHTML = `<h3>${type}</h3>`;
        section.appendChild(table);
        inspectorContent.appendChild(section);
    }
}

// Toggle inspector
document.getElementById('analyze-btn').addEventListener('click', () => {
    const overlay = document.getElementById('inspector-overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
});
document.getElementById('close-inspector').addEventListener('click', () => {
    document.getElementById('inspector-overlay').style.display = 'none';
});

// Initialize port selection
populatePorts();
navigator.serial.addEventListener('connect', populatePorts);
navigator.serial.addEventListener('disconnect', populatePorts);