import { apiFetch } from "./base";

export const NotificationsApi = {
  // 🔹 Lista notificações do usuário logado
  list() {
    // Usa skipFeedback porque a página já tem loading local
    return apiFetch("/notifications", { skipFeedback: true });
  },

  // 🔹 Lista todas (somente admin)
  listAll() {
    // Usa skipFeedback porque a página já tem loading local
    return apiFetch("/notifications/all", { skipFeedback: true });
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
