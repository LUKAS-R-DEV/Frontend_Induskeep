import { apiFetch } from "./base.js";

export const UserApi = {
  list() {
    // Usa skipFeedback porque a página já tem loading local
    return apiFetch("/auth/users", { skipFeedback: true });
  },
  listTechnicians() {
    // Usa skipFeedback porque as páginas que usam já têm loading local
    return apiFetch("/auth/technicians", { skipFeedback: true });
  },
  getProfile() {
    return apiFetch("/auth/me");
  },
  get(id) {
    return apiFetch(`/auth/users/${id}`);
  },
  register(payload, options = {}) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      ...options,
    });
  },
  login(credentials, options = {}) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      ...options,
    });
  },
  update(id, payload) {
    return apiFetch(`/auth/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deactivate(id, reason) {
    return apiFetch(`/auth/users/${id}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ deactivationReason: reason }),
    });
  },

reactive(id){
  return apiFetch(`/auth/users/${id}/reactivate`, {
    method: "POST",
  });
}
};