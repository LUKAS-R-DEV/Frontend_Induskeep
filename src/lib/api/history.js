import { apiFetch } from "./base";

export const HistoryApi = {
    async list() {
        // Usa skipFeedback porque a página já tem loading local
        return apiFetch(`/history`, { skipFeedback: true });
    },
    async create(data) {
        return apiFetch(`/history`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    async get(id) {
        return apiFetch(`/history/order/${id}`);
    },
};