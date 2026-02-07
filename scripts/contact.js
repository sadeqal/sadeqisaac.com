// Contact Toolbar Toggle
document.getElementById('toggle-contact').addEventListener('click', () => {
    const menu = document.getElementById('contact-menu');
    const footer = document.querySelector('footer'); // footer reference
    const isActive = menu.classList.contains('show');
    
    if (!isActive) {
        // SHOW menu
        menu.classList.add('show');
        footer.classList.add('hidden'); // hide footer
        
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
        // HIDE menu
        menu.classList.remove('show');
        footer.classList.remove('hidden'); // show footer
        
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
    const footer = document.querySelector('footer'); // footer reference
    menu.classList.remove('show');
    footer.classList.remove('hidden'); // show footer again

    if (window.innerWidth <= 768) {
        menu.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('show');
        });
    }
});
