// Menu Toolbar Toggle
document.getElementById('toggle-menu').addEventListener('click', () => {
    const menu = document.getElementById('toolbar-items');
    const isActive = menu.classList.contains('active');
    
    if (!isActive) {
        menu.classList.add('active');
        // Animate items on mobile
        if (window.innerWidth <= 768) {
            const items = menu.querySelectorAll('.toolbar-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('active');
                }, index * 100);
            });
        }
    } else {
        menu.classList.remove('active');
        if (window.innerWidth <= 768) {
            menu.querySelectorAll('.toolbar-item').forEach(item => {
                item.classList.remove('active');
            });
        }
    }
});

// Close Menu Button
document.getElementById('close-menu').addEventListener('click', () => {
    const menu = document.getElementById('toolbar-items');
    menu.classList.remove('active');
    if (window.innerWidth <= 768) {
        menu.querySelectorAll('.toolbar-item').forEach(item => {
            item.classList.remove('active');
        });
    }
});