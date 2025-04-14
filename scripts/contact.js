// Contact Toolbar Toggle
document.getElementById('toggle-contact').addEventListener('click', () => {
    const menu = document.getElementById('contact-menu');
    const isActive = menu.classList.contains('show');
    
    if (!isActive) {
        menu.classList.add('show');
        // Animate items on mobile
        if (window.innerWidth <= 768) {
            const items = menu.querySelectorAll('.contact-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('show');
                }, index * 100);
            });
        }
    } else {
        menu.classList.remove('show');
        if (window.innerWidth <= 768) {
            menu.querySelectorAll('.contact-item').forEach(item => {
                item.classList.remove('show');
            });
        }
    }
});

// Close Contact Button
document.getElementById('close-contact').addEventListener('click', () => {
    const menu = document.getElementById('contact-menu');
    menu.classList.remove('show');
    if (window.innerWidth <= 768) {
        menu.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('show');
        });
    }
});