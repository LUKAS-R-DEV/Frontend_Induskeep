<script>
  import { toasts } from "$lib/stores/toast.store";
  import { fly, fade } from "svelte/transition";
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div class="toast {toast.type}" in:fly={{ x: 40 }} out:fade>
      {toast.message}
    </div>
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
.toast {
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  color: #fff;
  background: #333;
  font-size: 0.9rem;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
.toast.success { background: #2ecc71; }
.toast.error { background: #e74c3c; }
.toast.warning { background: #f1c40f; color: #222; }
.toast.info { background: #3498db; }
</style>
