import { apiFetch } from "./base.js";

export const OrderItemsApi = {
  list() {
    return apiFetch("/order-items", { skipFeedback: true });
  },
  get(id) {
    return apiFetch(`/order-items/${id}`);
  },
  create(payload) {
    return apiFetch("/order-items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  findByOrder(orderId) {
    return apiFetch(`/order-items/order/${orderId}`, { skipFeedback: true });
  },
  remove(id) {
    return apiFetch(`/order-items/${id}`, { method: "DELETE" });
  },
};

