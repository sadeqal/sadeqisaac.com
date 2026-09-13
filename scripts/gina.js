/* ==========================================================================
   GINA Dental Studio — interactions
   ========================================================================== */
(() => {
  "use strict";

  /* ---------- Scroll progress bar ---------- */
  const progressBar = document.getElementById("scroll-progress");
  const navbar = document.getElementById("navbar");
  const backToTop = document.getElementById("back-to-top");

  const onScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + "%";

    if (navbar) navbar.classList.toggle("scrolled", scrollTop > 20);
    if (backToTop) backToTop.classList.toggle("show", scrollTop > 500);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Custom cursor (desktop only) ---------- */
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (hasFinePointer && cursorDot && cursorRing) {
    let ringX = 0, ringY = 0, targetX = 0, targetY = 0;

    window.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      cursorDot.style.left = targetX + "px";
      cursorDot.style.top = targetY + "px";
    });

    const animateRing = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      cursorRing.style.left = ringX + "px";
      cursorRing.style.top = ringY + "px";
      requestAnimationFrame(animateRing);
    };
    requestAnimationFrame(animateRing);

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursorRing.classList.add("grow"));
      el.addEventListener("mouseleave", () => cursorRing.classList.remove("grow"));
    });
  }

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");

  navToggle?.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      navToggle?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Nav dropdown (e.g. "Ubicaciones") ---------- */
  document.querySelectorAll(".nav-dropdown-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const parent = btn.closest(".nav-item-dropdown");
      const isOpen = parent.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  });
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".nav-item-dropdown.open").forEach((dropdown) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("open");
        dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- Counters ---------- */
  const counters = document.querySelectorAll(".counter");
  const animateCounter = (el) => {
    const target = Number(el.dataset.target || 0);
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString("es-ES");
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => counterObserver.observe(c));
  }

  /* Smile score ring fill */
  const ringFg = document.querySelector(".ring-fg");
  if (ringFg && "IntersectionObserver" in window) {
    const ringObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ringFg.style.strokeDashoffset = "8";
            ringObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    ringObserver.observe(ringFg);
  }

  /* ---------- Testimonial carousel ---------- */
  const track = document.getElementById("testimonial-track");
  const dotsWrap = document.getElementById("testimonial-dots");
  const prevBtn = document.getElementById("test-prev");
  const nextBtn = document.getElementById("test-next");

  if (track) {
    const slides = track.querySelectorAll(".testimonial");
    let current = 0;
    let autoplayId = null;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Ir a la reseña ${i + 1}`);
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    const dots = dotsWrap.querySelectorAll("button");

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayId = setInterval(() => goTo(current + 1), 5500);
    }
    function stopAutoplay() {
      if (autoplayId) clearInterval(autoplayId);
    }

    prevBtn?.addEventListener("click", () => { goTo(current - 1); startAutoplay(); });
    nextBtn?.addEventListener("click", () => { goTo(current + 1); startAutoplay(); });

    track.closest(".testimonial-wrap")?.addEventListener("mouseenter", stopAutoplay);
    track.closest(".testimonial-wrap")?.addEventListener("mouseleave", startAutoplay);

    goTo(0);
    startAutoplay();
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const question = item.querySelector(".faq-q");
    const answer = item.querySelector(".faq-a");

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      document.querySelectorAll(".faq-item.open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".faq-a").style.maxHeight = null;
        }
      });

      item.classList.toggle("open", !isOpen);
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + "px" : null;
    });
  });

  /* ---------- Contact form (demo only, no backend) ---------- */
  const form = document.getElementById("contact-form");
  const formNote = document.getElementById("form-note");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    formNote.textContent = "¡Gracias! Te escribiremos en menos de 24h para confirmar tu cita.";
    form.reset();
  });
})();
