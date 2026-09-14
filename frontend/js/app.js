/**
 * Point d'entrée du frontend : navigation entre vues, état global,
 * rafraîchissement des données depuis l'API au chargement et à chaque
 * changement de mois / création / édition / suppression.
 */

/**
 * Calcule le dernier jour réel d'un mois (ex : 30 pour septembre, 28/29 pour
 * février) au lieu de supposer "31" pour tous les mois — sinon une date
 * invalide comme "2026-09-31" est rejetée par le backend (erreur 422).
 */
function lastDayOfMonth(monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month, 0); // jour 0 du mois suivant = dernier jour du mois actuel
  return date.toISOString().slice(0, 10);
}

const state = { currentMonth: new Date().toISOString().slice(0, 7), allTransactions: [] };

/**
 * Mode sombre : appliqué via un attribut data-theme sur <html>, dont
 * dépendent toutes les variables CSS de couleur (voir style.css).
 * Le choix est mémorisé dans localStorage pour être conservé d'une
 * visite à l'autre.
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("theme-toggle").textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
  const saved = localStorage.getItem("pfm-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

function bindThemeToggle() {
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("pfm-theme", next);
  });
}

const VIEW_TITLES = {
  dashboard: "Tableau de bord",
  transactions: "Transactions",
  budget: "Budget",
  reports: "Rapports",
};

function showToast(message, kind = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${kind}`;
  setTimeout(() => toast.classList.add("hidden"), 2800);
}

/**
 * Message d'accueil qui s'adapte à l'heure de la journée, et mise à
 * jour de la carte "hero" en haut du tableau de bord (solde + résumé).
 */
function greetingText() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function updateHero(summary) {
  document.getElementById("hero-greeting").textContent = `${greetingText()} 👋`;
  const [year, month] = state.currentMonth.split("-");
  const label = new Date(`${year}-${month}-01`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  document.getElementById("hero-subtitle").textContent = `Voici ton résumé de ${label}`;
  document.getElementById("hero-balance").textContent = formatAmount(summary.balance);
}

/**
 * Compare le mois affiché au mois précédent, à partir des données déjà
 * récupérées pour le graphique d'évolution (pas d'appel API en plus).
 * Retourne null si le mois précédent n'est pas présent dans les données.
 */
function computeMonthComparison(evolution, currentMonth) {
  const idx = evolution.findIndex((p) => p.month === currentMonth);
  if (idx <= 0) return null;

  const current = evolution[idx];
  const previous = evolution[idx - 1];
  const pctChange = (curr, prev) => (prev === 0 ? null : Math.round(((curr - prev) / prev) * 1000) / 10);

  return {
    incomeChange: pctChange(current.income, previous.income),
    expensesChange: pctChange(current.expenses, previous.expenses),
  };
}

/**
 * Affiche un badge de tendance ("▲ 12% vs mois dernier"). goodDirection
 * précise si une hausse est une bonne nouvelle ("up", ex: revenus) ou
 * une mauvaise nouvelle ("down", ex: dépenses) pour choisir la couleur.
 */
function renderTrendBadge(elementId, changePercent, goodDirection) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (changePercent === null || changePercent === undefined) {
    el.textContent = "";
    el.className = "trend-badge hidden";
    return;
  }
  const isUp = changePercent >= 0;
  const isGood = goodDirection === "up" ? isUp : !isUp;
  el.textContent = `${isUp ? "▲" : "▼"} ${Math.abs(changePercent)}% vs mois dernier`;
  el.className = `trend-badge ${isGood ? "positive" : "negative"}`;
}

function showView(view) {
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });

  document.getElementById("view-title").textContent = VIEW_TITLES[view];
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("visible");
}

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => showView(link.dataset.view));
  });

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  document.getElementById("menu-toggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("visible");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
  });
}

function bindMonthPicker() {
  const input = document.getElementById("month-select");
  input.value = state.currentMonth;
  input.addEventListener("change", async () => {
    state.currentMonth = input.value;
    updateMonthLabel();
    await refreshAll();
  });
}

