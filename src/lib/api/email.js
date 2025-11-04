import { apiFetch } from "./base";

export const EmailApi = {
    send: (data) => apiFetch("/email", { method: "POST", body: JSON.stringify(data) }),
};