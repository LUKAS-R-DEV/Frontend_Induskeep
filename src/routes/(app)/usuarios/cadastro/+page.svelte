<script>
  import '$lib/styles/ordens-cadastro.css';
  import { goto } from '$app/navigation';
  import { UserApi } from '$lib/api/users';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let role = '';
  let showPassword = false;
  let showConfirmPassword = false;

  let passwordStrength = { width: '0%', color: '#94a3b8', text: 'Digite uma senha', level: 0 };
  let passwordMatch = '';
  let loading = false;
  let error = '';

  function checkPasswordStrength() {
    if (!password) {
      passwordStrength = { width: '0%', color: '#94a3b8', text: 'Digite uma senha', level: 0 };
      return;
    }

    let strength = 0;
    let color = '#ef4444';
    let text = 'Fraca';
    let width = '25%';

    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;

    if (strength === 1) {
      color = '#f59e0b';
      text = 'Fraca';
      width = '25%';
    } else if (strength === 2) {
      color = '#f59e0b';
      text = 'Média';
      width = '50%';
    } else if (strength === 3) {
      color = '#10b981';
      text = 'Forte';
      width = '75%';
    } else if (strength === 4) {
      color = '#059669';
      text = 'Muito Forte';
      width = '100%';
    }

    passwordStrength = { width, color, text, level: strength };
  }

  function checkPasswordMatch() {
    if (!confirmPassword) {
      passwordMatch = '';
      return;
    }
    
    if (password === confirmPassword) {
      passwordMatch = 'Senhas coincidem ✓';
      passwordStrength.color = '#10b981';
    } else {
      passwordMatch = 'Senhas não coincidem ✗';
      passwordStrength.color = '#ef4444';
    }
  }

  $: if (password) checkPasswordStrength();
  $: if (confirmPassword) checkPasswordMatch();

  async function handleSubmit(e) {
    // Reset loading e error
    loading = true;
    error = '';

    // Validações locais
    if (!name || !email || !role || !password) {
      loading = false;
      feedback.set({
        show: true,
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    if (password.length < 8) {
      loading = false;
      feedback.set({
        show: true,
        type: 'error',
        title: 'Senha inválida',
        message: 'A senha deve ter no mínimo 8 caracteres.',
      });
      return;
    }

    if (passwordStrength.level < 2) {
      loading = false;
      feedback.set({
        show: true,
        type: 'error',
        title: 'Senha fraca',
        message: 'A senha é muito fraca. Use uma combinação de letras maiúsculas, minúsculas e números.',
      });
      return;
    }

    if (password !== confirmPassword) {
      loading = false;
      feedback.set({
        show: true,
        type: 'error',
        title: 'Senhas não coincidem',
        message: 'As senhas não coincidem. Verifique e tente novamente.',
      });
      return;
    }
    
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role.toUpperCase(),
    };

    try {
      await UserApi.register(payload, { skipFeedback: true });
      
      loading = false;
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Usuário cadastrado com sucesso!',
      });

      setTimeout(() => {
        goto('/usuarios');
      }, 1500);
    } catch (err) {
      console.error('❌ Erro ao cadastrar usuário:', err);
      
      loading = false;
      
      // Extrai mensagem de erro mais específica
      let errorMessage = 'Erro ao cadastrar usuário. Verifique os dados e tente novamente.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      } else if (err.data?.error) {
        errorMessage = err.data.error;
      } else if (err.status === 409) {
        errorMessage = 'Este e-mail já está cadastrado no sistema.';
      } else if (err.status === 403) {
        errorMessage = 'Você não tem permissão para criar usuários.';
      } else if (err.status === 401) {
        errorMessage = 'Sua sessão expirou. Faça login novamente.';
      }
      
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro ao cadastrar',
        message: errorMessage,
      });
    }
  }

  function getRoleLabel(role) {
    const labels = {
      ADMIN: 'Administrador',
      SUPERVISOR: 'Supervisor',
      TECHNICIAN: 'Técnico'
    };
    return labels[role] || role;
  }
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Cadastro de Usuário</h1>
        <p class="page-subtitle">Crie uma nova conta de usuário no sistema</p>
      </div>
      <button class="btn-secondary" on:click={() => goto('/usuarios')}>
        <i class="fas fa-arrow-left"></i>
        Voltar
      </button>
    </div>
  </div>

  <!-- Form Card -->
  <div class="form-card">
    <div class="card-header">
      <h2 class="card-title">
        <i class="fas fa-user-plus"></i>
        Dados do Usuário
      </h2>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="form-content">
      <!-- Row: Nome e Email -->
      <div class="form-row">
        <div class="form-group">
          <label for="name">
            <i class="fas fa-user"></i>
            Nome Completo *
          </label>
          <input 
            id="name" 
            type="text" 
            bind:value={name} 
            required
            placeholder="Ex: João Silva"
            class="form-input"
            disabled={loading}
          />
        </div>
        <div class="form-group">
          <label for="email">
            <i class="fas fa-envelope"></i>
            E-mail *
          </label>
          <input 
            id="email" 
            type="email" 
            bind:value={email} 
            required
            placeholder="exemplo@empresa.com"
            class="form-input"
            disabled={loading}
          />
        </div>
      </div>

      <!-- Role -->
      <div class="form-group">
        <label for="role">
          <i class="fas fa-user-tag"></i>
          Perfil de Acesso *
        </label>
        <select 
          id="role" 
          bind:value={role} 
          required
          class="form-select"
          disabled={loading}
        >
          <option value="">Selecione um perfil</option>
          <option value="ADMIN">Administrador</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="TECHNICIAN">Técnico</option>
        </select>
        <small class="form-hint">
          {#if role}
            Perfil selecionado: <strong>{getRoleLabel(role)}</strong>
          {:else}
            Selecione o perfil de acesso do usuário
          {/if}
        </small>
      </div>

      <!-- Row: Senha e Confirmar Senha -->
      <div class="form-row">
        <div class="form-group">
          <label for="password">
            <i class="fas fa-lock"></i>
            Senha *
          </label>
          <div class="password-input-wrapper">
            <input 
              id="password" 
              type={showPassword ? 'text' : 'password'} 
              bind:value={password} 
              required
              placeholder="Mínimo 8 caracteres"
              class="form-input"
              disabled={loading}
              on:input={checkPasswordStrength}
            />
            <button
              type="button"
              class="password-toggle"
              on:click={() => showPassword = !showPassword}
              tabindex="-1"
            >
              <i class="fas fa-{showPassword ? 'eye-slash' : 'eye'}"></i>
            </button>
          </div>
          <div class="password-strength">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                style="width: {passwordStrength.width}; background: {passwordStrength.color};"
              ></div>
            </div>
            <small class="strength-text" style="color: {passwordStrength.color};">
              {passwordStrength.text}
            </small>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">
            <i class="fas fa-lock"></i>
            Confirmar Senha *
          </label>
          <div class="password-input-wrapper">
            <input 
              id="confirmPassword" 
              type={showConfirmPassword ? 'text' : 'password'} 
              bind:value={confirmPassword} 
              required
              placeholder="Digite a senha novamente"
              class="form-input"
              disabled={loading}
              on:input={checkPasswordMatch}
            />
            <button
              type="button"
              class="password-toggle"
              on:click={() => showConfirmPassword = !showConfirmPassword}
              tabindex="-1"
            >
              <i class="fas fa-{showConfirmPassword ? 'eye-slash' : 'eye'}"></i>
            </button>
          </div>
          <small class="form-hint" style="color: {passwordMatch.includes('✓') ? '#10b981' : passwordMatch.includes('✗') ? '#ef4444' : '#94a3b8'};">
            {passwordMatch || 'Digite a senha novamente para confirmar'}
          </small>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button 
          type="button" 
          class="btn-cancel" 
          on:click={() => goto('/usuarios')}
          disabled={loading}
        >
          <i class="fas fa-times"></i>
          Cancelar
        </button>

        <button 
          type="submit" 
          class="btn-submit" 
          disabled={loading}
        >
          {#if loading}
            <i class="fas fa-spinner fa-spin"></i>
            <span>Salvando...</span>
          {:else}
            <i class="fas fa-save"></i>
            <span>Salvar Usuário</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .password-input-wrapper {
    position: relative;
  }

  .password-input-wrapper .form-input {
    padding-right: 3rem;
  }

  .password-toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .password-toggle:hover {
    color: #3b82f6;
  }

  .password-strength {
    margin-top: 0.5rem;
  }

  .strength-bar {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.375rem;
  }

  .strength-fill {
    height: 100%;
    border-radius: 3px;
    transition: all 0.3s ease;
  }

  .strength-text {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
  }
</style>
