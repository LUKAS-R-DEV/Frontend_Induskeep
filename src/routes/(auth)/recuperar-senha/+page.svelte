<script>
  import '$lib/styles/recuperar-senha.css';
  import { goto } from '$app/navigation';
  import { AuthApi } from '$lib/api/auth';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let email = '';
  let loading = false;
  let errorMessage = '';

  function validateEmail() {
    if (!email) {
      errorMessage = 'Por favor, informe seu e-mail.';
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      errorMessage = 'Por favor, insira um e-mail válido.';
      return false;
    }
    errorMessage = '';
    return true;
  }

  async function handleRecovery(e) {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    try {
      loading = true;
      errorMessage = '';
      
      await AuthApi.recoveryPassword({ email });
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'E-mail enviado!',
        message: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      
      setTimeout(() => {
        goto('/login');
      }, 2000);
    } catch (err) {
      errorMessage = err?.message || 'Erro ao enviar e-mail. Tente novamente.';
      loading = false;
    }
  }
</script>

<div class="auth-wrapper">
  <div class="auth-container">
    <div class="auth-header">
      <div class="logo-container">
        <div class="logo-icon">
          <i class="fas fa-key"></i>
        </div>
        <h1 class="logo-text">INDUSKEEP</h1>
      </div>
      <h2 class="auth-title">Recuperar Senha</h2>
      <p class="auth-subtitle">
        Digite seu e-mail abaixo e enviaremos instruções para redefinir sua senha.
      </p>
    </div>

    <form on:submit={handleRecovery} class="auth-form">
      {#if errorMessage}
        <div class="alert alert-error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <div class="form-group">
        <label for="email">
          <i class="fas fa-envelope"></i>
          E-mail
        </label>
        <input 
          id="email"
          type="email" 
          bind:value={email} 
          placeholder="seu.email@empresa.com" 
          required
          disabled={loading}
          autocomplete="email"
        />
      </div>

      <button type="submit" class="btn btn-primary" disabled={loading}>
        {#if loading}
          <i class="fas fa-spinner fa-spin"></i>
          <span>Enviando...</span>
        {:else}
          <i class="fas fa-paper-plane"></i>
          <span>Enviar Instruções</span>
        {/if}
      </button>

      <div class="auth-footer">
        <button type="button" class="btn btn-secondary" on:click={() => goto('/login')} disabled={loading}>
          <i class="fas fa-arrow-left"></i>
          <span>Voltar para Login</span>
        </button>
      </div>
    </form>

    <div class="auth-decorative">
      <div class="decorative-circle circle-1"></div>
      <div class="decorative-circle circle-2"></div>
      <div class="decorative-circle circle-3"></div>
    </div>
  </div>
</div>
