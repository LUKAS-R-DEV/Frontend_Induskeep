import { apiFetch } from "./base";

export const NotificationsApi = {
  // 🔹 Lista notificações do usuário logado
  list() {
    return apiFetch("/notifications");
  },

  // 🔹 Lista todas (somente admin)
  listAll() {
    return apiFetch("/notifications/all");
  },

  // 🔹 Marca uma notificação como lida
  markAsRead(id) {
    return apiFetch(`/notifications/${id}`, {
      method: "PATCH",
    });
  },

  // 🔹 Remove notificação
  delete(id) {
    return apiFetch(`/notifications/${id}`, {
      method: "DELETE",
    });
  },

  // 🔹 Cria manualmente (opcional)
  create(data) {
    return apiFetch("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
