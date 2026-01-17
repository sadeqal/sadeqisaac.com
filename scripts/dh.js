// === DOM READY ===
document.addEventListener('DOMContentLoaded', function() {
    initHeader();
    initNavScroll();
    initContactForm();
    initCookies();
    initMobileMenu();
});


// === BACKGROUND DEBRIS ===
const debrisField = document.querySelector('.debris-field');
/* Density control (bigger number = fewer particles) */
const DENSITY = 10000;
const COUNT = Math.floor(
    (window.innerWidth * window.innerHeight) / DENSITY
);

for (let i = 0; i < COUNT; i++) {
    const d = document.createElement('span');
    d.className = 'debris';
    
    /* Size */
    const width = Math.random() * 120 + 20;
    d.style.setProperty('--w', `${width}px`);
    d.style.setProperty('--h', Math.random() < 0.2 ? '3px' : '2px');
    
    /* Timing */
    d.style.setProperty('--d', `${Math.random() * 6 + 6}s`);
    d.style.setProperty('--delay', `${Math.random() * -10}s`);
    
    /* Opacity */
    d.style.setProperty('--o', (Math.random() * 0.45 + 0.25).toFixed(2));
    
    /* 🔑 FULL-SCREEN RANDOM SPAWN */
    const x0 = Math.random() * 160 - 30;   // -30vw → 130vw
    const y0 = Math.random() * 160 - 30;   // -30vh → 130vh
    
    /* 🔑 FIXED 45° DIAGONAL TRAVEL */
    const travel = 180; // how far it travels across screen
    
    d.style.setProperty('--x0', `${x0}vw`);
    d.style.setProperty('--y0', `${y0}vh`);
    d.style.setProperty('--x1', `${x0 + travel}vw`);
    d.style.setProperty('--y1', `${y0 - travel}vh`);
    
    debrisField.appendChild(d);
}

// === HEADER SCROLL EFFECT ===
function initHeader() {
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// === NAVIGATION ===
function initNavScroll() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active nav link
                document.querySelector('.nav-link.active')?.classList.remove('active');
                link.classList.add('active');
                
                // Close mobile menu
                document.querySelector('.nav-list')?.classList.remove('active');
            }
        });
    });
    
    // Update active link on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });
}

// === MOBILE MENU ===
function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const navList = document.querySelector('.nav-list');

  toggle.addEventListener('click', () => {
    navList.classList.toggle('active');
    toggle.querySelector('i').classList.toggle('fa-bars');
    toggle.querySelector('i').classList.toggle('fa-times');
  });

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navList.contains(e.target)) {
      navList.classList.remove('active');
    }
  });
}


// === CONTACT FORM ===
function initContactForm() {
    const form = document.querySelector('.contact-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Simulate form submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            alert('¡Gracias! Tu solicitud de asesoría ha sido enviada. Te contactaremos en 24h.');
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    });
}

// === COOKIES ===
function initCookies() {
    const prompt = document.getElementById('cookie-prompt');
    const acceptBtn = document.getElementById('accept-cookies');
    const rejectBtn = document.getElementById('reject-cookies');
    
    // Check if cookies already accepted
    if (localStorage.getItem('cookies-accepted')) {
        return;
    }
    
    // Show prompt after delay
    setTimeout(() => {
        prompt.classList.add('active');
    }, 2000);
    
    acceptBtn.addEventListener('click', () => {
        const selected = document.querySelector('input[name="cookies"]:checked').value;
        localStorage.setItem('cookies-accepted', 'true');
        localStorage.setItem('cookie-preference', selected);
        prompt.classList.remove('active');
    });
    
    rejectBtn.addEventListener('click', () => {
        localStorage.setItem('cookies-accepted', 'true');
        localStorage.setItem('cookie-preference', 'essential');
        prompt.classList.remove('active');
    });
}

// === WINDOW RESIZE HANDLER ===
window.addEventListener('resize', () => {
    // Reinitialize carousel on resize if needed
});