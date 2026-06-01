// 📱 MOBILE MENU TOGGLE
  document.getElementById('navToggle').addEventListener('click', function() {
    const navLinks = document.getElementById('navLinks');
    
    // We use 'open' here because your CSS (line 543) uses .nav-links.open
    navLinks.classList.toggle('open');
    
    // This toggles a class on the button itself in case you want to animate the 3 lines
    this.classList.toggle('active');
  });