function updateMonthLabel() {
  const [year, month] = state.currentMonth.split("-");
  const label = new Date(`${year}-${month}-01`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  document.getElementById("current-month-label").textContent = label;
}

function bindBudgetForm() {
  document.getElementById("budget-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("budget-amount").value);
    try {
      await api.setBudget({ month_year: state.currentMonth, amount });
      showToast("Budget enregistré", "success");
      await refreshAll();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

async function refreshDashboard(summary, breakdown, evolution) {
  updateHero(summary);

  document.getElementById("stat-income").textContent = formatAmount(summary.total_income);
  document.getElementById("stat-expenses").textContent = formatAmount(summary.total_expenses);

  const comparison = computeMonthComparison(evolution, state.currentMonth);
  renderTrendBadge("income-trend", comparison?.incomeChange, "up");
  renderTrendBadge("expenses-trend", comparison?.expensesChange, "down");

  const percentLabel = document.getElementById("stat-budget-percent");
  const fill = document.getElementById("budget-progress-fill");
  if (summary.budget_used_percent === null || summary.budget_used_percent === undefined) {
    percentLabel.textContent = "Aucun budget";
    fill.style.width = "0%";
  } else {
    percentLabel.textContent = `${summary.budget_used_percent}%`;
    fill.style.width = `${Math.min(summary.budget_used_percent, 100)}%`;
    fill.classList.toggle("over-budget", summary.budget_used_percent > 100);
  }

  const noExpenseMsg = document.getElementById("no-expense-msg");
  if (breakdown.length === 0) {
    noExpenseMsg.classList.remove("hidden");
    destroyChart("chart-category");
  } else {
    noExpenseMsg.classList.add("hidden");
    renderCategoryChart("chart-category", breakdown);
  }

  renderEvolutionChart("chart-evolution", evolution);
  renderCategoryProgressList("category-progress-list", breakdown);

  const recent = state.allTransactions.slice(0, 5);
  renderTransactionsTable("recent-transactions", recent, { withActions: false });
}

async function refreshBudgetView(summary) {
  document.getElementById("budget-amount").value = summary.budget ?? "";
  document.getElementById("budget-view-amount").textContent =
    summary.budget != null ? formatAmount(summary.budget) : "Non défini";
  document.getElementById("budget-view-spent").textContent = formatAmount(summary.total_expenses);
  document.getElementById("budget-view-remaining").textContent =
    summary.budget != null ? formatAmount(summary.budget - summary.total_expenses) : "—";

  const fill = document.getElementById("budget-view-progress");
  const percent = summary.budget_used_percent || 0;
  fill.style.width = `${Math.min(percent, 100)}%`;
  fill.classList.toggle("over-budget", percent > 100);
}

async function refreshReports(breakdown, evolution) {
  if (breakdown.length) renderCategoryChart("chart-reports-category", breakdown);
  renderEvolutionChart("chart-reports-evolution", evolution);
}

async function refreshAll() {
  try {
    const [summary, breakdown, evolution, monthTransactions] = await Promise.all([
      api.getSummary(state.currentMonth),
      api.getByCategory(state.currentMonth),
      api.getMonthlyEvolution(6),
      api.listTransactions({
        date_from: `${state.currentMonth}-01`,
        date_to: lastDayOfMonth(state.currentMonth),
      }),
    ]);

    state.allTransactions = monthTransactions;

    await refreshDashboard(summary, breakdown, evolution);
    await refreshBudgetView(summary);
    await refreshReports(breakdown, evolution);
    renderTransactionsTable("transactions-table", state.allTransactions);
  } catch (err) {
    showToast(`Impossible de charger les données : ${err.message}`, "error");
  }
}

async function init() {
  initTheme();
  bindThemeToggle();
  populateCategorySelects();
  bindNavigation();
  bindMonthPicker();
  bindTransactionForm();
  bindFilters();
  bindBudgetForm();
  resetTransactionForm();
  updateMonthLabel();
  await refreshAll();
}

document.addEventListener("DOMContentLoaded", init);
