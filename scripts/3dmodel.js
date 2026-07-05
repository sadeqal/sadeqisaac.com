// ==========================================================================
// B2 MODEL BACKDROP — renders into #b2-canvas inside .background
// Idle auto-rotation + smooth scroll-linked tilt/drift across X/Y/Z.
// ==========================================================================

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // fully transparent — starfield shows through
renderer.domElement.id = 'b2-canvas';

const mountPoint = document.querySelector('.background') || document.body;
mountPoint.appendChild(renderer.domElement);

// Lighting — light blue theme, plus a cyan rim light to match the site accent
const ambientLight = new THREE.AmbientLight(0x87ceeb, 0.8);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xadd8e6, 1.5, 1000);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);
const directionalLight = new THREE.DirectionalLight(0xb0e0e6, 1.0);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);
const rimLight = new THREE.PointLight(0x4cc9f0, 1.3, 1200);
rimLight.position.set(-15, -6, 8);
scene.add(rimLight);

// Load GLTF model
const loader = new THREE.GLTFLoader();
let b2Model;

// Base orientation (as originally calibrated: nose pointing up)
const BASE_ROTATION_X = 0;
const BASE_ROTATION_Z = Math.PI / 2;

loader.load(
    '3dmodels/b2.gltf',
    (gltf) => {
        b2Model = gltf.scene;
        b2Model.scale.set(0.2, 0.2, 0.2);
        b2Model.position.set(0, 0, 0);
        b2Model.rotation.x = BASE_ROTATION_X;
        b2Model.rotation.z = BASE_ROTATION_Z;
        scene.add(b2Model);

        b2Model.traverse((child) => {
            if (child.isMesh && (!child.material.map || child.material.map.image.currentSrc === '')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0x87cefa, metalness: 0.7, roughness: 0.3 });
            }
        });
    },
    undefined,
    (error) => {
        console.error('Failed to load GLTF model or associated files (e.g., scene.bin):', error);
    }
);

// Adjust camera position
camera.position.set(0, 0, 50);

// ---------------------------------------------------------------------
// Scroll progress (0 → 1 across the whole scrollable page)
// ---------------------------------------------------------------------
let scrollProgress = 0;
function updateScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// ---------------------------------------------------------------------
// Animation loop — idle spin + smoothly-eased scroll-linked tilt & drift
// ---------------------------------------------------------------------
let idleTime = 0;
const EASE = 0.045;

function animate() {
    requestAnimationFrame(animate);

    if (b2Model) {
        if (!reducedMotion) {
            idleTime += 0.01;
            b2Model.rotation.y += 0.0016; // continuous slow yaw
        }

        // Scroll-driven pitch (X) and roll (Z, layered on the base orientation)
        const targetX = reducedMotion ? BASE_ROTATION_X : BASE_ROTATION_X + (scrollProgress - 0.5) * 1.1;
        const targetZ = reducedMotion ? BASE_ROTATION_Z : BASE_ROTATION_Z + (scrollProgress - 0.5) * 0.8;
        b2Model.rotation.x += (targetX - b2Model.rotation.x) * EASE;
        b2Model.rotation.z += (targetZ - b2Model.rotation.z) * EASE;

        // Gentle drift: idle sine wander + scroll-linked horizontal travel
        const targetPosX = reducedMotion ? 0 : Math.sin(idleTime) * 4 + (scrollProgress - 0.5) * 14;
        const targetPosY = reducedMotion ? 0 : Math.cos(idleTime * 0.8) * 2.5;
        b2Model.position.x += (targetPosX - b2Model.position.x) * EASE;
        b2Model.position.y += (targetPosY - b2Model.position.y) * EASE;
    }

    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});