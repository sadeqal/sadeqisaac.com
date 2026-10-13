// FIGHTER VTOL CONFIGURATION MANUAL - interactions

document.addEventListener('DOMContentLoaded', () => {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const sections = document.querySelectorAll('.section[id]');

    // SIDEBAR NAVIGATION
    sidebarItems.forEach(item => {
        item.addEventListener('click', function () {
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (!section) return;

            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // UPDATE SIDEBAR ON SCROLL
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150) {
                current = section.getAttribute('id');
            }
        });

        if (current) {
            sidebarItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-section') === current) {
                    item.classList.add('active');
                }
            });
        }
    });

    // PROGRESS BAR
    const progressBar = document.getElementById('progress-bar');
    function updateProgress() {
        if (!progressBar) return;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const progress = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
    }
    window.addEventListener('scroll', updateProgress);
    updateProgress();
});

// COPY CODE FUNCTIONALITY
function copyCode(button) {
    const codeContent = button.parentElement.nextElementSibling.textContent;
    navigator.clipboard.writeText(codeContent).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ COPIED';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}

// COLLAPSIBLE FUNCTIONALITY
function toggleCollapsible(element) {
    element.classList.toggle('open');
    const content = element.nextElementSibling;
    content.classList.toggle('open');
}

// PDF EXPORT
function exportPDF() {
    const element = document.querySelector('.main-content');
    const opt = {
        margin: 10,
        filename: 'Fighter_VTOL_ArduPilot_Configuration_Manual.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header');
    sidebar.style.display = 'none';
    header.style.display = 'none';

    html2pdf().set(opt).from(element).save().then(() => {
        sidebar.style.display = '';
        header.style.display = '';
    });
}

// TOGGLE SIDEBAR ON MOBILE
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = sidebar.style.display === 'none' ? '' : 'none';
}
