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


// JavaScript for Carousel Functionality
document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.carousel');
    const dots = document.querySelectorAll('.dot');
    const items = document.querySelectorAll('.carousel-item');
    let currentSlide = 0;

    function updateCarousel() {
        const offset = currentSlide * -60; // Adjust to match `flex: 0 0 60%` width
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
