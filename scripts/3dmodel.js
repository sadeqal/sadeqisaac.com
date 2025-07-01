// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000); // Increased far plane
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add stronger lighting with lighter blue theme
const ambientLight = new THREE.AmbientLight(0x87ceeb, 0.8); // Light sky blue ambient
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xadd8e6, 1.5, 1000); // Light blue
pointLight.position.set(10, 10, 10);
scene.add(pointLight);
const directionalLight = new THREE.DirectionalLight(0xb0e0e6, 1.0); // Powder blue
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

// Load GLTF model
const loader = new THREE.GLTFLoader();
let b2Model;
loader.load(
    '3dmodels/b2.gltf', // Path to B2 GLTF file
    (gltf) => {
        b2Model = gltf.scene;
        // Scale down to realistic size
        b2Model.scale.set(0.2, 0.2, 0.2); // Reduced size
        // Center the model
        b2Model.position.set(0, 0, 0);
        // Adjust orientation to set nose toward top (positive Y)
        b2Model.rotation.x = 0; // Reset to default, adjust if needed
        b2Model.rotation.z = Math.PI / 2; // Rotate 90 degrees around Z to align nose upward
        scene.add(b2Model);

        // Debug: Log model structure and bounding box
        console.log('B2 model loaded:', b2Model);
        const box = new THREE.Box3().setFromObject(b2Model);
        console.log('Model bounding box:', box.min, box.max);
        console.log('Model size:', {
            x: box.max.x - box.min.x,
            y: box.max.y - box.min.y,
            z: box.max.z - box.min.z
        });

        // Apply fallback material with lighter blue theme
        b2Model.traverse((child) => {
            if (child.isMesh && (!child.material.map || child.material.map.image.currentSrc === '')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0x87cefa, metalness: 0.7, roughness: 0.3 }); // Light blue with metallic finish
            }
        });
    },
    (xhr) => {
        console.log(`Loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    },
    (error) => {
        console.error('Failed to load GLTF model or associated files (e.g., scene.bin):', error);
        alert('Error loading B2 model. Ensure b2.gltf and scene.bin are in the models/ folder. Check console.');
    }
);

// Adjust camera position
camera.position.set(0, 0, 50); // Position to view the scaled model

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (b2Model) {
        // Rotate around the longitudinal X-axis with slower velocity
        b2Model.rotation.y += 0.002; // Reduced rotation speed from 0.01 to 0.002
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