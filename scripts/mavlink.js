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
                console.log("Received HEARTBEAT message");
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
                console.log("Received SYS_STATUS message");
                return {
                    name: 'SYS_STATUS',
                    battery_voltage: new DataView(data.buffer, data.byteOffset + 18, 2).getUint16(0, true) / 1000.0,
                    battery_current: new DataView(data.buffer, data.byteOffset + 20, 2).getInt16(0, true) / 100.0,
                    battery_remaining: data[22]
                };
            } else if (msgId === this.MAVLINK_MSG_ID_PARAM_VALUE) {
                if (data.length < 31) return null;
                const paramId = String.fromCharCode.apply(null, data.slice(6, 22)).trim();
                const paramValue = new DataView(data.buffer, data.byteOffset + 22, 4).getFloat32(0, true);
                console.log("Received PARAM_VALUE message");
                return {
                    name: 'PARAM_VALUE',
                    param_id: paramId,
                    param_value: paramValue,
                    param_type: data[26],
                    param_count: new DataView(data.buffer, data.byteOffset + 27, 2).getUint16(0, true),
                    param_index: new DataView(data.buffer, data.byteOffset + 29, 2).getUint16(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_GPS_RAW_INT) {
                if (data.length < 32) return null;
                console.log("Received GPS_RAW_INT message");
                return {
                    name: 'GPS_RAW_INT',
                    fix_type: data[14],
                    lat: new DataView(data.buffer, data.byteOffset + 15, 4).getInt32(0, true),
                    lon: new DataView(data.buffer, data.byteOffset + 19, 4).getInt32(0, true),
                    alt: new DataView(data.buffer, data.byteOffset + 23, 4).getInt32(0, true),
                    satellites_visible: data[31]
                };
            } else if (msgId === this.MAVLINK_MSG_ID_ATTITUDE) {
                if (data.length < 28) return null;
                console.log("Received ATTITUDE message");
                return {
                    name: 'ATTITUDE',
                    roll: new DataView(data.buffer, data.byteOffset + 6, 4).getFloat32(0, true),
                    pitch: new DataView(data.buffer, data.byteOffset + 10, 4).getFloat32(0, true),
                    yaw: new DataView(data.buffer, data.byteOffset + 14, 4).getFloat32(0, true)
                };
            } else if (msgId === this.MAVLINK_MSG_ID_VFR_HUD) {
                if (data.length < 26) return null;
                console.log("Received VFR_HUD message");
                return {
                    name: 'VFR_HUD',
                    airspeed: new DataView(data.buffer, data.byteOffset + 6, 4).getFloat32(0, true),
                    groundspeed: new DataView(data.buffer, data.byteOffset + 10, 4).getFloat32(0, true),
                    heading: new DataView(data.buffer, data.byteOffset + 14, 2).getInt16(0, true),
                    throttle: new DataView(data.buffer, data.byteOffset + 16, 2).getUint16(0, true),
                    alt: new DataView(data.buffer, data.byteOffset + 18, 4).getFloat32(0, true),
                    climb: new DataView(data.buffer, data.byteOffset + 22, 4).getFloat32(0, true)
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
const topicList = document.getElementById('topic-list');
const selectedTopicTitle = document.getElementById('selected-topic-title');
const selectedTelemetryTable = document.getElementById('selected-telemetry-table');
const mavlinkParser = new MAVLinkParser();
let byteCount = 0;
let lastUpdate = Date.now();

// Data logging structure: { topic: { subtopic: [{time, value}] } }
const loggedData = {};
let selectedTopicChart = null;
const telemetryData = {};
let selectedTopic = null;

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
        { req_stream_id: 0, req_message_rate: 10, start_stop: 1 }, // ALL
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

function handleMessage(type, msg) {
    console.log(`Handling message: ${type}`, msg);
    if (!telemetryData[type]) {
        telemetryData[type] = {};
        loggedData[type] = {};
        addTopicToSidebar(type);
    }
    Object.assign(telemetryData[type], msg);
    logData(type, msg);
    if (selectedTopic === type) {
        updateSelectedTopicTable(type);
        updateSelectedTopicChart(type);
    }
}

// Add topic to sidebar
function addTopicToSidebar(type) {
    console.log(`Adding topic to sidebar: ${type}`);
    const li = document.createElement('li');
    li.textContent = type;
    li.onclick = () => selectTopic(type);
    topicList.appendChild(li);
}

// Select a topic and display its data
function selectTopic(type) {
    selectedTopic = type;
    selectedTopicTitle.textContent = type;
    document.querySelectorAll('#topic-list li').forEach(li => li.classList.remove('active'));
    const selectedLi = Array.from(topicList.children).find(li => li.textContent === type);
    if (selectedLi) selectedLi.classList.add('active');
    updateSelectedTopicTable(type);
    initSelectedTopicChart(type);
}

// Log data with timestamps
function logData(type, msg) {
    const timestamp = Date.now();
    for (const [field, value] of Object.entries(msg)) {
        if (field === 'name') continue;
        if (!loggedData[type][field]) {
            loggedData[type][field] = [];
        }
        loggedData[type][field].push({ time: timestamp, value });
        if (loggedData[type][field].length > 100) {
            loggedData[type][field].shift();
        }
    }
}

// Update the table for the selected topic
function updateSelectedTopicTable(type) {
    selectedTelemetryTable.innerHTML = `
        <table id="${type}-table">
            <thead><tr><th>Field</th><th>Value</th><th>Action</th></tr></thead>
            <tbody></tbody>
        </table>
    `;
    const tbody = selectedTelemetryTable.querySelector('tbody');
    for (const [field, value] of Object.entries(telemetryData[type])) {
        if (field === 'name') continue;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${field}</td>
            <td id="${type}-${field}-value">${value}</td>
            <td>
                <button onclick="toggleChart('${type}', '${field}')">Plot</button>
                <button onclick="showValue('${type}', '${field}')">Value</button>
            </td>
        `;
        tbody.appendChild(row);
    }
}

// Initialize chart for the selected topic
function initSelectedTopicChart(type) {
    // Destroy the previous chart if it exists
    if (selectedTopicChart) {
        selectedTopicChart.destroy();
        selectedTopicChart = null;
    }

    const ctx = document.getElementById('selected-topic-chart').getContext('2d');
    // Clear the canvas context to avoid reuse issues
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    selectedTopicChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second',
                        displayFormats: {
                            second: 'HH:mm:ss'
                        }
                    },
                    title: { display: true, text: 'Time' }
                },
                y: { title: { display: true, text: 'Value' } }
            },
            plugins: { legend: { display: true } },
            maintainAspectRatio: false
        }
    });
    updateSelectedTopicChart(type);
}

// Update chart with logged data
function updateSelectedTopicChart(type) {
    if (!selectedTopicChart) return;
    selectedTopicChart.data.datasets.forEach(dataset => {
        const field = dataset.label;
        dataset.data = loggedData[type][field].map(d => ({ x: d.time, y: d.value }));
    });
    selectedTopicChart.update();
}

// Toggle plotting for a subtopic
function toggleChart(type, field) {
    if (!selectedTopicChart) return;
    const chart = selectedTopicChart;
    const existing = chart.data.datasets.find(d => d.label === field);
    if (existing) {
        chart.data.datasets = chart.data.datasets.filter(d => d.label !== field);
    } else {
        chart.data.datasets.push({
            label: field,
            data: loggedData[type][field].map(d => ({ x: d.time, y: d.value })),
            borderColor: '#0ff',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            fill: false
        });
    }
    chart.update();
}

// Show real-time value
function showValue(type, field) {
    alert(`Real-time value for ${type}.${field}: ${telemetryData[type][field]}`);
    console.log(`${type}.${field}: ${telemetryData[type][field]}`);
}

// Initialize port selection
populatePorts();
navigator.serial.addEventListener('connect', populatePorts);
navigator.serial.addEventListener('disconnect', populatePorts);