import { apiFetch } from "./base.js";

export const UserApi = {
  list() {
    return apiFetch("auth/users");
  },
  getProfile() {
    return apiFetch("auth/me");
  },
  register(payload) {
    return apiFetch("auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(credentials) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  deactivate(id, reason) {
    return apiFetch(`auth/users/${id}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ deactivationReason: reason }),
    });
  },
};