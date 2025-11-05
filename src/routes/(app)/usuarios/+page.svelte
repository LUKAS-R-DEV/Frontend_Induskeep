<script>
  import '$lib/styles/usuarios.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { UserApi } from '$lib/api/users';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { isAdmin } from '$lib/utils/permissions.js';

  let search = '';
  let roleFilter = '';
  let statusFilter = '';
  let usuarios = [];
  let loading = true;
  let error = '';
  let user = null;

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        user = JSON.parse(stored);
      }

      // Verifica se é admin
      if (!isAdmin(user?.role)) {
        error = 'Acesso negado. Apenas administradores podem acessar esta página.';
        loading = false;
        return;
      }

      const data = await UserApi.list();
      usuarios = Array.isArray(data) ? data : [];
    } catch (err) {
      error = err.message || 'Erro ao carregar usuários';
    } finally {
      loading = false;
    }
  });

  function getRoleLabel(role) {
    const labels = {
      ADMIN: 'Administrador',
      SUPERVISOR: 'Supervisor',
      TECHNICIAN: 'Técnico'
    };
    return labels[role] || role;
  }

  function getRoleClass(role) {
    const classes = {
      ADMIN: 'role-admin',
      SUPERVISOR: 'role-supervisor',
      TECHNICIAN: 'role-technician'
    };
    return classes[role] || '';
  }

  $: filteredUsers = usuarios.filter(u => {
    const matchesSearch = !search || 
      (u.name?.toLowerCase().includes(search.toLowerCase()) ||
       u.email?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  function editarUsuario(usuario) {
    goto(`/usuarios/${usuario.id}/editar`);
  }

  async function deletarUsuario(usuario) {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Desativar usuário',
          message: `Deseja realmente desativar o usuário "${usuario.name}"? O usuário não poderá mais acessar o sistema.`,
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      await UserApi.deactivate(usuario.id, 'Desativado via painel administrativo');
      
      usuarios = usuarios.map(u =>
        u.id === usuario.id ? { ...u, isActive: false } : u
      );

      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Usuário desativado com sucesso.',
      });
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Erro ao desativar usuário.',
      });
    }
  }

  async function reativarUsuario(usuario) {
    try {
      await UserApi.reactive(usuario.id);
      usuarios = usuarios.map(u =>
        u.id === usuario.id ? { ...u, isActive: true } : u
      );

      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Usuário reativado com sucesso.',
      });
    } catch (err) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Erro ao reativar usuário.',
      });
    }
  }
</script>

<div class="users-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Usuários</h1>
        <p class="page-subtitle">Gerencie usuários e permissões do sistema</p>
      </div>
      <button class="btn-primary" on:click={() => goto('/usuarios/cadastro')}>
        <i class="fas fa-plus"></i>
        Novo Usuário
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-card">
    <div class="search-wrapper">
      <i class="fas fa-search search-icon"></i>
      <input 
        type="text" 
        class="search-input"
        placeholder="Buscar por nome ou e-mail..." 
        bind:value={search} 
      />
    </div>

    <div class="filters-row">
      <div class="filter-item">
        <label for="roleFilter">
          <i class="fas fa-user-tag"></i>
          Perfil
        </label>
        <select id="roleFilter" bind:value={roleFilter} class="filter-select">
          <option value="">Todos os perfis</option>
          <option value="ADMIN">Administrador</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="TECHNICIAN">Técnico</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="statusFilter">
          <i class="fas fa-toggle-on"></i>
          Status
        </label>
        <select id="statusFilter" bind:value={statusFilter} class="filter-select">
          <option value="">Todos</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      {#if search || roleFilter || statusFilter}
        <button class="btn-clear-filters" on:click={() => { search = ''; roleFilter = ''; statusFilter = ''; }}>
          <i class="fas fa-times"></i>
          Limpar Filtros
        </button>
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando usuários...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h3>Erro ao carregar dados</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => window.location.reload()}>
        <i class="fas fa-redo"></i>
        Tentar novamente
      </button>
    </div>
  {:else if filteredUsers.length > 0}
    <!-- Users List -->
    <div class="users-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-users"></i>
          Usuários ({filteredUsers.length})
        </h2>
      </div>

      <div class="users-grid">
        {#each filteredUsers as u}
          <div class="user-card">
            <div class="user-avatar">
              <i class="fas fa-user-circle"></i>
            </div>
            
            <div class="user-info">
              <h3 class="user-name">{u.name}</h3>
              <p class="user-email">{u.email}</p>
              
              <div class="user-meta">
                <span class="role-badge {getRoleClass(u.role)}">
                  <i class="fas fa-user-tag"></i>
                  {getRoleLabel(u.role)}
                </span>
                <span class="status-badge {u.isActive ? 'status-active' : 'status-inactive'}">
                  <i class="fas fa-{u.isActive ? 'check-circle' : 'times-circle'}"></i>
                  {u.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div class="user-actions">
              <button
                class="action-btn edit"
                on:click={() => editarUsuario(u)}
                title="Editar usuário"
              >
                <i class="fas fa-edit"></i>
                Editar
              </button>
              {#if u.isActive}
                <button
                  class="action-btn deactivate"
                  on:click={() => deletarUsuario(u)}
                  title="Desativar usuário"
                >
                  <i class="fas fa-user-slash"></i>
                  Desativar
                </button>
              {:else}
                <button
                  class="action-btn activate"
                  on:click={() => reativarUsuario(u)}
                  title="Reativar usuário"
                >
                  <i class="fas fa-user-check"></i>
                  Reativar
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-users"></i>
      </div>
      <h3>Nenhum usuário encontrado</h3>
      <p>{search || roleFilter || statusFilter ? 'Tente ajustar os filtros de busca.' : 'Comece criando um novo usuário.'}</p>
      {#if !search && !roleFilter && !statusFilter}
        <button class="btn-primary" on:click={() => goto('/usuarios/cadastro')}>
          <i class="fas fa-plus"></i>
          Criar Primeiro Usuário
        </button>
      {/if}
    </div>
  {/if}
</div>
