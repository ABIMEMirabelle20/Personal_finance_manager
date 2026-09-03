/**
 * Graphiques dessinés en SVG "maison" — aucune librairie externe.
 * Avantage : aucun risque de dépendance qui ne charge pas (CDN bloqué,
 * pas de connexion, environnement isolé...). Les fonctions gardent les
 * mêmes noms/signatures qu'avant pour ne rien changer dans app.js.
 */

const CATEGORY_COLORS = {
  alimentation: "#fb7360",
  logement: "#fbbf24",
  transport: "#38bdf8",
  etudes: "#a78bfa",
  loisirs: "#34d399",
  sante: "#fb7185",
  abonnements: "#60a5fa",
  autres: "#94a3b8",
  revenu: "#10b981",
};

function destroyChart(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";
}

/**
 * Graphique "donut" (répartition des dépenses par catégorie).
 * Technique : un cercle SVG par catégorie, avec stroke-dasharray pour
 * ne dessiner que la portion correspondant à son pourcentage, et un
 * stroke-dashoffset cumulé pour enchaîner les segments les uns après les autres.
 */
function renderCategoryChart(containerId, breakdown) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!breakdown.length) {
    el.innerHTML = "";
    return;
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = breakdown
    .map((item) => {
      const dash = (item.percent / 100) * circumference;
      const color = CATEGORY_COLORS[item.category] || "#8b949e";
      const circle = `<circle cx="90" cy="90" r="${radius}" fill="none" stroke="${color}"
        stroke-width="26" stroke-dasharray="${dash} ${circumference - dash}"
        stroke-dashoffset="${-offset}" />`;
      offset += dash;
      return circle;
    })
    .join("");

  const legend = breakdown
    .map((item) => {
      const color = CATEGORY_COLORS[item.category] || "#8b949e";
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${color}"></span>
          <span>${categoryLabel(item.category)}</span>
          <span class="legend-value">${item.percent}%</span>
        </div>`;
    })
    .join("");

  el.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 180 180" class="donut-svg">
        <g transform="rotate(-90 90 90)">${segments}</g>
      </svg>
      <div class="donut-legend">${legend}</div>
    </div>`;
}

/**
 * Graphique en barres (revenus vs dépenses par mois).
 * Technique : des <div> avec une hauteur en % calculée par rapport
 * à la plus grande valeur de la série (flexbox + hauteurs en %,
 * pas besoin de SVG ici, et ça reste responsive).
 */
function renderEvolutionChart(containerId, points) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!points.length) {
    el.innerHTML = `<p class="empty-msg">Pas encore assez de données.</p>`;
    return;
  }

  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expenses]));

  const bars = points
    .map((p) => {
      const [year, month] = p.month.split("-");
      return `
        <div class="bar-group">
          <div class="bar-pair">
            <div class="bar income" style="height:${(p.income / max) * 100}%" title="Revenus : ${p.income.toFixed(2)} €"></div>
            <div class="bar expense" style="height:${(p.expenses / max) * 100}%" title="Dépenses : ${p.expenses.toFixed(2)} €"></div>
          </div>
          <span class="bar-label">${month}/${year.slice(2)}</span>
        </div>`;
    })
    .join("");

  el.innerHTML = `
    <div class="bar-chart-legend">
      <span><span class="legend-dot" style="background:#3fb950"></span>Revenus</span>
      <span><span class="legend-dot" style="background:#f85149"></span>Dépenses</span>
    </div>
    <div class="bar-chart">${bars}</div>`;
}
