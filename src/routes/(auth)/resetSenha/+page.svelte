<script>
  import "$lib/styles/resetSenha.css";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { AuthApi } from "$lib/api/auth";
  import { feedback } from '$lib/stores/feedback.stores.js';

  let token = "";
  let newPassword = "";
  let confirmPassword = "";
  let loading = false;
  let error = "";
  let showPassword = false;
  let showConfirmPassword = false;

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    token = params.get("token") || "";
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
      
      const res = await AuthApi.resetPassword({ token, newPassword });
      
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
      error = err?.message || "Erro ao redefinir a senha. Verifique o link ou tente novamente.";
      loading = false;
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
          <i class="fas fa-lock"></i>
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
          <i class="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      {/if}

      <div class="form-group">
        <label for="newPassword">
          <i class="fas fa-key"></i>
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
            <i class="fas fa-{showPassword ? 'eye-slash' : 'eye'}"></i>
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
          <i class="fas fa-check-double"></i>
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
            <i class="fas fa-{showConfirmPassword ? 'eye-slash' : 'eye'}"></i>
          </button>
        </div>
        {#if confirmPassword && newPassword !== confirmPassword}
          <p class="password-hint error">
            <i class="fas fa-times-circle"></i>
            As senhas não coincidem
          </p>
        {:else if confirmPassword && newPassword === confirmPassword}
          <p class="password-hint success">
            <i class="fas fa-check-circle"></i>
            As senhas coincidem
          </p>
        {/if}
      </div>

      <button type="submit" class="btn btn-primary" disabled={loading || !token}>
        {#if loading}
          <i class="fas fa-spinner fa-spin"></i>
          <span>Redefinindo...</span>
        {:else}
          <i class="fas fa-check"></i>
          <span>Redefinir Senha</span>
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
