(function () {
  "use strict";

  var STRINGS = {
    fa: { dir: "rtl", lang: "fa" },
    es: { dir: "ltr", lang: "es" }
  };

  function applyLanguage(lang) {
    var body = document.body;
    var html = document.documentElement;

    body.classList.remove("lang-fa", "lang-es");
    body.classList.add("lang-" + lang);
    html.setAttribute("lang", STRINGS[lang].lang);
    html.setAttribute("dir", STRINGS[lang].dir);

    document.querySelectorAll("[data-i18n-" + lang + "]").forEach(function (el) {
      el.textContent = el.getAttribute("data-i18n-" + lang);
    });

    document.querySelectorAll("[data-i18n-" + lang + "-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", el.getAttribute("data-i18n-" + lang + "-placeholder"));
    });

    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === lang ? "true" : "false");
    });

    try { localStorage.setItem("site-lang", lang); } catch (e) {}
  }

  document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLanguage(btn.getAttribute("data-lang"));
    });
  });

  // Restore saved language preference (defaults to the fa markup already in the page)
  var saved = null;
  try { saved = localStorage.getItem("site-lang"); } catch (e) {}
  if (saved === "es" || saved === "fa") applyLanguage(saved);

  // Mobile menu
  var menuToggle = document.getElementById("menuToggle");
  var header = document.getElementById("siteHeader");
  if (menuToggle && header) {
    menuToggle.addEventListener("click", function () {
      header.classList.toggle("nav-open");
    });
    header.querySelectorAll(".main-nav a").forEach(function (a) {
      a.addEventListener("click", function () { header.classList.remove("nav-open"); });
    });
  }

  // Appointment form -> Formspree (AJAX, no page reload)
  var form = document.getElementById("appointmentForm");
  var status = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var currentLang = document.body.classList.contains("lang-es") ? "es" : "fa";
      var okMsg = currentLang === "es"
        ? "Gracias. Tu mensaje ha sido enviado — te responderé pronto."
        : "پیام شما با موفقیت ارسال شد. به‌زودی پاسخ داده خواهد شد.";
      var errMsg = currentLang === "es"
        ? "No se pudo enviar el mensaje. Escribe directamente a mahdokht.fardii@gmail.com."
        : "ارسال پیام با خطا مواجه شد. لطفاً مستقیم به mahdokht.fardii@gmail.com ایمیل بزنید.";

      var actionUrl = form.getAttribute("action");
      if (!actionUrl || actionUrl.indexOf("YOUR_FORM_ID") !== -1) {
        status.textContent = currentLang === "es"
          ? "El formulario aún no está conectado. Escribe directamente por correo mientras tanto."
          : "فرم هنوز به سرویس ایمیل متصل نشده است. لطفاً فعلاً مستقیم ایمیل بزنید.";
        status.className = "form-status err";
        return;
      }

      var data = new FormData(form);
      fetch(actionUrl, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      }).then(function (response) {
        if (response.ok) {
          status.textContent = okMsg;
          status.className = "form-status ok";
          form.reset();
        } else {
          status.textContent = errMsg;
          status.className = "form-status err";
        }
      }).catch(function () {
        status.textContent = errMsg;
        status.className = "form-status err";
      });
    });
  }
})();