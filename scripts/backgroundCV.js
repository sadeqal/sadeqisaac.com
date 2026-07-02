const canvas = document.getElementById('bg-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL not supported by your browser');
}

// Vertex Shader
const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

// Fragment Shader (Generates the exact dark silk/smoke waves)
const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      // Color profile matched from your link
      vec3 bgTop = vec3(0.043, 0.039, 0.051);      // #0b0a0d
      vec3 silkColor = vec3(0.282, 0.016, 0.290);  // #48044a

      // Noise generation algorithms for fluid movement
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
                       dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
                   mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
                       dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv.x *= u_resolution.x / u_resolution.y;

        float t = u_time * 0.2; // Speed of the waves

        // Layered distortion to simulate moving liquid/smoke folds
        vec2 uv1 = uv * 2.0;
        uv1.x += noise(uv1 + vec2(t, t * 0.5));
        uv1.y += noise(uv1 - vec2(t * 0.2, t));
        float n1 = noise(uv1);

        vec2 uv2 = uv * 3.5 + vec2(n1 * 0.6);
        float n2 = noise(uv2 + vec2(-t * 0.2, t * 0.4));

        // Create the bright flowing silk ridges
        float wave = abs(n1 + n2 * 0.5);
        wave = smoothstep(0.0, 0.6, wave);
        wave = pow(1.0 - wave, 3.5) * 0.4;

        // Blending colors
        vec3 finalColor = mix(bgTop, silkColor, wave);

        // Vignette effect for depth
        finalColor *= smoothstep(1.4, 0.5, length(gl_FragCoord.xy / u_resolution.xy - vec2(0.5)));

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
gl.linkProgram(program);
gl.useProgram(program);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

const posAttr = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(posAttr);
gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

const resUniform = gl.getUniformLocation(program, "u_resolution");
const timeUniform = gl.getUniformLocation(program, "u_time");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

function render(time) {
    gl.uniform2f(resUniform, canvas.width, canvas.height);
    gl.uniform1f(timeUniform, time * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);


/* ==========================================================================
   EXPORT TO PDF FUNCTIONALITY
   ========================================================================== */
// Toggle Dropdown Menu visibility
document.getElementById('exportBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('dropdownContent').classList.toggle('show-dropdown');
});

// Close dropdown if user clicks anywhere else outside it
window.addEventListener('click', function() {
    const dropdown = document.getElementById('dropdownContent');
    if (dropdown.classList.contains('show-dropdown')) {
        dropdown.classList.remove('show-dropdown');
    }
});

