const types = ['star', 'blue', 'yellow', 'red', 'purple', 'milkyway'];

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const background = document.querySelector('.background');
    if (!background) {
        console.error('Background element not found');
        return;
    }

    const debrisCount = window.innerWidth < 768 ? 100 : 300;

    for (let i = 0; i < debrisCount; i++) {
        const debris = document.createElement('div');
        const randomType = types[Math.floor(Math.random() * types.length)];
        debris.classList.add('debris', randomType);
        debris.style.top = Math.random() * 100 + 'vh';
        debris.style.left = Math.random() * 100 + 'vw';
        debris.style.animationDelay = Math.random() * 50 + 's';
        debris.style.animationDuration = Math.random() * 200 + 100 + 's';
        background.appendChild(debris);
    }

    window.addEventListener('resize', debounce(() => {
        document.querySelectorAll('.debris').forEach(debris => debris.remove());
        const updatedDebrisCount = window.innerWidth < 768 ? 100 : 300;
        for (let i = 0; i < updatedDebrisCount; i++) {
            const debris = document.createElement('div');
            const randomType = types[Math.floor(Math.random() * types.length)];
            debris.classList.add('debris', randomType);
            debris.style.top = Math.random() * 100 + 'vh';
            debris.style.left = Math.random() * 100 + 'vw';
            debris.style.animationDelay = Math.random() * 50 + 's';
            debris.style.animationDuration = Math.random() * 200 + 100 + 's';
            background.appendChild(debris);
        }
    }, 200));
});