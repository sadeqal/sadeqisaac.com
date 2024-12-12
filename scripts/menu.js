document.getElementById('toggle-menu').addEventListener('click', () => {
    const menu = document.getElementById('toolbar-items');
    const isVisible = menu.style.display === 'flex';
    menu.style.display = isVisible ? 'none' : 'flex';
});
