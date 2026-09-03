/**
 * Couche d'accès à l'API backend.
 * Centraliser tous les appels fetch() ici permet de changer l'URL de base
 * en un seul endroit et de gérer les erreurs de façon cohérente.
 */
const API_BASE_URL = "http://localhost:8000/api";

const CATEGORIES = [
  { value: "alimentation", label: "Alimentation" },
  { value: "logement", label: "Logement" },
  { value: "transport", label: "Transport" },
  { value: "etudes", label: "Études" },
  { value: "loisirs", label: "Loisirs" },
  { value: "sante", label: "Santé" },
  { value: "abonnements", label: "Abonnements" },
  { value: "autres", label: "Autres" },
  { value: "revenu", label: "Revenu" },
];

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    let detail = `Erreur ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch (_) {
      /* pas de corps JSON, on garde le message par défaut */
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

const api = {
  // Transactions
  listTransactions: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const query = params.toString();
    return apiRequest(`/transactions${query ? `?${query}` : ""}`);
  },
  createTransaction: (payload) =>
    apiRequest("/transactions", { method: "POST", body: JSON.stringify(payload) }),
  updateTransaction: (id, payload) =>
    apiRequest(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTransaction: (id) => apiRequest(`/transactions/${id}`, { method: "DELETE" }),

  // Budget
  setBudget: (payload) => apiRequest("/budgets", { method: "POST", body: JSON.stringify(payload) }),
  getBudget: (monthYear) =>
    apiRequest(`/budgets/${monthYear}`).catch(() => null), // pas de budget défini -> null

  // Stats
  getSummary: (monthYear) => apiRequest(`/stats/summary?month_year=${monthYear}`),
  getByCategory: (monthYear) => apiRequest(`/stats/by-category?month_year=${monthYear}`),
  getMonthlyEvolution: (months = 6) => apiRequest(`/stats/monthly-evolution?months=${months}`),
};
