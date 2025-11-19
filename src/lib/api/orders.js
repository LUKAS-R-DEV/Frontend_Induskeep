// src/lib/api/orders.js
import { apiFetch } from "./base.js";

export const OrdersApi = {
  list() {
    // Usa skipFeedback porque a página já tem loading local
    return apiFetch("/orders", { skipFeedback: true }); // rota do backend
  },
  get(id) {
    return apiFetch(`/orders/${id}`);
  },
  create(payload) {
    return apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiFetch(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  remove(id) {
    return apiFetch(`/orders/${id}`, { method: "DELETE" });
  },
};
