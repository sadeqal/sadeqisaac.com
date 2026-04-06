let video = document.getElementById('video');
let liveOverlay = document.getElementById('liveOverlay');
let chart;
let telemetry = {
    alt: [],
    airspeed: [],
    lat: [],
    lng: [],
    groundSpeed: [],
    heading: [],
    climb: [],
    sats: [],
    hdop: []
};

let overlayFields = {
    alt: true,
    airspeed: true,
    lat: true,
    lng: true,
    groundSpeed: true,
    heading: true,
    climb: true,
    sats: true,
    hdop: true,
    time: true
};
let syncOffset = 0;            // video_time - log_time
let selectedLogTime = null;
let isExporting = false;
let recorder = null;
let recordedChunks = [];
let exportCanvas = null;
let exportCtx = null;

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
    exportBtn: document.getElementById('exportBtn')
};

els.fieldAlt.addEventListener('change', () => {
    overlayFields.alt = els.fieldAlt.checked;
    updateLiveOverlay();
});

els.fieldAirspeed.addEventListener('change', () => {
    overlayFields.airspeed = els.fieldAirspeed.checked;
    updateLiveOverlay();
});

els.fieldLat.addEventListener('change', () => {
    overlayFields.lat = els.fieldLat.checked;
    updateLiveOverlay();
});

els.fieldLng.addEventListener('change', () => {
    overlayFields.lng = els.fieldLng.checked;
    updateLiveOverlay();
});

els.fieldLng.addEventListener('change', () => {
    overlayFields.groundSpeed = els.fieldGroundSpeed.checked;
    updateLiveOverlay();
});

els.fieldLng.addEventListener('change', () => {
    overlayFields.heading = els.fieldHeading.checked;
    updateLiveOverlay();
});

els.fieldLng.addEventListener('change', () => {
    overlayFields.climb = els.fieldClimb.checked;
    updateLiveOverlay();
});

els.fieldLng.addEventListener('change', () => {
    overlayFields.sats = els.fieldSats.checked;
    updateLiveOverlay();
});

els.fieldLng.addEventListener('change', () => {
    overlayFields.hdop = els.fieldHdop.checked;
    updateLiveOverlay();
});

els.fieldLng.addEventListener('change', () => {
    overlayFields.time = els.fieldTime.checked;
    updateLiveOverlay();
});

function setStatus(msg) {
    els.statusBox.textContent = msg;
}

function fmt(sec) {
    return `${Number(sec || 0).toFixed(3)} s`;
}

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

