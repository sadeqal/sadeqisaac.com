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
