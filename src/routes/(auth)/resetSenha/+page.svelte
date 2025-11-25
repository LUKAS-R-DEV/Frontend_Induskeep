<script>
  import "$lib/styles/resetSenha.css";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { AuthApi } from "$lib/api/auth";
  import { feedback } from '$lib/stores/feedback.stores.js';
  import {
    Lock,
    Key,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Check,
    ArrowLeft,
    LockKeyhole,
  } from 'lucide-svelte';

  let token = "";
  let newPassword = "";
  let confirmPassword = "";
  let loading = false;
  let error = "";
  let showPassword = false;
  let showConfirmPassword = false;

  onMount(() => {
    // Usa a API do SvelteKit para obter os parâmetros da URL
    token = $page.url.searchParams.get("token") || "";
    if (!token) {
      error = "Link inválido ou ausente. Verifique o link enviado por e-mail.";
    }
  });

  function validate() {
    error = "";
    
    if (!token) {
      error = "Token inválido. Verifique o link enviado por e-mail.";
      return false;
    }
    
    if (!newPassword || !confirmPassword) {
      error = "Por favor, preencha todos os campos.";
      return false;
    }
    
    if (newPassword.length < 8) {
      error = "A senha deve ter pelo menos 8 caracteres.";
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      error = "As senhas não coincidem. Tente novamente.";
      return false;
    }
    
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      loading = true;
      error = "";
      
      // Usa skipFeedback para evitar feedback duplicado, já que vamos mostrar nosso próprio feedback
      const res = await AuthApi.resetPassword({ token, newPassword }, { skipFeedback: true });
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Senha redefinida!',
        message: 'Sua senha foi redefinida com sucesso. Redirecionando...',
      });
      
      setTimeout(() => {
        goto("/login");
      }, 2000);
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      
      // Tenta extrair a mensagem de erro de diferentes formatos
      let errorMessage = "Erro ao redefinir a senha. Verifique o link ou tente novamente.";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      error = errorMessage;
      loading = false;
      
      // Também mostra feedback global para erros críticos
      if (err?.status === 400 || err?.status === 404) {
        feedback.set({
          show: true,
          type: 'error',
          title: 'Erro ao redefinir senha',
          message: errorMessage,
        });
      }
    }
  }

  function getPasswordStrength(password) {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    const levels = [
      { text: 'Muito fraca', color: '#ef4444' },
      { text: 'Fraca', color: '#f59e0b' },
      { text: 'Média', color: '#3b82f6' },
      { text: 'Forte', color: '#10b981' },
      { text: 'Muito forte', color: '#059669' }
    ];
    
    return {
      strength: Math.min(strength, 4),
      text: levels[strength]?.text || '',
      color: levels[strength]?.color || ''
    };
  }

  $: passwordStrength = getPasswordStrength(newPassword);
</script>

<div class="auth-wrapper">
  <div class="auth-container">
    <div class="auth-header">
      <div class="logo-container">
        <div class="logo-icon">
          <LockKeyhole size={28} color="white" />
        </div>
        <h1 class="logo-text">INDUSKEEP</h1>
      </div>
      <h2 class="auth-title">Redefinir Senha</h2>
      <p class="auth-subtitle">
        Crie uma nova senha segura para sua conta.
      </p>
    </div>

    <form on:submit={handleSubmit} class="auth-form">
      {#if error}
        <div class="alert alert-error">
          <AlertCircle size={18} color="#ef4444" />
          <span>{error}</span>
        </div>
      {/if}

      <div class="form-group">
        <label for="newPassword">
          <Key size={16} />
          Nova Senha
        </label>
        <div class="password-input-wrapper">
          <input 
            id="newPassword"
            type={showPassword ? 'text' : 'password'} 
            bind:value={newPassword} 
            placeholder="Mínimo 8 caracteres" 
            minlength="8" 
            required
            disabled={loading || !token}
            autocomplete="new-password"
          />
          <button 
            type="button"
            class="password-toggle"
            on:click={() => showPassword = !showPassword}
            disabled={loading || !token}
          >
            {#if showPassword}
              <EyeOff size={18} />
            {:else}
              <Eye size={18} />
            {/if}
          </button>
        </div>
        {#if newPassword}
          <div class="password-strength">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                style="width: {(passwordStrength.strength + 1) * 20}%; background: {passwordStrength.color};"
              ></div>
            </div>
            <span class="strength-text" style="color: {passwordStrength.color};">
              {passwordStrength.text}
            </span>
          </div>
        {/if}
      </div>

      <div class="form-group">
        <label for="confirmPassword">
          <Lock size={16} />
          Confirmar Nova Senha
        </label>
        <div class="password-input-wrapper">
          <input 
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'} 
            bind:value={confirmPassword} 
            placeholder="Confirme sua senha"
            minlength="8" 
            required
            disabled={loading || !token}
            autocomplete="new-password"
          />
          <button 
            type="button"
            class="password-toggle"
            on:click={() => showConfirmPassword = !showConfirmPassword}
            disabled={loading || !token}
          >
            {#if showConfirmPassword}
              <EyeOff size={18} />
            {:else}
              <Eye size={18} />
            {/if}
          </button>
        </div>
        {#if confirmPassword && newPassword !== confirmPassword}
          <p class="password-hint error">
            <XCircle size={16} />
            As senhas não coincidem
          </p>
        {:else if confirmPassword && newPassword === confirmPassword}
          <p class="password-hint success">
            <CheckCircle2 size={16} />
            As senhas coincidem
          </p>
        {/if}
      </div>

      <button type="submit" class="btn btn-primary" disabled={loading || !token}>
        {#if loading}
          <Loader2 class="spin" size={18} />
          <span>Redefinindo...</span>
        {:else}
          <Check size={18} />
          <span>Redefinir Senha</span>
        {/if}
      </button>

      <div class="auth-footer">
        <button type="button" class="btn btn-secondary" on:click={() => goto('/login')} disabled={loading}>
          <ArrowLeft size={18} />
          <span>Voltar para Login</span>
        </button>
      </div>
    </form>
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
