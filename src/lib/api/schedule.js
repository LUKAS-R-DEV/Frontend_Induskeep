import { apiFetch } from "./base";

export const ScheduleApi={
    list() {
        // Usa skipFeedback porque a página já tem loading local
        return apiFetch("/schedules", { skipFeedback: true });
    },
    create(data) {
        return apiFetch("/schedules", {
          method: "POST",
          body: JSON.stringify(data),
        });
      },

      update(id,payload) {
        return apiFetch(`/schedules/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      },
      delete(id) {
        return apiFetch(`/schedules/${id}`, {
          method: "DELETE",
        });
      }
}