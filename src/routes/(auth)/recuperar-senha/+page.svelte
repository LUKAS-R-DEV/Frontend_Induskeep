<script>
  import '$lib/styles/recuperar-senha.css';
  import { goto } from '$app/navigation';
  import { AuthApi } from '$lib/api/auth';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import {
    Key,
    AlertCircle,
    Mail,
    Loader2,
    Send,
    ArrowLeft,
    MailOpen,
  } from 'lucide-svelte';

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
          <Key size={28} color="white" />
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
          <AlertCircle size={18} color="#ef4444" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      <div class="form-group">
        <label for="email">
          <Mail size={16} />
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
          <Loader2 class="spin" size={18} />
          <span>Enviando...</span>
        {:else}
          <Send size={18} />
          <span>Enviar Instruções</span>
        {/if}
      </button>

      <div class="auth-footer">
        <button type="button" class="btn btn-secondary" on:click={() => goto('/login')} disabled={loading}>
          <ArrowLeft size={18} />
          <span>Voltar para Login</span>
        </button>
      </div>
    </form>

    <div class="auth-decorative">
      <MailOpen class="decorative-icon icon-1" size={40} />
      <Send class="decorative-icon icon-2" size={32} />
      <Key class="decorative-icon icon-3" size={24} />
    </div>
  </div>
</div>

<style>
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }

  svg {
    vertical-align: middle;
    stroke-width: 2;
  }

  .logo-icon {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 12px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3);
  }
</style>
