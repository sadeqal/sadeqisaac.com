document.addEventListener('DOMContentLoaded', function () {
    const cookiePrompt = document.getElementById('cookie-prompt');
    const acceptButton = document.getElementById('accept-cookies');
    const rejectButton = document.getElementById('reject-cookies');
    const form = document.getElementById('cookie-form');

    // Show the cookie prompt
    setTimeout(() => {
        cookiePrompt.classList.add('active');
    }, 500); // Delay to give a smooth appearance

    // Accept cookies
    acceptButton.addEventListener('click', () => {
        const selectedPreference = form.querySelector('input[name="cookie-preference"]:checked');
        if (selectedPreference) {
            console.log(`Cookies Accepted: ${selectedPreference.value}`);
            cookiePrompt.classList.remove('active');
            // Save preference to localStorage or handle backend logic
            localStorage.setItem('cookie-preference', selectedPreference.value);
        } else {
            console.error('No cookie preference selected.');
        }
    });

    // Reject cookies
    rejectButton.addEventListener('click', () => {
        console.log('Cookies Rejected');
        cookiePrompt.classList.remove('active');
        // Save rejection to localStorage or handle backend logic
        localStorage.setItem('cookie-preference', 'rejected');
    });
});

/****************************** SWITCH CONTENT ******************************/
document.querySelectorAll('.btn-enter').forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault(); // Prevent default link behavior
        const targetId = button.getAttribute('href').slice(1); // Get the target ID without '#'
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            // Scroll to the section smoothly
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/****************************** CAROUSEL ******************************/
// JavaScript for Carousel Functionality
document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.carousel');
    const dots = document.querySelectorAll('.dot');
    const items = document.querySelectorAll('.carousel-item');
    let currentSlide = 1; // Start with the middle item

    function updateCarousel() {
        const offset = (currentSlide - 1) * -100; // Center the active slide
        carousel.style.transform = `translateX(${offset}%)`;

        items.forEach((item, index) => {
            if (index === currentSlide) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });

    // Optional: Swipe functionality for touch devices
    let startX = 0;

    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    carousel.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        if (startX > endX + 50) {
            currentSlide = Math.min(currentSlide + 1, items.length - 1);
        } else if (startX < endX - 50) {
            currentSlide = Math.max(currentSlide - 1, 0);
        }
        updateCarousel();
    });

    updateCarousel(); // Initialize the carousel
});

