// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling para enlaces de navegación
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Menú hamburguesa para mobile
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // Cerrar menú al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
    
    // --- Formulario de contacto con envío profesional ---
    document.getElementById('contact-form').addEventListener('submit', function (event) {
        event.preventDefault(); // Evitar recarga del formulario
        
        const form = event.target;
        
        // Enviar datos a Formspree (o tu backend)
        fetch("https://formspree.io/f/your-form-id", {  // <-- reemplaza con tu endpoint real
            method: "POST",
            body: new FormData(form),
            headers: { "Accept": "application/json" }
        })
        .then(response => {
            if (response.ok) {
                form.reset(); // Limpiar campos
                
                // Crear mensaje de confirmación profesional
                const message = document.createElement('div');
                message.textContent = "Gracias por su mensaje, le responderemos lo antes posible.";
                message.style.color = "#1b8a3e";
                message.style.fontWeight = "600";
                message.style.textAlign = "center";
                message.style.marginTop = "20px";
                message.style.background = "#e9f7ef";
                message.style.padding = "12px 20px";
                message.style.borderRadius = "6px";
                message.style.border = "1px solid #c8e6c9";
                
                // Reemplazar formulario por mensaje
                form.style.display = "none";
                form.parentNode.appendChild(message);
            } else {
                alert("Hubo un error al enviar el formulario. Por favor, inténtelo de nuevo.");
            }
        })
        .catch(error => {
            alert("Hubo un error al enviar el formulario. Por favor, inténtelo de nuevo.");
            console.error(error);
        });
    });
    
    // Ajuste para header fijo en scroll
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(15, 23, 42, 0.98)';
        } else {
            header.style.background = 'rgba(15, 23, 42, 0.95)';
        }
    });
});