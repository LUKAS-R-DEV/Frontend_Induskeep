import { apiFetch } from "./base.js";

export const MachinesApi={
    list() {
        // Usa skipFeedback porque a página já tem loading local
        return apiFetch("/machines", { skipFeedback: true });
    },
    get(id) {
        return apiFetch(`/machines/${id}`);
    },
    create(payload) {
        return apiFetch("/machines", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
      update(id,payload) {
        return apiFetch(`/machines/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      },
      remove(id) {
        return apiFetch(`/machines/${id}`, {
          method: "DELETE",
        });
      },

}



