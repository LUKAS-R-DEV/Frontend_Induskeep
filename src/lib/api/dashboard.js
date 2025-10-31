// src/lib/api/dashboard.js
import { apiFetch } from "./base.js";

// ✅ export nomeado — precisa ser "export const DashboardApi"
export const DashboardApi = {
  getData() {
    return apiFetch("/dashboard");
  },
};
