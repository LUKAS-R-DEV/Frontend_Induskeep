<script>
  import { toasts } from "$lib/stores/toasts.stores.js";
  import ToastItem from "./ToastItem.svelte";

  function getDuration(type) {
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
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    {@const duration = toast.duration || getDuration(toast.type)}
    <ToastItem {toast} {duration} />
  {/each}
</div>

<style>
.toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
