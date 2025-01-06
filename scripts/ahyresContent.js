// Function to scroll to the next content section smoothly
function scrollToNextSection(currentSection) {
    // Get the next section element (sibling of the current section)
    const nextSection = currentSection.nextElementSibling;
    
    // Check if the next section exists, then scroll to it
    if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.error("No next section found to scroll to.");
    }
}

// Add event listeners to all "Switch View" buttons
document.querySelectorAll('.btn-enter').forEach(button => {
    button.addEventListener('click', function() {
        // Get the current section (parent of the button)
        const currentSection = this.closest('section');
        
        // Log to check if the section is found
        if (currentSection) {
            console.log("Current section found:", currentSection);  // Debugging
            // Scroll to the next section
            scrollToNextSection(currentSection);
        } else {
            console.error("Could not find the section containing the button.");
        }
    });
});

// Get the Ahyres logo (menu toggle) and the drawer
const menuToggle = document.getElementById('menu-toggle');
const drawer = document.querySelector('.drawer');

// Toggle the drawer (sidebar) visibility when the logo is clicked
menuToggle.addEventListener('click', function() {
    drawer.classList.toggle('open');  // Adds/removes the "open" class
});

// Swipe to close functionality
let touchStartX = 0;
let touchEndX = 0;

drawer.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;  // Track where the touch starts
});

drawer.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;  // Track where the touch ends

    // If the touch is swiping from right to left, close the drawer
    if (touchEndX < touchStartX) {
        drawer.classList.remove('open');  // Close the drawer
    }
});
