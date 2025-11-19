import { apiFetch } from "./base.js";

export const SettingsApi = {
  async get() {
    // Bate exatamente na rota que você já criou
    // Usa skipFeedback porque as páginas que usam já têm loading local
    return apiFetch("/settings", { skipFeedback: true });
  },

  async update(payload) {
    return apiFetch("/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};