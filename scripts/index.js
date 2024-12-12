document.getElementById('arrow').addEventListener('click', () => {
    const mainContent = document.getElementById('firstView-content');
    const newContent = document.getElementById('aboutMe-content');

    // Fade out the current content
    mainContent.classList.add('fade-out');

    // After the fade-out animation, show the new content
    setTimeout(() => {
        mainContent.style.display = 'none';
        newContent.classList.add('fade-in');
        newContent.classList.remove('hidden');
    }, 500); // Matches the transition duration in CSS
});
