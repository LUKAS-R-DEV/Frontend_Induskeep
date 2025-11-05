<script>
  import {UserApi} from '$lib/api/users'
  import '$lib/styles/login.css';
  import { goto } from '$app/navigation';
  import { feedback } from '$lib/stores/feedback.stores.js';

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
      // Usa skipFeedback para evitar mostrar o feedback global de erro
      // Vamos tratar o erro localmente na página
      const data = await UserApi.login({email, password}, { skipFeedback: true });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
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
      // Trata erros de autenticação com mensagens mais amigáveis
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
          <i class="fas fa-industry"></i>
        </div>
        <h1 class="logo-text">INDUSKEEP</h1>
      </div>
      <p class="auth-subtitle">Sistema de Gestão de Manutenção</p>
    </div>

    <form on:submit|preventDefault={handleLogin} class="auth-form">
      {#if error}
        <div class="alert alert-error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{error}</span>
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
          placeholder="seu.email@empresa.com" 
          bind:value={email}
          autocomplete="email"
          required
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="password">
          <i class="fas fa-lock"></i>
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
            <i class="fas fa-{showPassword ? 'eye-slash' : 'eye'}"></i>
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary" disabled={loading}>
        {#if loading}
          <i class="fas fa-spinner fa-spin"></i>
          <span>Entrando...</span>
        {:else}
          <i class="fas fa-sign-in-alt"></i>
          <span>Entrar</span>
        {/if}
      </button>

      <div class="auth-footer">
        <a href="/recuperar-senha" class="link">
          <i class="fas fa-key"></i>
          Esqueceu sua senha?
        </a>
      </div>
    </form>

    <div class="auth-decorative">
      <div class="decorative-circle circle-1"></div>
      <div class="decorative-circle circle-2"></div>
      <div class="decorative-circle circle-3"></div>
    </div>
  </div>
</div>
