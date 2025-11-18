<script>
  import { UserApi } from '$lib/api/users';
  import '$lib/styles/login.css';
  import { goto } from '$app/navigation';
  import { feedback } from '$lib/stores/feedback.stores.js';

  // Ícones Lucide-Svelte
  import {
    Factory,
    AlertCircle,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    LogIn,
    Key,
    Cog,
    Shield,
    Wrench,
  } from 'lucide-svelte';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  let showPassword = false;

  async function handleLogin(e) {
    e.preventDefault();
    error = '';
    
    if (!email || !password) {
      error = 'Por favor, preencha todos os campos.';
      return;
    }

    try {
      loading = true;
      const data = await UserApi.login({ email, password }, { skipFeedback: true });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('permissions', JSON.stringify(data.permissions));

      feedback.set({
        show: true,
        type: 'success',
        title: 'Login realizado!',
        message: 'Redirecionando...',
      });

      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 500);
    } catch (e) {
      if (e.status === 401) {
        error = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      } else if (e.status === 400) {
        error = e.message || 'Dados inválidos. Verifique as informações e tente novamente.';
      } else if (e.message && e.message.includes('conexão')) {
        error = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else {
        error = e.message || 'Erro ao fazer login. Tente novamente.';
      }
      loading = false;
    }
  }
</script>

<div class="auth-wrapper">
  <div class="auth-container">
    <div class="auth-header">
      <div class="logo-container">
        <div class="logo-icon">
          <Factory size={28} color="white" />
        </div>
        <h1 class="logo-text">INDUSKEEP</h1>
      </div>
      <p class="auth-subtitle">Sistema de Gestão de Manutenção</p>
    </div>

    <form on:submit|preventDefault={handleLogin} class="auth-form">
      {#if error}
        <div class="alert alert-error">
          <AlertCircle size={18} color="#ef4444" />
          <span>{error}</span>
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
          placeholder="seu.email@empresa.com" 
          bind:value={email}
          autocomplete="email"
          required
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="password">
          <Lock size={16} />
          Senha
        </label>
        <div class="password-input-wrapper">
          <input 
            id="password"
            type={showPassword ? 'text' : 'password'} 
            placeholder="Digite sua senha" 
            bind:value={password}
            autocomplete="current-password"
            required
            disabled={loading}
          />
          <button 
            type="button"
            class="password-toggle"
            on:click={() => showPassword = !showPassword}
            disabled={loading}
          >
            {#if showPassword}
              <EyeOff size={18} />
            {:else}
              <Eye size={18} />
            {/if}
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary" disabled={loading}>
        {#if loading}
          <Loader2 class="spin" size={18} />
          <span>Entrando...</span>
        {:else}
          <LogIn size={18} />
          <span>Entrar</span>
        {/if}
      </button>

      <div class="auth-footer">
        <a href="/recuperar-senha" class="link">
          <Key size={14} />
          Esqueceu sua senha?
        </a>
      </div>
    </form>

    <div class="auth-decorative">
      <Cog class="decorative-icon icon-1" size={40} />
      <Shield class="decorative-icon icon-2" size={32} />
      <Wrench class="decorative-icon icon-3" size={24} />
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
