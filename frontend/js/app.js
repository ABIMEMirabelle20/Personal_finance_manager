/**
 * Point d'entrée du frontend : navigation entre vues, état global,
 * rafraîchissement des données depuis l'API au chargement et à chaque
 * changement de mois / création / édition / suppression.
 */

const state = {
  currentMonth: new Date().toISOString().slice(0, 7), // "YYYY-MM"
  allTransactions: [],
};

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

function showView(view) {
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });

  document.getElementById("view-title").textContent = VIEW_TITLES[view];
  document.getElementById("sidebar").classList.remove("open");
}

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => showView(link.dataset.view));
  });

  document.getElementById("menu-toggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
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
  document.getElementById("stat-income").textContent = formatAmount(summary.total_income);
  document.getElementById("stat-expenses").textContent = formatAmount(summary.total_expenses);
  document.getElementById("stat-balance").textContent = formatAmount(summary.balance);

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
        date_to: `${state.currentMonth}-31`,
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
