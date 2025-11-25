import { apiFetch } from '../api/base.js';

const SW_PATH = '/sw.js';

/**
 * Solicita permissão para notificações push
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Este navegador não suporta notificações.');
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    throw new Error('Permissão de notificações foi negada. Por favor, habilite nas configurações do navegador.');
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Registra o service worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Este navegador não suporta service workers.');
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH);
    console.log('[Web Push] Service Worker registrado:', registration);
    return registration;
  } catch (error) {
    console.error('[Web Push] Erro ao registrar service worker:', error);
    throw error;
  }
}

/**
 * Obtém a chave pública VAPID do servidor
 */
export async function getVapidPublicKey() {
  try {
    const response = await apiFetch('/push-subscriptions/vapid-key', { skipFeedback: true });
    return response.publicKey;
  } catch (error) {
    console.error('[Web Push] Erro ao obter VAPID key:', error);
    throw error;
  }
}

/**
 * Converte a chave pública VAPID para o formato necessário
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Cria uma subscription para push notifications
 */
export async function subscribeToPush() {
  try {
    // 1. Solicita permissão
    await requestNotificationPermission();

    // 2. Registra service worker
    const registration = await registerServiceWorker();
    await navigator.serviceWorker.ready;

    // 3. Obtém chave pública VAPID
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID keys não configuradas no servidor.');
    }

    // 4. Cria subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // 5. Envia subscription para o servidor
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      },
    };

    await apiFetch('/push-subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });

    console.log('[Web Push] Subscription criada com sucesso');
    return subscription;
  } catch (error) {
    console.error('[Web Push] Erro ao criar subscription:', error);
    throw error;
  }
}

/**
 * Remove a subscription de push notifications
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove do servidor
      try {
        await apiFetch(`/push-subscriptions/${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('[Web Push] Erro ao remover subscription do servidor:', error);
      }

      // Remove localmente
      await subscription.unsubscribe();
      console.log('[Web Push] Subscription removida com sucesso');
    }
  } catch (error) {
    console.error('[Web Push] Erro ao remover subscription:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário está inscrito em push notifications
 */
export async function isSubscribed() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    // Adiciona timeout para evitar espera indefinida
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service Worker timeout')), 5000)
      )
    ]);

    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    // Silenciosamente retorna false em caso de erro
    // Não loga erro para evitar spam no console
    return false;
  }
}

/**
 * Converte ArrayBuffer para Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Verifica se o navegador suporta Web Push
 */
export function isWebPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

