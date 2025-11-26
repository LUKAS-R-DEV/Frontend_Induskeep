import { apiFetch } from "./base.js";

export const PushSubscriptionApi = {
  // Obter chave pública VAPID
  getVapidKey() {
    return apiFetch("/push-subscriptions/vapid-key", { skipFeedback: true });
  },

  // Criar subscription
  create(subscription) {
    return apiFetch("/push-subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  },

  // Listar subscriptions do usuário
  list() {
    return apiFetch("/push-subscriptions", { skipFeedback: true });
  },

  // Deletar subscription
  delete(endpoint) {
    return apiFetch(`/push-subscriptions/${encodeURIComponent(endpoint)}`, {
      method: "DELETE",
    });
  },
};



