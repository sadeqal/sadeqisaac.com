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
