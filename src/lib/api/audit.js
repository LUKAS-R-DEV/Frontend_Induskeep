import { apiFetch } from "./base.js";

export const AuditApi = {
  async list(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.pageSize) params.append('pageSize', filters.pageSize);
    if (filters.module) params.append('module', filters.module);
    if (filters.action) params.append('action', filters.action);
    if (filters.userId) params.append('userId', filters.userId);
    
    const queryString = params.toString();
    const url = queryString ? `/audit?${queryString}` : '/audit';
    
    return apiFetch(url);
  },

  async purge(olderThan) {
    return apiFetch('/audit/purge', {
      method: 'POST',
      body: JSON.stringify({ olderThan }),
    });
  },
};



