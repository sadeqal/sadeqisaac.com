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
    const element = document.body;

    if (variant === 'spaninglish') {
        // Step 1: Temporarily restructure container to match the two-column image template layout
        const originalHTML = element.innerHTML;
        
        // Grab values directly out of your existing document elements
        const name = "Sadeq Isaac, PhD";
        const role = "Senior Aerospace & Robotics Engineer";
        const summary = document.querySelector('.cv-section p').innerHTML;
        const profileImgSrc = document.querySelector('.profile-image img').src;

        // Build the layout matching your reference picture structure natively
        const templateHTML = `
            <div class="spaninglish-print-mode">
                <div class="spaninglish-sidebar">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${profileImgSrc}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid white;">
                    </div>
                    <div>
                        <h3 style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; color: #fff;">SOBRE MÍ</h3>
                        <p style="font-size: 12px; opacity: 0.9; line-height: 1.4;">${summary}</p>
                    </div>
                    <div>
                        <h3 style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; color: #fff;">CONTACTO</h3>
                        <p style="font-size: 12px; margin: 5px 0;">📍 Madrid, Spain</p>
                        <p style="font-size: 12px; margin: 5px 0;">✉️ sadeqalisaac@gmail.com</p>
                    </div>
                </div>
                
                <div class="spaninglish-main">
                    <h1 style="font-size: 32px; color: #0b2545; margin: 0;">${name}</h1>
                    <p style="font-size: 16px; color: #666; margin: 5px 0 20px 0;">${role}</p>
                    <hr style="border: 0; border-top: 1px solid #ccc; margin-bottom: 20px;">
                    
                    <h3 style="color: #0b2545; letter-spacing: 1px;">EXPERIENCIA LABORAL</h3>
                    ${document.querySelector('.timeline').innerHTML}
                </div>
            </div>
        `;

        // Switch window content to template view temporary to intercept PDF render window
        document.body.innerHTML = templateHTML;

        const opt = {
            margin:       0,
            filename:     'Sadeq_Isaac_CV_Spaninglish.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate the PDF artifact document smoothly
        html2pdf().set(opt).from(document.body).save().then(() => {
            // Restore original website look and interactive controls instantly
            document.body.innerHTML = originalHTML;
            // Rebind action event listener tracking safely
            location.reload(); 
        });

    } else {
        // Default standard download setups for Standard layouts
        const opt = {
            margin:       10,
            filename:     `Sadeq_Isaac_CV_${variant}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(document.getElementById('cv-content')).save();
    }
}