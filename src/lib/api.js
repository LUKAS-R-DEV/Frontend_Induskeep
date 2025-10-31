import { user, isAuthenticated } from './stores/auth';
import { get } from 'svelte/store';

// Configuração base da API (dinâmica para dev/prod)
const API_BASE_URL = (() => {
  const base = import.meta.env?.VITE_API_URL || '';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalizedBase}/api`;
})();

// Função auxiliar para fazer requisições HTTP
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Obtém o token do localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Adiciona o token de autenticação, se disponível
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Importante para cookies de autenticação
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Se a resposta for 204 (No Content), retorna null
    if (response.status === 204) {
      return null;
    }
    
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Se receber 401 (Não autorizado), faz logout
      if (response.status === 401) {
        authService.logout();
      }
      
      throw new Error(data.message || 'Ocorreu um erro inesperado');
    }

    return data;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}

// Serviço de autenticação
export const authService = {
  async login(credentials) {
    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: credentials
      });

      if (data.token) {
        // Armazena o token no localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
        }
        
        // Atualiza o store de autenticação
        isAuthenticated.set(true);
        user.set(data.user);
      }

      return data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },
  
  async register(userData) {
    try {
      const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: userData
      });
      return data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },
  
  async logout() {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpa os dados de autenticação
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      isAuthenticated.set(false);
      user.set(null);
    }
  },
  
  async getCurrentUser() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return null;
      
      const data = await fetchAPI('/auth/me');
      user.set(data);
      return data;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      this.logout();
      return null;
    }
  },
  
  async requestPasswordReset(email) {
    return fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },
  
  async resetPassword(token, newPassword) {
    return fetchAPI('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword }
    });
  }
};

// Serviço de agendamentos
export const scheduleService = {
  async list() {
    return fetchAPI('/schedules');
  },
  
  async getById(id) {
    return fetchAPI(`/schedules/${id}`);
  },
  
  async create(scheduleData) {
    return fetchAPI('/schedules', {
      method: 'POST',
      body: scheduleData
    });
  },
  
  async update(id, scheduleData) {
    return fetchAPI(`/schedules/${id}`, {
      method: 'PUT',
      body: scheduleData
    });
  },
  
  async delete(id) {
    return fetchAPI(`/schedules/${id}`, {
      method: 'DELETE'
    });
  },
  
  async getByMachineId(machineId) {
    return fetchAPI(`/schedules/machine/${machineId}`);
  },
  
  async getByDateRange(startDate, endDate) {
    return fetchAPI(`/schedules/range?start=${startDate}&end=${endDate}`);
  }
};

// Serviço de máquinas
export const machineService = {
  async list() {
    return fetchAPI('/machines');
  },
  
  async getById(id) {
    return fetchAPI(`/machines/${id}`);
  },
  
  async create(machineData) {
    return fetchAPI('/machines', {
      method: 'POST',
      body: machineData
    });
  },
  
  async update(id, machineData) {
    return fetchAPI(`/machines/${id}`, {
      method: 'PUT',
      body: machineData
    });
  },
  
  async delete(id) {
    return fetchAPI(`/machines/${id}`, {
      method: 'DELETE'
    });
  }
};

// Serviço de ordens de manutenção
export const maintenanceOrderService = {
  async list() {
    return fetchAPI('/orders');
  },
  
  async getById(id) {
    return fetchAPI(`/orders/${id}`);
  },
  
  async create(orderData) {
    return fetchAPI('/orders', {
      method: 'POST',
      body: orderData
    });
  },
  
  async update(id, orderData) {
    return fetchAPI(`/orders/${id}`, {
      method: 'PUT',
      body: orderData
    });
  },
  
  async delete(id) {
    return fetchAPI(`/orders/${id}`, {
      method: 'DELETE'
    });
  },
  
  async getByStatus(status) {
    return fetchAPI(`/orders/status/${status}`);
  },
  
  async getByMachineId(machineId) {
    return fetchAPI(`/orders/machine/${machineId}`);
  }
};

// Serviço de notificações
export const notificationService = {
  async list() {
    return fetchAPI('/notifications');
  },
  
  async markAsRead(id) {
    return fetchAPI(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },
  
  async markAllAsRead() {
    return fetchAPI('/notifications/read-all', {
      method: 'PATCH'
    });
  },
  
  async getUnreadCount() {
    return fetchAPI('/notifications/unread-count');
  }
};

// Exporta a função fetchAPI para uso personalizado
export { fetchAPI };
