import { writable } from 'svelte/store';

export const user = writable(null);

// Funções utilitárias
export function setUser(u) {
  user.set(u);
  localStorage.setItem('user', JSON.stringify(u));
}

export function getUser() {
  try {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function clearUser() {
  user.set(null);
  localStorage.removeItem('user');
}
