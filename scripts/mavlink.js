class MAVLinkParser {
    constructor() {
        this.buffer = new Uint8Array(0);
        this.messages = {};
        this.callbacks = {};
        this.MAVLINK_MSG_ID_HEARTBEAT = 0;
        this.MAVLINK_MSG_ID_SYS_STATUS = 1;
        this.MAVLINK_MSG_ID_RC_CHANNELS = 65;
        this.MAVLINK_MSG_ID_LOCAL_POSITION_NED = 32;
        this.MAVLINK_MSG_ID_GLOBAL_POSITION_INT = 33;
        this.MAVLINK_MSG_ID_VFR_HUD = 74;
        this.MAVLINK_MSG_ID_ATTITUDE = 30;
        this.MAVLINK_MSG_ID_COMMAND_LONG = 76;
        this.MAVLINK_MSG_ID_REQUEST_DATA_STREAM = 66;
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
            if (this.buffer[0] === 0xFD) {
                const len = this.buffer[1];
                const totalLen = 12 + len;
                if (this.buffer.length < totalLen) break;

                const msgId = (this.buffer[6] << 16) | (this.buffer[5] << 8) | this.buffer[4];
                const payload = this.buffer.slice(10, 10 + len);
                console.log(`Packet: ID=${msgId}, Len=${len}, Payload=[${Array.from(payload)}]`);
                const msg = this.parseMessage(msgId, payload);
                if (msg) {
                    this.messages[msg.name] = msg;
                    if (this.callbacks[msg.name]) this.callbacks[msg.name](msg);
                } else {
                    console.log(`Unknown ID ${msgId}, payload:`, Array.from(payload));
                }
                this.buffer = this.buffer.slice(totalLen);
            } else {
                this.buffer = this.buffer.slice(1);
            }
        }
    }

    parseMessage(msgId, data) {
        const offset = 65929; // Adjust if logs suggest otherwise
        const adjustedId = msgId - offset;
        try {
            if (adjustedId === this.MAVLINK_MSG_ID_HEARTBEAT) {
                return {
                    name: 'HEARTBEAT',
                    type: new DataView(data.buffer, data.byteOffset, 1).getUint8(0),
                    system_status: new DataView(data.buffer, data.byteOffset + 1, 1).getUint8(0),
                };
            } else if (adjustedId === this.MAVLINK_MSG_ID_SYS_STATUS) {
                return {
                    name: 'SYS_STATUS',
                    voltage_battery: new DataView(data.buffer, data.byteOffset, 4).getUint32(0, true) / 1000,
                    current_battery: new DataView(data.buffer, data.byteOffset + 4, 4).getInt32(0, true) / 100,
                    battery_remaining: new DataView(data.buffer, data.byteOffset + 8, 1).getInt8(0),
                };
            } else if (adjustedId === this.MAVLINK_MSG_ID_RC_CHANNELS) {
                return {
                    name: 'RC_CHANNELS',
                    chan1_raw: new DataView(data.buffer, data.byteOffset, 2).getUint16(0, true),
                    chan2_raw: new DataView(data.buffer, data.byteOffset + 2, 2).getUint16(0, true),
                    chan3_raw: new DataView(data.buffer, data.byteOffset + 4, 2).getUint16(0, true),
                    chan4_raw: new DataView(data.buffer, data.byteOffset + 6, 2).getUint16(0, true),
                };
            } else if (adjustedId === this.MAVLINK_MSG_ID_LOCAL_POSITION_NED) {
                return {
                    name: 'LOCAL_POSITION_NED',
                    x: new DataView(data.buffer, data.byteOffset, 4).getFloat32(0, true),
                    y: new DataView(data.buffer, data.byteOffset + 4, 4).getFloat32(0, true),
                    z: new DataView(data.buffer, data.byteOffset + 8, 4).getFloat32(0, true),
                };
            } else if (adjustedId === this.MAVLINK_MSG_ID_GLOBAL_POSITION_INT) {
                const latRaw = new DataView(data.buffer, data.byteOffset, 4).getInt32(0, true);
                const lonRaw = new DataView(data.buffer, data.byteOffset + 4, 4).getInt32(0, true);
                const lat = latRaw / 1e7;
                const lon = lonRaw / 1e7;
                console.log(`GLOBAL_POSITION_INT: raw lat=${latRaw}, lon=${lonRaw}, adjusted lat=${lat}, lon=${lon}`);
                return {
                    name: 'GLOBAL_POSITION_INT',
                    lat: lat,
                    lon: lon,
                    alt: new DataView(data.buffer, data.byteOffset + 8, 4).getInt32(0, true) / 1000,
                };
            } else if (adjustedId === this.MAVLINK_MSG_ID_VFR_HUD) {
                return {
                    name: 'VFR_HUD',
                    airspeed: new DataView(data.buffer, data.byteOffset, 4).getFloat32(0, true),
                    groundspeed: new DataView(data.buffer, data.byteOffset + 4, 4).getFloat32(0, true),
                    heading: new DataView(data.buffer, data.byteOffset + 8, 2).getInt16(0, true),
                    alt: new DataView(data.buffer, data.byteOffset + 12, 4).getFloat32(0, true),
                };
            } else if (adjustedId === this.MAVLINK_MSG_ID_ATTITUDE) {
                const rollRad = new DataView(data.buffer, data.byteOffset, 4).getFloat32(0, true);
                const pitchRad = new DataView(data.buffer, data.byteOffset + 4, 4).getFloat32(0, true);
                const yawRad = new DataView(data.buffer, data.byteOffset + 8, 4).getFloat32(0, true);
                const toDeg = (rad) => (rad * 180 / Math.PI).toFixed(2); // Convert to degrees
                console.log(`ATTITUDE: raw roll=${rollRad}, pitch=${pitchRad}, yaw=${yawRad}, deg roll=${toDeg(rollRad)}, pitch=${toDeg(pitchRad)}, yaw=${toDeg(yawRad)}`);
                return {
                    name: 'ATTITUDE',
                    roll: toDeg(rollRad),
                    pitch: toDeg(pitchRad),
                    yaw: toDeg(yawRad),
                };
            }
            return null;
        } catch (error) {
            console.error(`Error parsing ID ${msgId}: ${error.message}`);
            return null;
        }
    }

    pack(msgId, fields) {
        const offset = 65929;
        const adjustedId = msgId + offset;
        if (msgId === this.MAVLINK_MSG_ID_COMMAND_LONG) {
            const buffer = new Uint8Array(45);
            buffer[0] = 0xFD;
            buffer[1] = 33;
            buffer[2] = 0;
            buffer[3] = 0;
            buffer[4] = adjustedId & 0xFF;
            buffer[5] = (adjustedId >> 8) & 0xFF;
            buffer[6] = (adjustedId >> 16) & 0xFF;
            buffer[7] = 0;
            buffer[8] = 1;
            buffer[9] = 1;
            const view = new DataView(buffer.buffer);
            view.setFloat32(10, fields.param1 || 0, true);
            view.setFloat32(14, fields.param2 || 0, true);
            view.setFloat32(18, fields.param3 || 0, true);
            view.setFloat32(22, fields.param4 || 0, true);
            view.setFloat32(26, fields.param5 || 0, true);
            view.setFloat32(30, fields.param6 || 0, true);
            view.setFloat32(34, fields.param7 || 0, true);
            view.setUint8(38, fields.target_system);
            view.setUint8(39, fields.target_component);
            view.setUint16(40, fields.command, true);
            view.setUint8(42, fields.confirmation || 0);
            const crc = this.calculateCRC(buffer.slice(0, 43));
            buffer[43] = crc & 0xFF;
            buffer[44] = (crc >> 8) & 0xFF;
            return buffer;
        } else if (msgId === this.MAVLINK_MSG_ID_REQUEST_DATA_STREAM) {
            const buffer = new Uint8Array(18); // 10 header + 6 payload + 2 checksum
            buffer[0] = 0xFD;
            buffer[1] = 6;
            buffer[2] = 0;
            buffer[3] = 0;
            buffer[4] = adjustedId & 0xFF;
            buffer[5] = (adjustedId >> 8) & 0xFF;
            buffer[6] = (adjustedId >> 16) & 0xFF;
            buffer[7] = 0;
            buffer[8] = 1;
            buffer[9] = 1;
            const view = new DataView(buffer.buffer);
            view.setUint8(10, fields.target_system);
            view.setUint8(11, fields.target_component);
            view.setUint8(12, fields.req_stream_id);
            view.setUint16(13, fields.req_message_rate, true);
            view.setUint8(15, fields.start_stop);
            const crc = this.calculateCRC(buffer.slice(0, 16));
            buffer[16] = crc & 0xFF;
            buffer[17] = (crc >> 8) & 0xFF;
            return buffer;
        }
        return null;
    }

    calculateCRC(data) {
        let crc = 0xFFFF;
        for (let i = 1; i < data.length; i++) {
            crc ^= data[i];
            for (let j = 0; j < 8; j++) {
                crc = (crc & 1) ? (crc >> 1) ^ 0xA001 : crc >> 1;
            }
        }
        return crc;
    }
}

