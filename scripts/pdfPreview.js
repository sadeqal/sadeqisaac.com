document.addEventListener("DOMContentLoaded", () => {
    const previewButtons = document.querySelectorAll('.pdf-preview-button');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(async (entry) => {
            if (entry.isIntersecting) {
                const button = entry.target;
                const pdfPath = button.getAttribute('data-pdf');
                if (!pdfPath) {
                    console.warn('Skipping preview generation: No PDF path specified for preview button:', button);
                    observer.unobserve(button);
                    return;
                }
                if (button.dataset.previewLoaded) return;

                try {
                    const pdf = await pdfjsLib.getDocument(pdfPath).promise;
                    const page = await pdf.getPage(1);
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    const viewport = page.getViewport({ scale: 1.0 });

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    }).promise;

                    const imageDataUrl = canvas.toDataURL('image/png');
                    button.style.backgroundImage = `url(${imageDataUrl})`;
                    button.dataset.previewLoaded = true;
                } catch (error) {
                    console.error('Error generating PDF preview for', pdfPath, ':', error);
                    button.style.backgroundImage = `url('../icons/fallback.png')`;
                    button.dataset.previewLoaded = true;
                }

                observer.unobserve(button);
            }
        });
    }, { threshold: 0.1 });

    previewButtons.forEach(button => observer.observe(button));
});