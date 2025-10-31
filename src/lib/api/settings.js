import { apiFetch } from "./base.js";

export const SettingsApi = {
  async get() {
    // Bate exatamente na rota que você já criou
    return apiFetch("/settings");
  },

  async update(payload) {
    return apiFetch("/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};