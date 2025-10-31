import { apiFetch } from "./base.js";


export const AnalyticsApi = {
    get() {
        return apiFetch("/analytics");
    },
};