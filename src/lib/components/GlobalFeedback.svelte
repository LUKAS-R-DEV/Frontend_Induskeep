<script>
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { fly, fade } from 'svelte/transition';

  let state;
  $: state = $feedback;

  function close() {
    if (state.type !== 'loading') feedback.set({ show: false });
  }

  function confirm() {
    if (state.confirmCallback) state.confirmCallback();
    feedback.set({ show: false });
  }
</script>

{#if state.show}
  <div class="overlay" transition:fade>
    <div class="modal" in:fly={{ y: -20, duration: 200 }}>
      {#if state.type === 'loading'}
        <div class="spinner"></div>
        <p>{state.message || 'Carregando...'}</p>
      {:else if state.type === 'confirm'}
        <h3>{state.title || 'Confirmação'}</h3>
        <p>{state.message}</p>
        <div class="actions">
          <button class="cancel" on:click={close}>Cancelar</button>
          <button class="confirm" on:click={confirm}>Confirmar</button>
        </div>
      {:else}
        <div class="icon {state.type}">
          {#if state.type === 'success'}
            <i class="fas fa-check-circle"></i>
          {:else if state.type === 'error'}
            <i class="fas fa-exclamation-circle"></i>
          {:else if state.type === 'warning'}
            <i class="fas fa-exclamation-triangle"></i>
          {:else if state.type === 'info'}
            <i class="fas fa-info-circle"></i>
          {/if}
        </div>
        <h3>{state.title}</h3>
        <p>{state.message}</p>
        <button class="ok" on:click={close}>OK</button>
      {/if}
    </div>
  </div>
{/if}

<style>
.overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 1.8rem;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon.success { color: #2ecc71; }
.icon.error { color: #e74c3c; }
.icon.warning { color: #f1c40f; }
.icon.info { color: #3498db; }

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

button {
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

button.ok,
button.confirm {
  background: var(--primary, #007bff);
  color: #fff;
}

button.cancel {
  background: #ccc;
  color: #333;
}

.spinner {
  width: 40px; height: 40px;
  border: 4px solid #ccc;
  border-top-color: var(--primary, #007bff);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}
</style>
