/* ==========================================================================
   Render a single treatment detail page from the query string (?t=slug)
   ========================================================================== */
(() => {
  "use strict";
  if (typeof GINA_TREATMENTS === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("t") || GINA_TREATMENTS[0].slug;
  const treatment = GINA_TREATMENTS.find((t) => t.slug === slug) || GINA_TREATMENTS[0];

  document.title = `${treatment.name} — Clínica Dental SIRO`;

  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const setHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  setText("t-crumb", treatment.name);
  setHTML("t-icon", `<i class="fa-solid ${treatment.icon}" aria-hidden="true"></i>`);
  setText("t-eyebrow", treatment.category);
  setText("t-name", treatment.name);
  setText("t-tagline", treatment.summary);

  setHTML("t-body", `
    <h2>Sobre este tratamiento</h2>
    ${treatment.paragraphs.map((p) => `<p>${p}</p>`).join("")}
    <h2>Beneficios principales</h2>
    <ul class="treat-benefits">
      ${treatment.benefits.map((b) => `<li><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>${b}</span></li>`).join("")}
    </ul>
  `);

  setHTML("t-sidebar", `
    <div class="treat-sidebar-item"><span>Duración estimada</span><span>${treatment.duration}</span></div>
    <div class="treat-sidebar-item"><span>Sesiones</span><span>${treatment.sessions}</span></div>
    <div class="treat-sidebar-item"><span>Recomendado para</span><span>${treatment.idealFor}</span></div>
  `);

  const related = GINA_TREATMENTS.filter((t) => t.slug !== treatment.slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  setHTML("t-related", related.map((t) => `
    <article class="card-treat">
      <i class="fa-solid ${t.icon}" aria-hidden="true"></i>
      <h3>${t.name}</h3>
      <p>${t.tagline}</p>
      <a href="gina-tratamiento.html?t=${t.slug}">Ver tratamiento <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </article>
  `).join(""));
})();
