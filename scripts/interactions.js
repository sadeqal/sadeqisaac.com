// ==========================================================================
// PAGE INTERACTIONS — hero fade, eye-blob cursor tracking, scroll reveals
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------------
       Hero content fades out as the user scrolls past the first view.
       The B2 model + starfield stay put as an ambient backdrop.
    --------------------------------------------------------------- */
    const heroFg = document.querySelector('.hero-foreground');
    if (heroFg) {
        const fadeDistance = Math.max(window.innerHeight * 0.85, 400);
        const onScrollFade = () => {
            const y = window.scrollY || document.documentElement.scrollTop;
            const progress = Math.min(Math.max(y / fadeDistance, 0), 1);
            heroFg.style.opacity = String(1 - progress);
            heroFg.style.transform = reducedMotion ? 'none' : `translateY(${progress * -40}px)`;
            heroFg.style.pointerEvents = progress > 0.85 ? 'none' : 'auto';
        };
        window.addEventListener('scroll', onScrollFade, { passive: true });
        onScrollFade();
    }

    /* ---------------------------------------------------------------
       Eye blobs — pupils track the cursor. On touch/coarse-pointer
       devices (no cursor), fall back to a gentle idle "look around"
       CSS animation instead.
    --------------------------------------------------------------- */
    const eyeBlobs = document.querySelectorAll('.eye-blob');
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (eyeBlobs.length) {
        if (!isCoarsePointer && !reducedMotion) {
            let mouseX = window.innerWidth / 2;
            let mouseY = window.innerHeight / 2;

            window.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            }, { passive: true });

            function trackEyes() {
                eyeBlobs.forEach((blob) => {
                    const pupil = blob.querySelector('.pupil');
                    if (!pupil) return;
                    const rect = blob.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const angle = Math.atan2(mouseY - cy, mouseX - cx);
                    const maxRadius = rect.width * 0.16;
                    const dist = Math.min(Math.hypot(mouseX - cx, mouseY - cy) / 10, maxRadius);
                    pupil.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
                });
                requestAnimationFrame(trackEyes);
            }
            requestAnimationFrame(trackEyes);
        } else {
            eyeBlobs.forEach((blob) => blob.classList.add('idle-look'));
        }
    }

    /* ---------------------------------------------------------------
       Scroll-reveal for Work / Education cards
    --------------------------------------------------------------- */
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reducedMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }
});