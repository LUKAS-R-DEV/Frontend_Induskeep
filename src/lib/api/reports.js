
import { apiFetch } from "./base.js";

export const ReportApi = {
  getOverview() {
    return apiFetch("/reports/overview");
  },
  getHistory(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    // Usa skipFeedback porque a página de relatórios já tem loading local
    return apiFetch(`/reports/history?${params.toString()}`, { skipFeedback: true });
  },
  export(type = "pdf", dataset = "overview") {
    return apiFetch(`/reports/export?type=${type}&dataset=${dataset}`);
  }
};
