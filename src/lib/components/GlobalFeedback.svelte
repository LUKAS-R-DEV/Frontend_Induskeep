<script>
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { fly, fade } from 'svelte/transition';
  import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-svelte';

  let state;
  let progress = 100;
  let timerInterval = null;
  const DURATION = 6000; // 6 segundos (aumentado de ~3 segundos)

  $: state = $feedback;

  function close() {
    if (state.type !== 'loading') {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      feedback.set({ show: false });
    }
  }

  function confirm() {
    if (state.confirmCallback) state.confirmCallback();
    close();
  }

  $: if (state.show && state.type !== 'loading' && state.type !== 'confirm') {
    // Reseta o progresso quando uma nova mensagem aparece
    progress = 100;
    
    // Limpa timer anterior se existir
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Inicia o timer de progresso
    const startTime = Date.now();
    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      progress = Math.max(0, 100 - (elapsed / DURATION) * 100);
      
      if (progress <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        close();
      }
    }, 16); // ~60fps para animação suave
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
        <div class="modal-header">
          <div class="icon {state.type}">
            {#if state.type === 'success'}
              <CheckCircle2 size={48} color="#2ecc71" />
            {:else if state.type === 'error'}
              <AlertCircle size={48} color="#e74c3c" />
            {:else if state.type === 'warning'}
              <AlertTriangle size={48} color="#f1c40f" />
            {:else if state.type === 'info'}
              <Info size={48} color="#3498db" />
            {/if}
          </div>
          <button class="close-btn" on:click={close} title="Fechar">
            <X size={20} />
          </button>
        </div>
        <h3>{state.title}</h3>
        <p>{state.message}</p>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: {progress}%"></div>
        </div>
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
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 1rem;
}

.close-btn {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
  transform: scale(1.1);
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.5rem;
}

.icon.success { color: #2ecc71; }
.icon.error { color: #e74c3c; }
.icon.warning { color: #f1c40f; }
.icon.info { color: #3498db; }

.progress-bar-container {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin: 1rem 0;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 2px;
  transition: width 0.1s linear;
  min-width: 0;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

button {
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

button.ok,
button.confirm {
  background: var(--primary, #3b82f6);
  color: #fff;
  width: 100%;
  margin-top: 0.5rem;
}

button.ok:hover,
button.confirm:hover {
  background: var(--primary-hover, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

button.cancel {
  background: #e2e8f0;
  color: #475569;
}

button.cancel:hover {
  background: #cbd5e1;
}

.spinner {
  width: 40px; 
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: var(--primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}
</style>
