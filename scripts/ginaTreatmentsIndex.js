/* ==========================================================================
   Render treatments index grid + category filters
   ========================================================================== */
(() => {
  "use strict";
  const grid = document.getElementById("treat-grid");
  const filterRow = document.getElementById("filter-row");
  if (!grid || typeof GINA_TREATMENTS === "undefined") return;

  const categories = ["Todos", ...new Set(GINA_TREATMENTS.map((t) => t.category))];
  let activeCategory = "Todos";

  function renderChips() {
    filterRow.innerHTML = "";
    categories.forEach((cat) => {
      const chip = document.createElement("button");
      chip.className = "filter-chip" + (cat === activeCategory ? " active" : "");
      chip.textContent = cat;
      chip.addEventListener("click", () => {
        activeCategory = cat;
        renderChips();
        renderGrid();
      });
      filterRow.appendChild(chip);
    });
  }

  function renderGrid() {
    const items = activeCategory === "Todos"
      ? GINA_TREATMENTS
      : GINA_TREATMENTS.filter((t) => t.category === activeCategory);

    grid.innerHTML = items.map((t) => `
      <article class="card-treat" data-reveal>
        <i class="fa-solid ${t.icon}" aria-hidden="true"></i>
        <span class="filter-chip" style="pointer-events:none;display:inline-block;margin-bottom:14px;padding:4px 12px;font-size:0.72rem;">${t.category}</span>
        <h3>${t.name}</h3>
        <p>${t.tagline}</p>
        <a href="gina-tratamiento.html?t=${t.slug}">Ver tratamiento <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
      </article>
    `).join("");

    grid.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("in-view"));
  }

  renderChips();
  renderGrid();
})();
