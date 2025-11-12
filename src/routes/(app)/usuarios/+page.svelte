<script>
  import '$lib/styles/usuarios.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { UserApi } from '$lib/api/users';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { isAdmin } from '$lib/utils/permissions.js';

  // ✅ Ícones Lucide
  import {
    Plus,
    Search,
    UserCog,
    ToggleLeft,
    X,
    Loader2,
    AlertCircle,
    RotateCcw,
    Users,
    UserCircle,
    CheckCircle2,
    XCircle,
    Pencil,
    UserX,
    UserCheck,
  } from 'lucide-svelte';

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
        <Plus size={18} />
        Novo Usuário
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-card">
    <div class="search-wrapper">
      <Search size={18} class="search-icon" />
      <input 
        type="text" 
        class="search-input"
        placeholder="Digite o nome completo ou endereço de e-mail do usuário..." 
        bind:value={search} 
      />
    </div>

    <div class="filters-row">
      <div class="filter-item">
        <label for="roleFilter">
          <UserCog size={16} />
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
          <ToggleLeft size={16} />
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
          <X size={16} />
          Limpar Filtros
        </button>
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <Loader2 class="spin" size={32} />
      </div>
      <p>Carregando usuários...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <AlertCircle size={36} color="#ef4444" />
      </div>
      <h3>Erro ao carregar dados</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => window.location.reload()}>
        <RotateCcw size={18} />
        Tentar novamente
      </button>
    </div>
  {:else if filteredUsers.length > 0}
    <!-- Users List -->
    <div class="users-card">
      <div class="card-header">
        <h2 class="card-title">
          <Users size={20} />
          Usuários ({filteredUsers.length})
        </h2>
      </div>

      <div class="users-grid">
        {#each filteredUsers as u}
          <div class="user-card">
            <div class="user-avatar">
              <UserCircle size={48} color="#64748b" />
            </div>
            
            <div class="user-info">
              <h3 class="user-name">{u.name}</h3>
              <p class="user-email">{u.email}</p>
              
              <div class="user-meta">
                <span class="role-badge {getRoleClass(u.role)}">
                  <UserCog size={14} />
                  {getRoleLabel(u.role)}
                </span>
                <span class="status-badge {u.isActive ? 'status-active' : 'status-inactive'}">
                  {#if u.isActive}
                    <CheckCircle2 size={14} />
                  {:else}
                    <XCircle size={14} />
                  {/if}
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
                <Pencil size={16} />
                Editar
              </button>
              {#if u.isActive}
                <button
                  class="action-btn deactivate"
                  on:click={() => deletarUsuario(u)}
                  title="Desativar usuário"
                >
                  <UserX size={16} />
                  Desativar
                </button>
              {:else}
                <button
                  class="action-btn activate"
                  on:click={() => reativarUsuario(u)}
                  title="Reativar usuário"
                >
                  <UserCheck size={16} />
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
        <Users size={32} color="#94a3b8" />
      </div>
      <h3>Nenhum usuário encontrado</h3>
      <p>{search || roleFilter || statusFilter ? 'Tente ajustar os filtros de busca.' : 'Comece criando um novo usuário.'}</p>
      {#if !search && !roleFilter && !statusFilter}
        <button class="btn-primary" on:click={() => goto('/usuarios/cadastro')}>
          <Plus size={18} />
          Criar Primeiro Usuário
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }

  /* Ícones SVG refinados */
  svg {
    vertical-align: middle;
    stroke-width: 2;
    flex-shrink: 0;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    z-index: 1;
  }

  /* Ajustes para ícones em labels */
  label svg {
    margin-right: 0.5rem;
  }

  /* Ajustes para ícones em botões */
  .btn-primary svg,
  .btn-secondary svg,
  .btn-retry svg,
  .btn-clear-filters svg,
  .action-btn svg {
    flex-shrink: 0;
  }

  /* Ajustes para card-title */
  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para role-badge e status-badge */
  .role-badge,
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  /* Ajustes para user-avatar */
  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
