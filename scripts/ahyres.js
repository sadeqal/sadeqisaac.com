// Background
const background = document.querySelector('#background');
const debrisCount = 300;

// Canvas
const canvas = document.getElementById('droneCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Generate debris
for (let i = 0; i < debrisCount; i++) {
    const debris = document.createElement('div');

    // Assign random type
    const types = ['star', 'blue', 'orange', 'purple', 'green', 'milkyway'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    debris.classList.add('debris', randomType);

    // Randomize position
    debris.style.top = Math.random() * 100 + 'vh';
    debris.style.left = Math.random() * 100 + 'vw';

    // Randomize animation delay and duration for variety
    debris.style.animationDelay = Math.random() * 50 + 's';
    debris.style.animationDuration = Math.random() * 200 + 100 + 's';

    background.appendChild(debris);
}

// Array of images (add your downloaded drone and firmware image paths here)
const droneImages = [
    '../icons/drone.png',
    '../icons/fw.png',
];

// Drone class
class FlyingObject {
    constructor(x, y, speedX, speedY, imageSrc) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.image = new Image();
        this.image.src = imageSrc;
        this.size = Math.random() * 30 + 20; // Random size between 20 and 50px
    }
    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width - this.size) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height - this.size) this.speedY *= -1;
    }
}

// Create multiple flying objects
const flyingObjects = [];
const numObjects = 15; // Adjust the number of flying objects

for (let i = 0; i < numObjects; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const speedX = (Math.random() - 0.5) * 4; // Speed range: -2 to 2
    const speedY = (Math.random() - 0.5) * 4; // Speed range: -2 to 2
    const imageSrc = droneImages[Math.floor(Math.random() * droneImages.length)];
    flyingObjects.push(new FlyingObject(x, y, speedX, speedY, imageSrc));
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flyingObjects.forEach((obj) => {
        obj.move();
        obj.draw();
    });
    requestAnimationFrame(animate);
}

animate();
    
