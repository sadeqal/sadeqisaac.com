// ==========================================================================
// PUBLICATIONS PAGE — year filter, abstract accordion, scroll reveal
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------------
       Year filter
    --------------------------------------------------------------- */
    const chips = document.querySelectorAll('.year-chip');
    const cards = document.querySelectorAll('.pub-card');

    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((c) => c.classList.remove('is-active'));
            chip.classList.add('is-active');

            const year = chip.dataset.year;
            cards.forEach((card) => {
                const matches = year === 'all' || card.dataset.year === year;
                card.classList.toggle('is-hidden', !matches);
            });
        });
    });

    /* ---------------------------------------------------------------
       Abstract accordion
    --------------------------------------------------------------- */
    document.querySelectorAll('.abstract-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.pub-card');
            const expanded = card.classList.toggle('is-expanded');
            btn.setAttribute('aria-expanded', String(expanded));
            btn.querySelector('.toggle-label').textContent = expanded ? 'Show less' : 'Read abstract';
        });
    });

    /* ---------------------------------------------------------------
       Scroll reveal
    --------------------------------------------------------------- */
    if ('IntersectionObserver' in window && !reducedMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        cards.forEach((card) => io.observe(card));
    } else {
        cards.forEach((card) => card.classList.add('is-visible'));
    }
});