// ============================================================================
// ACADEMIC CV - JavaScript
// PDF Export & Interactive Features
// ============================================================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeBackground();
    setupExportButton();
});

// ============================================================================
// BACKGROUND ANIMATION
// ============================================================================
function initializeBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 15;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.3 + 0.1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(76, 201, 240, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw subtle grid lines
        ctx.strokeStyle = 'rgba(76, 201, 240, 0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < canvas.width; i += 100) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 100) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        // Update and draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ============================================================================
// EXPORT BUTTON FUNCTIONALITY
// ============================================================================
function setupExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    const dropdownContent = document.getElementById('dropdownContent');

    if (!exportBtn) return;

    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContent.classList.toggle('show-dropdown');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.export-dropdown')) {
            dropdownContent.classList.remove('show-dropdown');
        }
    });
}

// ============================================================================
// PDF EXPORT FUNCTION
// ============================================================================
function exportCV() {
    const exportBtn = document.querySelector('.export-btn');
    const dropdownContent = document.getElementById('dropdownContent');
    const link = event.target.closest('a');

    // Mark as exporting
    link.classList.add('exporting');
    exportBtn.disabled = true;

    try {
        // Get the main CV content
        const cvContent = document.getElementById('cv-content').cloneNode(true);

        // Create PDF container
        const pdfContainer = document.createElement('div');
        pdfContainer.style.background = '#ffffff';
        pdfContainer.style.padding = '0';
        pdfContainer.style.width = '210mm';
        pdfContainer.style.fontFamily = 'Inter, sans-serif';
        pdfContainer.style.color = '#23303d';

        // Create PDF header
        const header = document.createElement('div');
        header.style.background = '#0b0f14';
        header.style.color = '#e8edf2';
        header.style.padding = '12mm 14mm';
        header.style.textAlign = 'center';
        header.style.borderBottom = '2px solid #4cc9f0';

        const name = document.createElement('h1');
        name.style.fontFamily = "'Space Grotesk', sans-serif";
        name.style.fontSize = '18pt';
        name.style.fontWeight = '700';
        name.style.margin = '0 0 2mm';
        name.style.color = '#ffffff';
        name.textContent = 'Sadeq Isaac, PhD';

        const role = document.createElement('p');
        role.style.fontFamily = "'JetBrains Mono', monospace";
        role.style.fontSize = '9pt';
        role.style.textTransform = 'uppercase';
        role.style.letterSpacing = '0.04em';
        role.style.color = '#4cc9f0';
        role.style.margin = '0 0 3mm';
        role.style.fontWeight = '600';
        role.textContent = 'Aerospace & Robotics Engineer';

        const contact = document.createElement('p');
        contact.style.fontSize = '8pt';
        contact.style.color = '#93a3b5';
        contact.style.lineHeight = '1.4';
        contact.style.margin = '0';
        contact.innerHTML = 'Madrid, Spain • sadeqisaac.com • sadeqalisaac@gmail.com<br/>Scholar: scholar.google.com/citations?user=FClYx9AAAAAJ';

        header.appendChild(name);
        header.appendChild(role);
        header.appendChild(contact);
        pdfContainer.appendChild(header);

        // Create PDF content area
        const contentArea = document.createElement('div');
        contentArea.style.padding = '12mm 14mm';
        contentArea.style.fontSize = '9pt';
        contentArea.style.lineHeight = '1.5';

        // Process sections
        const sections = cvContent.querySelectorAll('.cv-section');
        sections.forEach((section, idx) => {
            const pdfSection = document.createElement('div');
            pdfSection.style.marginBottom = '6mm';
            pdfSection.style.pageBreakInside = 'avoid';

            const heading = section.querySelector('h2');
            if (heading) {
                const pdfHeading = document.createElement('h3');
                pdfHeading.style.fontFamily = "'JetBrains Mono', monospace";
                pdfHeading.style.fontSize = '9.5pt';
                pdfHeading.style.fontWeight = '700';
                pdfHeading.style.textTransform = 'uppercase';
                pdfHeading.style.color = '#0b0f14';
                pdfHeading.style.borderBottom = '1.5px solid #4cc9f0';
                pdfHeading.style.paddingBottom = '2mm';
                pdfHeading.style.margin = '0 0 3mm';
                pdfHeading.style.letterSpacing = '0.08em';
                // Extract text without icons
                const headingText = heading.textContent.trim();
                pdfHeading.textContent = headingText;
                pdfSection.appendChild(pdfHeading);
            }

            // Handle education items
            const eduItems = section.querySelectorAll('.education-item');
            if (eduItems.length > 0) {
                eduItems.forEach(item => {
                    const eduDiv = createPDFEducationItem(item);
                    pdfSection.appendChild(eduDiv);
                });
            }

            // Handle publications
            const pubItems = section.querySelectorAll('.publication-item');
            if (pubItems.length > 0) {
                pubItems.forEach(item => {
                    const pubDiv = createPDFPublicationItem(item);
                    pdfSection.appendChild(pubDiv);
                });
            }

            // Handle timeline items
            const timelineItems = section.querySelectorAll('.timeline-item');
            if (timelineItems.length > 0) {
                timelineItems.forEach(item => {
                    const expDiv = createPDFExperienceItem(item);
                    pdfSection.appendChild(expDiv);
                });
            }

            // Handle publication subsections
            const pubSubsections = section.querySelectorAll('.pub-subsection');
            if (pubSubsections.length > 0) {
                pubSubsections.forEach(subsec => {
                    const subDiv = document.createElement('div');
                    subDiv.style.fontSize = '8.5pt';
                    subDiv.style.fontWeight = '600';
                    subDiv.style.color = '#4cc9f0';
                    subDiv.style.marginTop = '3mm';
                    subDiv.style.marginBottom = '2mm';
                    subDiv.textContent = subsec.textContent;
                    pdfSection.appendChild(subDiv);
                });
            }

            // Handle contact grid
            const contactItems = section.querySelectorAll('.contact-item');
            if (contactItems.length > 0) {
                contactItems.forEach(item => {
                    const contactDiv = document.createElement('div');
                    contactDiv.style.marginBottom = '2mm';
                    const label = item.querySelector('.contact-label');
                    const link = item.querySelector('a');
                    if (label && link) {
                        contactDiv.innerHTML = `<strong style="color: #4cc9f0; font-size: 7pt; font-weight: 600;">${label.textContent}</strong> <span style="font-size: 8pt;">${link.textContent}</span>`;
                        pdfSection.appendChild(contactDiv);
                    }
                });
            }

            if (pdfSection.children.length > 1 || pdfSection.querySelector('h3')) {
                contentArea.appendChild(pdfSection);
            }
        });

        pdfContainer.appendChild(contentArea);

        // Configure html2pdf options
        const opt = {
            margin: 0,
            filename: 'Sadeq_Isaac_Academic_CV.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // Generate PDF
        html2pdf().set(opt).from(pdfContainer).save().then(() => {
            // Reset button state
            link.classList.remove('exporting');
            exportBtn.disabled = false;
            dropdownContent.classList.remove('show-dropdown');
        }).catch(err => {
            console.error('PDF Export Error:', err);
            link.classList.remove('exporting');
            exportBtn.disabled = false;
            alert('Error generating PDF. Please try again.');
        });

    } catch (err) {
        console.error('Export Error:', err);
        link.classList.remove('exporting');
        exportBtn.disabled = false;
        alert('Error exporting CV. Please check the browser console.');
    }
}

function createPDFEducationItem(item) {
    const container = document.createElement('div');
    container.style.marginBottom = '3.5mm';
    container.style.pageBreakInside = 'avoid';

    const dateEl = item.querySelector('.date');
    const contentEl = item.querySelector('.content');

    if (dateEl && contentEl) {
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '1mm';
        header.style.gap = '3mm';

        const degree = document.createElement('strong');
        degree.style.fontSize = '8.8pt';
        degree.style.color = '#0b0f14';
        degree.style.flex = '1';
        degree.textContent = contentEl.querySelector('h3')?.textContent || '';

        const dates = document.createElement('span');
        dates.style.fontFamily = "'JetBrains Mono', monospace";
        dates.style.fontSize = '7.2pt';
        dates.style.color = '#4cc9f0';
        dates.style.fontWeight = '600';
        dates.style.whiteSpace = 'nowrap';
        dates.textContent = dateEl.textContent.trim();

        header.appendChild(degree);
        header.appendChild(dates);
        container.appendChild(header);

        const rows = contentEl.querySelectorAll('.edu-row');
        rows.forEach(row => {
            const p = document.createElement('p');
            p.style.fontSize = '7.6pt';
            p.style.color = '#445261';
            p.style.margin = '0.6mm 0';
            p.textContent = row.textContent.trim();
            container.appendChild(p);
        });
    }

    return container;
}

function createPDFPublicationItem(item) {
    const container = document.createElement('div');
    container.style.marginBottom = '3.5mm';
    container.style.pageBreakInside = 'avoid';
    container.style.paddingBottom = '2mm';
    container.style.borderBottom = '0.5px solid rgba(76, 201, 240, 0.1)';

    const title = item.querySelector('.pub-title');
    const details = item.querySelector('.pub-details');
    const authors = item.querySelector('.pub-authors');

    if (title) {
        const titleEl = document.createElement('strong');
        titleEl.style.fontSize = '8.5pt';
        titleEl.style.color = '#0b0f14';
        titleEl.style.display = 'block';
        titleEl.style.marginBottom = '1mm';
        titleEl.textContent = title.textContent.trim();
        container.appendChild(titleEl);
    }

    if (details) {
        const detailEl = document.createElement('div');
        detailEl.style.fontSize = '7.8pt';
        detailEl.style.color = '#1f8fb0';
        detailEl.style.marginBottom = '0.5mm';
        detailEl.style.fontWeight = '600';
        detailEl.textContent = details.textContent.trim();
        container.appendChild(detailEl);
    }

    if (authors) {
        const authorEl = document.createElement('div');
        authorEl.style.fontSize = '7.2pt';
        authorEl.style.color = '#445261';
        authorEl.style.fontStyle = 'italic';
        authorEl.style.marginTop = '0.5mm';
        authorEl.textContent = authors.textContent.trim();
        container.appendChild(authorEl);
    }

    return container;
}

function createPDFExperienceItem(item) {
    const container = document.createElement('div');
    container.style.marginBottom = '3.5mm';
    container.style.pageBreakInside = 'avoid';

    const dateEl = item.querySelector('.date');
    const contentEl = item.querySelector('.content');

    if (dateEl && contentEl) {
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '1mm';
        header.style.gap = '3mm';

        const company = document.createElement('strong');
        company.style.fontSize = '8.8pt';
        company.style.color = '#0b0f14';
        company.style.flex = '1';
        company.textContent = contentEl.querySelector('h3')?.textContent || '';

        const dates = document.createElement('span');
        dates.style.fontFamily = "'JetBrains Mono', monospace";
        dates.style.fontSize = '7.2pt';
        dates.style.color = '#4cc9f0';
        dates.style.fontWeight = '600';
        dates.style.whiteSpace = 'nowrap';
        dates.textContent = dateEl.textContent.trim();

        header.appendChild(company);
        header.appendChild(dates);
        container.appendChild(header);

        const roleEl = contentEl.querySelector('.role-title');
        if (roleEl) {
            const role = document.createElement('div');
            role.style.fontSize = '7.6pt';
            role.style.color = '#1f8fb0';
            role.style.fontWeight = '600';
            role.style.marginBottom = '1mm';
            role.textContent = roleEl.textContent.trim();
            container.appendChild(role);
        }

        const ul = contentEl.querySelector('ul');
        if (ul) {
            const list = document.createElement('ul');
            list.style.fontSize = '7.5pt';
            list.style.color = '#445261';
            list.style.margin = '0.5mm 0';
            list.style.paddingLeft = '3mm';
            list.style.listStyle = 'none';

            ul.querySelectorAll('li').forEach(li => {
                const item = document.createElement('li');
                item.style.marginBottom = '0.6mm';
                item.style.position = 'relative';
                item.style.paddingLeft = '2mm';
                item.textContent = li.textContent.trim();
                list.appendChild(item);
            });

            container.appendChild(list);
        }
    }

    return container;
}