let port, reader, writer;
const mavlinkParser = new MAVLinkParser();
const telemetryData = {};
let map, marker;

mapboxgl.accessToken = 'pk.eyJ1Ijoic2FkZXFhbCIsImEiOiJjbDA0ZHBpZDgwYjl5M2Rud2wweDVhaWVtIn0.PSwxdzBQL8ZCh0kYT4UA9g';
map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sadeqal/cl04dpzyq000v15o3nlcnpn9d',
    center: [-3.70405, 40.41662],
    zoom: 16,
    pitch: 75,
    bearing: 0,
});

map.on('load', () => {
    map.addSource('mapbox-dem', { 'type': 'raster-dem', 'url': 'mapbox://mapbox.terrain-rgb' });
    map.addLayer({ 'id': 'terrain', 'type': 'hillshade', 'source': 'mapbox-dem' });
});

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
        writer = port.writable.getWriter();
        document.getElementById('status').textContent = 'Connected to Pixhawk!';
        document.getElementById('status').style.color = '#0f0';
        requestDataStreams(); // Request faster updates
        readData();
    } catch (error) {
        document.getElementById('status').textContent = `Error: ${error.message}`;
        document.getElementById('status').style.color = '#f00';
    }
}

async function disconnectSerial() {
    if (reader) {
        await reader.cancel();
        reader.releaseLock();
    }
    if (writer) {
        writer.releaseLock();
    }
    if (port) {
        await port.close();
        port = null;
        document.getElementById('status').textContent = 'Disconnected';
        document.getElementById('status').style.color = '#0ff';
        if (marker) marker.remove();
    }
}

