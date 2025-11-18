import { writable } from 'svelte/store';

let toastIdCounter = 0;

function createToastStore() {
  const { subscribe, update } = writable([]);

  return {
    subscribe,
    add: (toast) => {
      const id = ++toastIdCounter;
      
      // Durações diferentes por tipo se não especificado
      function getDefaultDuration(type) {
        switch (type) {
          case 'error':
            return 10000; // 10 segundos para erros
          case 'warning':
            return 8000; // 8 segundos para avisos
          case 'info':
            return 6000; // 6 segundos para informações
          case 'success':
            return 5000; // 5 segundos para sucesso
          default:
            return 6000; // 6 segundos padrão
        }
      }
      
      const newToast = {
        id,
        type: toast.type || 'info',
        message: toast.message || '',
        duration: toast.duration !== undefined ? toast.duration : getDefaultDuration(toast.type || 'info'),
      };
      
      update((toasts) => [...toasts, newToast]);
      
      // Remove automaticamente após a duração (o componente ToastItem gerencia isso)
      // Mantido como fallback caso o componente não funcione
      if (newToast.duration > 0) {
        setTimeout(() => {
          update((toasts) => toasts.filter((t) => t.id !== id));
        }, newToast.duration + 100); // +100ms para garantir que o componente tenha tempo de animar
      }
      
      return id;
    },
    remove: (id) => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
    clear: () => {
      update(() => []);
    },
  };
}

export const toasts = createToastStore();


