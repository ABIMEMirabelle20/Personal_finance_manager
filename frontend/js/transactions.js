/**
 * Tout ce qui concerne le CRUD "transactions" côté frontend :
 * remplissage du <select> catégories, rendu du tableau, gestion du
 * formulaire (création + édition), suppression.
 */

function populateCategorySelects() {
  const selects = [document.getElementById("tx-category"), document.getElementById("filter-category")];
  selects.forEach((select) => {
    if (!select) return;
    const keepFirst = select.id === "filter-category";
    const options = CATEGORIES.filter((c) => (keepFirst ? true : c.value !== "revenu"))
      .map((c) => `<option value="${c.value}">${c.label}</option>`)
      .join("");
    select.insertAdjacentHTML("beforeend", options);
  });
}

function formatAmount(amount) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

function renderTransactionsTable(containerId, transactions, { withActions = true } = {}) {
  const container = document.getElementById(containerId);
  if (!transactions.length) {
    container.innerHTML = `<p class="empty-msg">Aucune transaction à afficher.</p>`;
    return;
  }

  const rows = transactions
    .map((t) => {
      const amountClass = t.type === "income" ? "amount-income" : "amount-expense";
      const sign = t.type === "income" ? "+" : "-";
      const actions = withActions
        ? `<td class="row-actions">
             <button data-edit="${t.id}" title="Modifier">✏️</button>
             <button data-delete="${t.id}" title="Supprimer">🗑️</button>
           </td>`
        : "";
      return `
        <tr>
          <td>${t.date}</td>
          <td>${t.description || "—"}</td>
          <td>${categoryLabel(t.category)}</td>
          <td class="${amountClass}">${sign} ${formatAmount(t.amount)}</td>
          ${actions}
        </tr>`;
    })
    .join("");

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Description</th><th>Catégorie</th><th>Montant</th>${withActions ? "<th></th>" : ""}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  if (withActions) {
    container.querySelectorAll("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () => startEditTransaction(btn.dataset.edit))
    );
    container.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", () => confirmDeleteTransaction(btn.dataset.delete))
    );
  }
}

function resetTransactionForm() {
  const form = document.getElementById("transaction-form");
  form.reset();
  document.getElementById("tx-id").value = "";
  document.getElementById("tx-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("tx-form-title").textContent = "Nouvelle transaction";
  document.getElementById("tx-submit-btn").textContent = "Ajouter";
  document.getElementById("tx-cancel-btn").classList.add("hidden");
}

async function startEditTransaction(id) {
  const transaction = state.allTransactions.find((t) => t.id === id);
  if (!transaction) return;

  document.getElementById("tx-id").value = transaction.id;
  document.getElementById("tx-type").value = transaction.type;
  document.getElementById("tx-amount").value = transaction.amount;
  document.getElementById("tx-category").value = transaction.category;
  document.getElementById("tx-date").value = transaction.date;
  document.getElementById("tx-description").value = transaction.description || "";

  document.getElementById("tx-form-title").textContent = "Modifier la transaction";
  document.getElementById("tx-submit-btn").textContent = "Enregistrer";
  document.getElementById("tx-cancel-btn").classList.remove("hidden");

  showView("transactions");
  document.getElementById("transaction-form").scrollIntoView({ behavior: "smooth" });
}

async function confirmDeleteTransaction(id) {
  if (!confirm("Supprimer cette transaction ?")) return;
  try {
    await api.deleteTransaction(id);
    showToast("Transaction supprimée", "success");
    await refreshAll();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function readTransactionForm() {
  return {
    amount: parseFloat(document.getElementById("tx-amount").value),
    type: document.getElementById("tx-type").value,
    category: document.getElementById("tx-category").value,
    date: document.getElementById("tx-date").value,
    description: document.getElementById("tx-description").value.trim(),
  };
}

function bindTransactionForm() {
  const form = document.getElementById("transaction-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("tx-id").value;
    const payload = readTransactionForm();

    try {
      if (id) {
        await api.updateTransaction(id, payload);
        showToast("Transaction modifiée", "success");
      } else {
        await api.createTransaction(payload);
        showToast("Transaction ajoutée", "success");
      }
      resetTransactionForm();
      await refreshAll();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  document.getElementById("tx-cancel-btn").addEventListener("click", resetTransactionForm);
}

function bindFilters() {
  const applyFilters = async () => {
    const filters = {
      type: document.getElementById("filter-type").value,
      category: document.getElementById("filter-category").value,
      date_from: document.getElementById("filter-date-from").value,
      date_to: document.getElementById("filter-date-to").value,
    };
    const filtered = await api.listTransactions(filters);
    renderTransactionsTable("transactions-table", filtered);
  };

  ["filter-type", "filter-category", "filter-date-from", "filter-date-to"].forEach((id) =>
    document.getElementById(id).addEventListener("change", applyFilters)
  );

  document.getElementById("filter-reset").addEventListener("click", () => {
    ["filter-type", "filter-category", "filter-date-from", "filter-date-to"].forEach(
      (id) => (document.getElementById(id).value = "")
    );
    renderTransactionsTable("transactions-table", state.allTransactions);
  });
}
