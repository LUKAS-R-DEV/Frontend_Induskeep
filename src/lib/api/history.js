import { apiFetch } from "./base";

export const HistoryApi = {
    async list() {
        return apiFetch(`/history`);
    },
    async create(data) {
        return apiFetch(`/history`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    async get(id) {
        return apiFetch(`/order/${id}`);
    },
};