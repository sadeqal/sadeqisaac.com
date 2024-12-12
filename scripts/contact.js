document.getElementById('toggle-contact').addEventListener('click', () => {
    const menu = document.getElementById('contact-menu');
    const isVisible = menu.style.display === 'flex';
    menu.style.display = isVisible ? 'none' : 'flex';
});