function getInterpolatedValue(series, logTime) {
    if (!series || !series.length) return null;
    
    if (logTime <= series[0].time) return series[0].value;
    if (logTime >= series[series.length - 1].time) return series[series.length - 1].value;
    
    let lo = 0;
    let hi = series.length - 1;
    
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

function updateLiveOverlay() {
    const hasAnyData =
    telemetry.alt.length ||
    telemetry.airspeed.length ||
    telemetry.lat.length ||
    telemetry.lng.length;
    
    if (!hasAnyData) {
        liveOverlay.innerHTML = '';
        updateTimeReadout();
        return;
    }
    
    const videoTime = video.currentTime || 0;
    const logTime = videoTime - syncOffset;
    
    const lines = [];
    
    if (overlayFields.alt) { const alt = getInterpolatedValue(telemetry.alt, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">Alt</span><span class="overlay-value">${alt == null ? '—' : alt.toFixed(1) + ' m'}</span></div>`);}
        
    if (overlayFields.lat) { const lat = getInterpolatedValue(telemetry.lat, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">Lat</span><span class="overlay-value">${lat == null ? '—' : lat.toFixed(6)}</span></div>`);}
    
    if (overlayFields.lng) { const lng = getInterpolatedValue(telemetry.lng, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">Lng</span><span class="overlay-value">${lng == null ? '—' : lng.toFixed(6)}</span></div>`);}
    
    if (overlayFields.airspeed) { const airspeed = getInterpolatedValue(telemetry.airspeed, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">Arspd</span><span class="overlay-value">${airspeed == null ? '—' : airspeed.toFixed(1) + ' m/s'}</span></div>`);}
    
    if (overlayFields.groundSpeed) { const groundSpeed = getInterpolatedValue(telemetry.groundSpeed, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">Gndspd</span><span class="overlay-value">${groundSpeed == null ? '—' : groundSpeed.toFixed(1) + ' m/s'}</span></div>`);}
        
    if (overlayFields.climb) { const climb = getInterpolatedValue(telemetry.climb, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">ROC</span><span class="overlay-value">${climb == null ? '—' : climb.toFixed(1) + ' m/s'}</span></div>`);}
    
    if (overlayFields.heading) { const heading = getInterpolatedValue(telemetry.heading, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">Hdg</span><span class="overlay-value">${heading == null ? '—' : heading.toFixed(1) + ' '}</span></div>`);}

    if (overlayFields.sats) { const sats = getInterpolatedValue(telemetry.sats, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">Sats</span><span class="overlay-value">${sats == null ? '—' : sats.toFixed(0) + ''}</span></div>`);}
    
    if (overlayFields.hdop) { const hdop = getInterpolatedValue(telemetry.hdop, logTime); lines.push(`<div class="overlay-row"><span class="overlay-label">HDOP</span><span class="overlay-value">${hdop == null ? '—' : hdop.toFixed(1) + ''}</span></div>`);}
        
    liveOverlay.innerHTML = lines.join('');
    updateTimeReadout();
}

function getOverlayLines(logTime) {
    const lines = [];
    const flightTime = logTime;
    
    // Flight time
    lines.push({
        label: 'Time',
        value: `${logTime.toFixed(1)} s`
    });
    
    // Altitude
    if (overlayFields.alt) {
        const alt = getInterpolatedValue(telemetry.alt, logTime);
        lines.push({
            label: 'Alt',
            value: alt == null ? '—' : `${alt.toFixed(1)} m`
        });
    }
    
    // Latitude
    if (overlayFields.lat) {
        const lat = getInterpolatedValue(telemetry.lat, logTime);
        lines.push({
            label: 'Lat',
            value: lat == null ? '—' : lat.toFixed(6)
        });
    }
    
    // Longitude
    if (overlayFields.lng) {
        const lng = getInterpolatedValue(telemetry.lng, logTime);
        lines.push({
            label: 'Lng',
            value: lng == null ? '—' : lng.toFixed(6)
        });
    }
    
    // Airspeed
    if (overlayFields.airspeed) {
        const airspeed = getInterpolatedValue(telemetry.airspeed, logTime);
        lines.push({
            label: 'Arspd',
            value: airspeed == null ? '—' : `${airspeed.toFixed(1)} m/s`
        });
    }
    
    // Ground speed
    if (overlayFields.groundSpeed) {
        const v = getInterpolatedValue(telemetry.groundSpeed, logTime);
        lines.push({
            label: 'GSpd',
            value: v == null ? '—' : `${v.toFixed(1)} m/s`
        });
    }
    
    // Heading
    if (overlayFields.heading) {
        const v = getInterpolatedValue(telemetry.heading, logTime);
        lines.push({
            label: 'Head',
            value: v == null ? '—' : `${v.toFixed(0)}°`
        });
    }
    
    // Climb rate
    if (overlayFields.climb) {
        const v = getInterpolatedValue(telemetry.climb, logTime);
        lines.push({
            label: 'Climb',
            value: v == null ? '—' : `${v.toFixed(1)} m/s`
        });
    }
    
    // Sats
    if (overlayFields.sats) {
        const v = getInterpolatedValue(telemetry.sats, logTime);
        lines.push({
            label: 'Sats',
            value: v == null ? '—' : `${v}`
        });
    }
    
    // HDOP
    if (overlayFields.hdop) {
        const v = getInterpolatedValue(telemetry.hdop, logTime);
        lines.push({
            label: 'HDOP',
            value: v == null ? '—' : v.toFixed(1)
        });
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

function formatTimeAxis(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    
    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Log Time',
                        color: '#cbd5e1'
                    },
                    ticks: {
                        color: '#9eb3d3',
                        callback: function(value) {
                            return formatTimeAxis(value);
                        }
                    },
                    grid: { color: 'rgba(255,255,255,.06)' }
                },
                y: {
                    min: altMin - altPad,
                    max: altMax + altPad,
                    title: {
                        display: true,
                        text: 'Altitude (m)',
                        color: '#cbd5e1'
                    },
                    ticks: { color: '#9eb3d3' },
                    grid: { color: 'rgba(255,255,255,.06)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#edf4ff' }
                },
                tooltip: {
                    callbacks: {
                        title: (items) => `Time: ${formatTimeAxis(items[0].parsed.x)}`,
                        label: (item) => `Alt: ${item.parsed.y.toFixed(2)} m`
                    }
                }
            },
            onClick: (e) => {
                if (!telemetry.alt.length) return;
                
                const points = chart.getElementsAtEventForMode(
                    e,
                    'nearest',
                    { intersect: false },
                    false
                );
                
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
    const parsed = parser.processData(buffer, ['BARO', 'ARSP', 'GPS']);
    
    const baroMsg = parsed?.messages?.['BARO[0]'] || parsed?.messages?.BARO;
    const arspMsg = parsed?.messages?.['ARSP[0]'] || parsed?.messages?.ARSP;
    const gpsMsg  = parsed?.messages?.['GPS[0]']  || parsed?.messages?.GPS;
    
    telemetry = {
        alt: [],
        airspeed: [],
        lat: [],
        lng: []
    };
    
    let baseTime = null;
    
    if (baroMsg?.time_boot_ms && baroMsg?.Alt) {
        const rawAlt = Array.from(baroMsg.Alt)
        .map((alt, i) => ({
            timeAbs: Number(baroMsg.time_boot_ms[i]) / 1000,
            value: Number(alt)
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
        
        if (rawAlt.length) {
            baseTime = rawAlt[0].timeAbs;
            telemetry.alt = rawAlt;
        }
    }
    
    if (arspMsg?.time_boot_ms && arspMsg?.Airspeed) {
        const rawAirspeed = Array.from(arspMsg.Airspeed)
        .map((v, i) => ({
            timeAbs: Number(arspMsg.time_boot_ms[i]) / 1000,
            value: Number(v)
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
        
        if (rawAirspeed.length) {
            if (baseTime == null) baseTime = rawAirspeed[0].timeAbs;
            telemetry.airspeed = rawAirspeed;
        }
    }
    
    if (gpsMsg?.time_boot_ms) {
        
        const makeSeries = (arr, scale = 1) =>
            Array.from(arr || []).map((v, i) => ({
            timeAbs: Number(gpsMsg.time_boot_ms[i]) / 1000,
            value: Number(v) * scale
        }))
        .filter(p => Number.isFinite(p.timeAbs) && Number.isFinite(p.value))
        .sort((a, b) => a.timeAbs - b.timeAbs);
        
        const rawLat  = makeSeries(gpsMsg.Lat, 1 / 1e7);
        const rawLng  = makeSeries(gpsMsg.Lng, 1 / 1e7);
        const rawGSpd = makeSeries(gpsMsg.Spd);     // m/s
        const rawHead = makeSeries(gpsMsg.GCrs);    // degrees
        const rawSats = makeSeries(gpsMsg.NSats);
        const rawHdop = makeSeries(gpsMsg.HDop);
        
        if (rawLat.length) {
            if (baseTime == null) baseTime = rawLat[0].timeAbs;
            telemetry.lat = rawLat;
        }
        
        if (rawLng.length) {
            if (baseTime == null) baseTime = rawLng[0].timeAbs;
            telemetry.lng = rawLng;
        }
        
        if (rawGSpd.length) telemetry.groundSpeed = rawGSpd;
        if (rawHead.length) telemetry.heading = rawHead;
        if (rawSats.length) telemetry.sats = rawSats;
        if (rawHdop.length) telemetry.hdop = rawHdop;
    }
    
    if (baseTime == null) {
        throw new Error('No usable BARO, ARSP, or GPS telemetry found.');
    }
    
    for (const key of Object.keys(telemetry)) {
        telemetry[key] = telemetry[key].map(p => ({
            timeAbs: p.timeAbs,
            time: p.timeAbs - baseTime,
            value: p.value
        }));
    }
    
    // Compute climb rate (m/s) from altitude
    if (telemetry.alt.length > 1) {
        telemetry.climb = telemetry.alt.map((p, i, arr) => {
            if (i === 0) {
                return {
                    timeAbs: p.timeAbs,
                    time: p.time,
                    value: 0
                };
            }
            
            const prev = arr[i - 1];
            const dt = p.time - prev.time;
            const dv = p.value - prev.value;
            
            return {
                timeAbs: p.timeAbs,
                time: p.time,
                value: dt > 0 ? dv / dt : 0
            };
        });
    }
    
    if (!telemetry.alt.length) {
        throw new Error('No BARO altitude data found. Alt is required for the main plot.');
    }
    
    selectedLogTime = null;
    els.selectedLogTimeBox.value = '0';
    
    updateStats();
    renderPlot();
    updateLiveOverlay();
    
    setStatus(
        `Parsed Alt: ${telemetry.alt.length}, Airspeed: ${telemetry.airspeed.length}, GPS Lat: ${telemetry.lat.length}, GPS Lng: ${telemetry.lng.length}`
    );
}

function setSyncPoint() {
    if (selectedLogTime == null) {
        alert("Click the plot first to select the matching log time.");
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

async function startExport() {
    if (isExporting) return;
    if (!telemetry.alt.length) {
        alert("Load telemetry first.");
        return;
    }
    if (!video.src) {
        alert("Load a video first.");
        return;
    }
    
    isExporting = true;
    els.exportBtn.disabled = true;
    els.exportBtn.textContent = 'Exporting... keep tab open';
    
    exportCanvas = document.createElement('canvas');
    exportCanvas.width = video.videoWidth || 2560;
    exportCanvas.height = video.videoHeight || 1440;
    exportCtx = exportCanvas.getContext('2d', { alpha: false });
    
    const stream = exportCanvas.captureStream(30);
    
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
    }
    
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
        a.download = `flight_with_BARO_Alt.${ext}`;
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

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
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
            throw new Error('Please choose a real .bin file.');
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

els.scrubber.addEventListener('input', () => {
    video.currentTime = Number(els.scrubber.value) || 0;
    updateLiveOverlay();
});

document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 's' && video.paused) {
        setSyncPoint();
    }
});

function formatTimeAxis(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    
    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

console.log('Ready: load video + real BIN parser library + BIN file.');