import { writable } from 'svelte/store';

let toastIdCounter = 0;

function createToastStore() {
  const { subscribe, update } = writable([]);

  return {
    subscribe,
    add: (toast) => {
      const id = ++toastIdCounter;
      const newToast = {
        id,
        type: toast.type || 'info',
        message: toast.message || '',
        duration: toast.duration || 3000,
      };
      
      update((toasts) => [...toasts, newToast]);
      
      // Remove automaticamente após a duração
      if (newToast.duration > 0) {
        setTimeout(() => {
          update((toasts) => toasts.filter((t) => t.id !== id));
        }, newToast.duration);
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

