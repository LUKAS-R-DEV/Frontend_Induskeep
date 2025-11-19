// src/lib/api/dashboard.js
import { apiFetch } from "./base.js";

// ✅ export nomeado — precisa ser "export const DashboardApi"
export const DashboardApi = {
  getData() {
    // Usa skipFeedback porque a página já tem loading local
    return apiFetch("/dashboard", { skipFeedback: true });
  },
};
