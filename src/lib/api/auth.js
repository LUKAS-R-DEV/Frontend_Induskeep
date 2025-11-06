import { apiFetch } from "./base";

export const AuthApi = {
    recoveryPassword(payload) {
        return apiFetch("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    resetPassword(payload, options = {}) {
        return apiFetch("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify(payload),
            ...options,
        });
    },






}

