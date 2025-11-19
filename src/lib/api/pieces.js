import { apiFetch } from "./base";

export const PieceApi = {
    list() {
        // Usa skipFeedback porque as páginas que usam já têm loading local
        return apiFetch("/pieces", { skipFeedback: true });
    },
    get(id) {
        return apiFetch(`/pieces/${id}`);
    },
    create(payload) {
        return apiFetch("/pieces", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    remove(id) {
        return apiFetch(`/pieces/${id}`, {
            method: "DELETE",
        });
    },
};