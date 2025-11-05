<script>
  import '$lib/styles/ordens-cadastro.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { UserApi } from '$lib/api/users';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let id = '';

  let name = '';
  let email = '';
  let role = '';
  let password = '';
  let confirmPassword = '';
  let isActive = true;

  let loading = false;
  let loadingData = true;
  let error = '';

  onMount(async () => {
    try {
      id = $page.params.id;
      const userData = await UserApi.get(id);
      name = userData.name || '';
      email = userData.email || '';
      role = userData.role || '';
      isActive = userData.isActive ?? true;
    } catch (e) {
      error = e?.message || 'Falha ao carregar usuário';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
    } finally {
      loadingData = false;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    // Validações
    if (password && password.length < 6) {
      error = 'A senha deve ter pelo menos 6 caracteres.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Senha inválida',
        message: error,
      });
      loading = false;
      return;
    }

    if (password && password !== confirmPassword) {
      error = 'As senhas não coincidem!';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Senhas não coincidem',
        message: error,
      });
      loading = false;
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role?.toUpperCase?.() || role,
      };
      
      // Só inclui senha se foi preenchida
      if (password && password.length >= 6) {
        payload.password = password;
      }

      await UserApi.update(id, payload);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Usuário atualizado com sucesso!',
      });

      setTimeout(() => {
        goto('/usuarios');
      }, 1000);
    } catch (err) {
      console.error(err);
      error = err.message || 'Falha ao atualizar o usuário.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
      loading = false;
    }
  }

  async function handleReactivate() {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Reativar usuário',
          message: 'Deseja reativar este usuário? Ele poderá acessar o sistema novamente.',
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      loading = true;
      await UserApi.reactive(id);
      isActive = true;
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Usuário reativado com sucesso!',
      });
    } catch (err) {
      console.error(err);
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Falha ao reativar o usuário.',
      });
    } finally {
      loading = false;
    }
  }

  async function handleDeactivate() {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Desativar usuário',
          message: 'Deseja desativar este usuário? Ele não poderá mais acessar o sistema.',
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      loading = true;
      await UserApi.deactivate(id, 'Desativado via edição');
      isActive = false;
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Usuário desativado com sucesso!',
      });
    } catch (err) {
      console.error(err);
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Falha ao desativar o usuário.',
      });
    } finally {
      loading = false;
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

  $: passwordMatch = !password || password === confirmPassword;
  $: passwordStrength = password ? (password.length >= 6 ? 'strong' : 'weak') : '';
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Editar Usuário</h1>
        <p class="page-subtitle">Atualize as informações do usuário</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" on:click={() => goto('/usuarios')}>
          <i class="fas fa-arrow-left"></i>
          Voltar
        </button>
        {#if isActive}
          <button 
            class="btn-warning" 
            on:click={handleDeactivate} 
            disabled={loading}
            title="Desativar usuário"
          >
            <i class="fas fa-ban"></i>
            Desativar
          </button>
        {:else}
          <button 
            class="btn-success" 
            on:click={handleReactivate} 
            disabled={loading}
            title="Reativar usuário"
          >
            <i class="fas fa-undo"></i>
            Reativar
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if loadingData}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando dados do usuário...</p>
    </div>
  {:else if error && !name}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h3>Erro ao carregar usuário</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => goto('/usuarios')}>
        <i class="fas fa-arrow-left"></i>
        Voltar para lista
      </button>
    </div>
  {:else}
    <!-- Status Banner -->
    {#if !isActive}
      <div class="status-banner inactive">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Este usuário está inativo e não pode acessar o sistema.</span>
      </div>
    {/if}

    <!-- Form Card -->
    <div class="form-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-user-edit"></i>
          Dados do Usuário
        </h2>
      </div>

      <form on:submit={handleSubmit} class="form-content">
        <!-- Row: Nome e E-mail -->
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
            <small class="form-hint">Nome completo do usuário</small>
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
              placeholder="Ex: usuario@exemplo.com"
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">E-mail de acesso ao sistema</small>
          </div>
        </div>

        <!-- Perfil -->
        <div class="form-group">
          <label for="role">
            <i class="fas fa-user-shield"></i>
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
            Perfil atual: <strong>{getRoleLabel(role)}</strong>
          </small>
        </div>

        <!-- Role Preview -->
        <div class="role-preview">
          <div class="preview-badge role-{role.toLowerCase()}">
            <i class="fas fa-{role === 'ADMIN' ? 'crown' : role === 'SUPERVISOR' ? 'user-tie' : 'user'}"></i>
            <span>Perfil: {getRoleLabel(role) || 'Não selecionado'}</span>
          </div>
        </div>

        <!-- Password Section -->
        <div class="form-section-divider">
          <div class="divider-line"></div>
          <span class="divider-text">
            <i class="fas fa-lock"></i>
            Alterar Senha (Opcional)
          </span>
          <div class="divider-line"></div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="password">
              <i class="fas fa-key"></i>
              Nova Senha
            </label>
            <input 
              id="password" 
              type="password" 
              bind:value={password}
              placeholder="Deixe em branco para manter a senha atual"
              class="form-input {passwordStrength}"
              disabled={loading}
            />
            <small class="form-hint">
              {#if password && password.length > 0}
                {#if password.length < 6}
                  <span class="text-warning">Senha deve ter pelo menos 6 caracteres</span>
                {:else}
                  <span class="text-success">Senha válida</span>
                {/if}
              {:else}
                Deixe em branco para manter a senha atual
              {/if}
            </small>
          </div>
          <div class="form-group">
            <label for="confirmPassword">
              <i class="fas fa-key"></i>
              Confirmar Nova Senha
            </label>
            <input 
              id="confirmPassword" 
              type="password" 
              bind:value={confirmPassword}
              placeholder="Confirme a nova senha"
              class="form-input {password && !passwordMatch ? 'error' : ''}"
              disabled={loading}
            />
            <small class="form-hint">
              {#if password && confirmPassword}
                {#if passwordMatch}
                  <span class="text-success">
                    <i class="fas fa-check-circle"></i> Senhas coincidem
                  </span>
                {:else}
                  <span class="text-error">
                    <i class="fas fa-times-circle"></i> Senhas não coincidem
                  </span>
                {/if}
              {:else}
                Confirme a nova senha
              {/if}
            </small>
          </div>
        </div>

        <!-- Error Message -->
        {#if error}
          <div class="form-message error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        {/if}

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
            disabled={loading || (password && !passwordMatch) || (password && password.length < 6)}
          >
            {#if loading}
              <i class="fas fa-spinner fa-spin"></i>
              <span>Salvando...</span>
            {:else}
              <i class="fas fa-save"></i>
              <span>Salvar Alterações</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .status-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    font-weight: 600;
  }

  .status-banner.inactive {
    background: #fef3c7;
    color: #d97706;
    border: 2px solid #fbbf24;
  }

  .status-banner i {
    font-size: 1.25rem;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-warning {
    padding: 0.75rem 1.5rem;
    background: #fbbf24;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-warning:hover:not(:disabled) {
    background: #f59e0b;
    transform: translateY(-1px);
  }

  .btn-warning:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-success {
    padding: 0.75rem 1.5rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-success:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }

  .btn-success:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .role-preview {
    margin: 1rem 0;
  }

  .preview-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .preview-badge.role-admin {
    background: #fef3c7;
    color: #d97706;
  }

  .preview-badge.role-supervisor {
    background: #dbeafe;
    color: #2563eb;
  }

  .preview-badge.role-technician {
    background: #d1fae5;
    color: #059669;
  }

  .preview-badge i {
    font-size: 1.1rem;
  }

  .form-section-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0 1.5rem 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  .divider-text {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
  }

  .divider-text i {
    color: #94a3b8;
  }

  .form-input.strong {
    border-color: #10b981;
  }

  .form-input.weak {
    border-color: #f59e0b;
  }

  .form-input.error {
    border-color: #ef4444;
  }

  .text-success {
    color: #10b981;
  }

  .text-warning {
    color: #f59e0b;
  }

  .text-error {
    color: #ef4444;
  }

  @media (max-width: 768px) {
    .header-actions {
      flex-direction: column;
      width: 100%;
    }

    .btn-warning,
    .btn-success {
      width: 100%;
      justify-content: center;
    }
  }
</style>
