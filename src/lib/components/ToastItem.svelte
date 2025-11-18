<script>
  import { fly, fade } from "svelte/transition";
  import { X } from "lucide-svelte";
  import { onMount, onDestroy } from "svelte";
  import { toasts } from "$lib/stores/toasts.stores.js";

  export let toast;
  export let duration;

  let progress = 100;
  let timeRemaining = duration;
  let timerInterval = null;
  let startTime = null;

  function close() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    toasts.remove(toast.id);
  }

  function formatTime(ms) {
    const seconds = Math.ceil(ms / 1000);
    return seconds > 0 ? `${seconds}s` : '';
  }

  onMount(() => {
    if (duration > 0) {
      startTime = Date.now();
      timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        progress = Math.max(0, 100 - (elapsed / duration) * 100);
        timeRemaining = Math.max(0, duration - elapsed);
        
        if (progress <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          close();
        }
      }, 16); // ~60fps para animação suave
    }
  });

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });
</script>

<div class="toast {toast.type}" in:fly={{ x: 40 }} out:fade>
  <div class="toast-content">
    <span class="toast-message">{toast.message}</span>
    {#if timeRemaining > 0}
      <span class="toast-timer">{formatTime(timeRemaining)}</span>
    {/if}
  </div>
  <button class="toast-close" on:click={close} title="Fechar">
    <X size={16} />
  </button>
  <div class="toast-progress-container">
    <div class="toast-progress {toast.type}" style="width: {progress}%"></div>
  </div>
</div>

<style>
  .toast {
    position: relative;
    padding: 0.8rem 1.2rem;
    padding-right: 2.5rem;
    border-radius: 8px;
    color: #fff;
    background: #333;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    min-width: 280px;
    max-width: 400px;
    overflow: hidden;
  }

  .toast.success { background: #2ecc71; }
  .toast.error { background: #e74c3c; }
  .toast.warning { background: #f1c40f; color: #222; }
  .toast.info { background: #3498db; }

  .toast-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .toast-message {
    flex: 1;
    line-height: 1.4;
  }

  .toast-timer {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: 500;
    white-space: nowrap;
  }

  .toast-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: inherit;
    padding: 0;
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .toast-progress-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .toast-progress {
    height: 100%;
    transition: width 0.1s linear;
    min-width: 0;
  }

  .toast-progress.success {
    background: rgba(255, 255, 255, 0.6);
  }

  .toast-progress.error {
    background: rgba(255, 255, 255, 0.6);
  }

  .toast-progress.warning {
    background: rgba(0, 0, 0, 0.3);
  }

  .toast-progress.info {
    background: rgba(255, 255, 255, 0.6);
  }
</style>