async function readData() {
    let byteCount = 0;
    let lastUpdate = Date.now();
    while (true) {
        try {
            const { value, done } = await reader.read();
            if (done) {
                document.getElementById('status').textContent = 'Stream closed';
                reader.releaseLock();
                break;
            }
            byteCount += value.length;
            const now = Date.now();
            if (now - lastUpdate >= 1000) {
                const rate = byteCount / ((now - lastUpdate) / 1000);
                document.getElementById('data-rate').textContent = `Data Rate: ${rate.toFixed(2)} B/s`;
                byteCount = 0;
                lastUpdate = now;
            }
            mavlinkParser.parseBuffer(value);
        } catch (error) {
            document.getElementById('status').textContent = `Read error: ${error.message}`;
            document.getElementById('status').style.color = '#f00';
            break;
        }
    }
}

async function sendCommand(command, params = {}) {
    const msg = mavlinkParser.pack(mavlinkParser.MAVLINK_MSG_ID_COMMAND_LONG, {
        target_system: 1,
        target_component: 1,
        command,
        confirmation: 0,
        ...params
    });
    if (writer && msg) {
        await writer.write(msg);
    }
}

async function requestDataStreams() {
    const streams = [
        { req_stream_id: 6, req_message_rate: 10, start_stop: 1 }, // ATTITUDE (stream 6 in Ardupilot)
        { req_stream_id: 2, req_message_rate: 10, start_stop: 1 }, // SYS_STATUS
        { req_stream_id: 12, req_message_rate: 10, start_stop: 1 } // POSITION (GPS)
    ];
    for (const stream of streams) {
        const msg = mavlinkParser.pack(mavlinkParser.MAVLINK_MSG_ID_REQUEST_DATA_STREAM, {
            target_system: 1,
            target_component: 1,
            req_stream_id: stream.req_stream_id,
            req_message_rate: stream.req_message_rate,
            start_stop: stream.start_stop
        });
        if (writer && msg) {
            await writer.write(msg);
        }
    }
}

function sendTakeoff() {
    sendCommand(22, { param1: 10.0 });
}

function sendLand() {
    sendCommand(21);
}

mavlinkParser.on('HEARTBEAT', (msg) => handleMessage('HEARTBEAT', msg));
mavlinkParser.on('SYS_STATUS', (msg) => handleMessage('SYS_STATUS', msg));
mavlinkParser.on('RC_CHANNELS', (msg) => handleMessage('RC_CHANNELS', msg));
mavlinkParser.on('LOCAL_POSITION_NED', (msg) => handleMessage('LOCAL_POSITION_NED', msg));
mavlinkParser.on('GLOBAL_POSITION_INT', (msg) => handleMessage('GLOBAL_POSITION_INT', msg));
mavlinkParser.on('VFR_HUD', (msg) => handleMessage('VFR_HUD', msg));
mavlinkParser.on('ATTITUDE', (msg) => handleMessage('ATTITUDE', msg));

function handleMessage(type, msg) {
    Object.assign(telemetryData[type] = telemetryData[type] || {}, msg);
    updateInspector();
    if (type === 'GLOBAL_POSITION_INT') {
        updateMapMarker(msg);
    }
}

function updateMapMarker(msg) {
    const lat = msg.lat;
    const lon = msg.lon;
    if (lat && lon && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        if (marker) marker.remove();
        const el = document.createElement('div');
        el.innerHTML = '<i class="fas fa-plane" style="font-size: 24px; color: #ff00ff;"></i>';
        marker = new mapboxgl.Marker({ element: el })
            .setLngLat([lon, lat])
            .addTo(map);
        map.flyTo({ center: [lon, lat], zoom: 16, speed: 0.8 });
    } else {
        console.error(`Invalid coordinates: lat=${lat}, lon=${lon}`);
    }
}

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
        section.innerHTML = `<h3>${type}</h3>`;
        section.appendChild(table);
        inspectorContent.appendChild(section);
    }
}

document.getElementById('analyze-btn').addEventListener('click', () => {
    const overlay = document.getElementById('inspector-overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
});
document.getElementById('close-inspector').addEventListener('click', () => {
    document.getElementById('inspector-overlay').style.display = 'none';
});

populatePorts();
navigator.serial.addEventListener('connect', populatePorts);
navigator.serial.addEventListener('disconnect', populatePorts);