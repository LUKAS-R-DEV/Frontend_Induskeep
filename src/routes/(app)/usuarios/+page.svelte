<script>
  import '$lib/styles/usuarios.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { UserApi } from '$lib/api/users';

  let search = '';
  let usuarios = [];
  let loading = true;
  let error = '';

  // Carrega usuários da API
  onMount(async () => {
    try {
      const data = await UserApi.list();
      usuarios = Array.isArray(data) ? data : [];
    } catch (err) {
      error = err.message || 'Erro ao carregar usuários';
    } finally {
      loading = false;
    }
  });

  // Funções
  function editarUsuario(usuario) {
    goto(`/usuarios/${usuario.id}/editar`);
  }

  async function deletarUsuario(usuario) {
    const ok = confirm(`Deseja realmente desativar o usuário "${usuario.name}"?`);
    if (!ok) return;

    try {
      await UserApi.deactivate(usuario.id, 'Desativado via painel');
      alert('Usuário desativado com sucesso.');
      usuarios = usuarios.map(u =>
        u.id === usuario.id ? { ...u, isActive: false } : u
      );
    } catch (err) {
      alert(err.message || 'Erro ao desativar usuário.');
    }
  }
</script>

<div class="page-header">
  <h1>👥 Usuários</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar usuário..." bind:value={search} />
  </div>
  <button class="btn-primary" on:click={() => goto('/usuarios/cadastro')}>
    <i class="fas fa-plus"></i> Novo Usuário
  </button>
</div>

{#if loading}
  <div class="loading-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Carregando usuários...</p>
  </div>
{:else if error}
  <div class="error-state">
    <i class="fas fa-exclamation-circle"></i>
    <p>{error}</p>
  </div>
{:else}
  <div class="page-section">
    <h2>Lista de Usuários</h2>
    {#if usuarios.length > 0}
      <div class="table-wrapper">
        <table class="standard-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each usuarios
            .filter(u =>
              (u.name?.toLowerCase().includes(search.toLowerCase()) ||
                u.email?.toLowerCase().includes(search.toLowerCase()))
            ) as u}
            <tr>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td><span class="role">{u.role || 'Técnico'}</span></td>
              <td>
                <span class={"status " + (u.isActive ? 'ativo' : 'inativo')}>
                  {u.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td class="actions">
                <button
                  class="action-btn edit"
                  title="Editar"
                  on:click={() => editarUsuario(u)}
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  class="action-btn delete"
                  title="Desativar"
                  on:click={() => deletarUsuario(u)}
                >
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
    {:else}
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>Nenhum usuário encontrado.</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  .role {
    background: #eef2ff;
    color: #3730a3;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    text-transform: capitalize;
  }

  .status.ativo {
    background: #e6f9ef;
    color: #008a4e;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
  }

  .status.inativo {
    background: #fde8e8;
    color: #b91c1c;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
  }

  .loading,
  .error {
    margin-top: 2rem;
    font-size: 1.2rem;
  }

  .error {
    color: #b91c1c;
  }
</style>