function exportCV(variant) {
    // 1. Create a hidden isolated canvas container to build a true print asset
    const printContainer = document.createElement('div');
    printContainer.style.width = '210mm';
    printContainer.style.background = '#ffffff';
    printContainer.style.color = '#111111';
    printContainer.style.fontFamily = '"Inter", "Arial", sans-serif';
    printContainer.style.padding = '20mm';
    printContainer.style.boxSizing = 'border-box';

    // Extract core data from screen metrics
    const name = "Sadeq Isaac, PhD"; //[cite: 2]
    const role = "Senior Aerospace & Robotics Engineer"; //[cite: 2]
    const summaryText = "PhD Robotics Engineer with 10+ years of experience in UAVs, Flight Dynamics, and Autonomous Systems. Technical lead in the development of military VTOL and fixed-wing UAV platforms."; //[cite: 2]
    const profileImgSrc = document.querySelector('.profile-image img')?.src || ''; //[cite: 2]

    // Determine configuration rules based on language variants
    const isSpanish = variant === 'spanish';
    const isSpaninglish = variant === 'spaninglish';
    const includeImage = isSpanish || isSpaninglish;

    // Localized Headers
    const labels = {
        summary: isSpanish ? "RESUMEN PROFESIONAL" : "PROFESSIONAL SUMMARY",
        experience: isSpanish ? "EXPERIENCIA LABORAL" : "PROFESSIONAL EXPERIENCE",
        education: isSpanish ? "EDUCACIÓN" : "EDUCATION"
    };

    // Clone the dynamic Timeline content and strip interactive/web specific nodes safely
    const originalTimeline = document.querySelector('.timeline').cloneNode(true); //[cite: 2]
    const originalEducation = document.querySelector('.education-list').cloneNode(true); //[cite: 2]
    
    // Clean up inline anchor styles for printable typography
    originalTimeline.querySelectorAll('a').forEach(a => a.style.color = '#111111'); //[cite: 2, 3]

    // 2. Synthesize High-End Industrial Header Structure
    let headerHTML = '';
    if (includeImage && profileImgSrc) {
        headerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8mm;">
                <tr>
                    <td style="width: 35mm; vertical-align: middle;">
                        <img src="${profileImgSrc}" style="width: 30mm; height: 30mm; border-radius: 50%; object-fit: cover; border: 2px solid #111;">
                    </td>
                    <td style="vertical-align: middle; padding-left: 5mm;">
                        <h1 style="font-size: 26pt; margin: 0; color: #0b2545; font-weight: 800; letter-spacing: -0.5px;">${name}</h1>
                        <p style="font-size: 13pt; margin: 2mm 0 0 0; color: #444; font-weight: 500;">${role}</p>
                        <p style="font-size: 9.5pt; margin: 1mm 0 0 0; color: #666;">Madrid, Spain | sadeqalisaac@gmail.com | Full Working Rights</p>
                    </td>
                </tr>
            </table>
        `;
    } else {
        headerHTML = `
            <div style="text-align: center; border-bottom: 2px solid #0b2545; padding-bottom: 5mm; margin-bottom: 8mm;">
                <h1 style="font-size: 28pt; margin: 0; color: #0b2545; font-weight: 800; letter-spacing: -0.5px;">${name}</h1>
                <p style="font-size: 14pt; margin: 2mm 0; color: #444; font-weight: 500;">${role}</p>
                <p style="font-size: 10pt; margin: 0; color: #666;">Madrid, Spain &bull; sadeqalisaac@gmail.com &bull; Full Working Rights</p>
            </div>
        `;
    }

    // 3. Assemble Executive Blueprint Component Layout
    printContainer.innerHTML = `
        ${headerHTML}
        
        <div style="margin-bottom: 6mm;">
            <h2 style="font-size: 12pt; color: #0b2545; border-bottom: 1px solid #ddd; padding-bottom: 1mm; margin-bottom: 2mm; letter-spacing: 0.5px;">${labels.summary}</h2>
            <p style="font-size: 10pt; line-height: 1.5; color: #333; margin: 0; text-align: justify;">${summaryText}</p>
        </div>

        <div style="margin-bottom: 6mm;">
            <h2 style="font-size: 12pt; color: #0b2545; border-bottom: 1px solid #ddd; padding-bottom: 1mm; margin-bottom: 4mm; letter-spacing: 0.5px;">${labels.experience}</h2>
            <div class="pdf-timeline" style="font-size: 10pt; line-height: 1.4;">
                ${originalTimeline.innerHTML}
            </div>
        </div>

        <div>
            <h2 style="font-size: 12pt; color: #0b2545; border-bottom: 1px solid #ddd; padding-bottom: 1mm; margin-bottom: 4mm; letter-spacing: 0.5px;">${labels.education}</h2>
            <div class="pdf-education" style="font-size: 10pt; line-height: 1.4;">
                ${originalEducation.innerHTML}
            </div>
        </div>
    `;

    // 4. Clean elements styling mapping to avoid dark-theme spilling into the presentation context
    printContainer.querySelectorAll('.timeline-item, .education-item').forEach(item => {
        item.style.display = 'flex';
        item.style.marginBottom = '4mm';
        item.style.pageBreakInside = 'avoid';
    });
    printContainer.querySelectorAll('.date').forEach(d => {
        d.style.width = '30mm';
        d.style.minWidth = '30mm';
        d.style.fontWeight = '700';
        d.style.color = '#0b2545';
    });
    printContainer.querySelectorAll('.content').forEach(c => {
        c.style.flex = '1';
        c.style.background = 'none';
        c.style.padding = '0';
        c.style.color = '#222';
    });
    printContainer.querySelectorAll('h3').forEach(h => {
        h.style.margin = '0 0 1mm 0';
        h.style.fontSize = '11pt';
        h.style.color = '#111';
    });
    printContainer.querySelectorAll('h4').forEach(h => {
        h.style.margin = '0 0 2mm 0';
        h.style.fontSize = '10pt';
        h.style.color = '#555';
    });
    printContainer.querySelectorAll('ul').forEach(ul => {
        ul.style.paddingLeft = '5mm';
        ul.style.margin = '1mm 0';
    });
    printContainer.querySelectorAll('li').forEach(li => {
        li.style.marginBottom = '1mm';
        li.style.color = '#333';
    });
    printContainer.querySelectorAll('.edu-row').forEach(row => {
        row.style.color = '#444';
        row.style.margin = '1mm 0';
    });
    printContainer.querySelectorAll('.fas, .far, .fab').forEach(icon => icon.remove()); // Strip decorative web graphics

    // 5. Execute html2pdf processing injection over hidden container element
    document.body.appendChild(printContainer);

    const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Sadeq_Isaac_CV_${variant}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 3, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printContainer).save().then(() => {
        printContainer.remove(); // Unmount gracefully from DOM
    });
}