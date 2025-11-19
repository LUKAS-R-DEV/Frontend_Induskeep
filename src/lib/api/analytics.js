import { apiFetch } from "./base.js";


export const AnalyticsApi = {
    get() {
        // Usa skipFeedback porque a página de relatórios já tem loading local
        return apiFetch("/analytics", { skipFeedback: true });
    },
};