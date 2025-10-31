import { apiFetch } from "./base";

export const PieceApi = {
    list() {
        return apiFetch("/pieces");
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