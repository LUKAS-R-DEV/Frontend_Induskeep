<script>
  import '$lib/styles/usuarios-cadastro.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { UserApi } from '$lib/api/users';

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
      const user = await UserApi.get(id);
      name = user.name || '';
      email = user.email || '';
      role = user.role || '';
      isActive = user.isActive ?? true;
    } catch (e) {
      error = e?.message || 'Falha ao carregar usuário';
    } finally {
      loadingData = false;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      if (password && password !== confirmPassword) {
        alert('As senhas não coincidem!');
        loading = false;
        return;
      }

      const payload = {
        name,
        email,
        role: role?.toUpperCase?.() || role,
      };
      if (password) payload.password = password;

      await UserApi.update(id, payload);
      alert('✅ Usuário atualizado com sucesso!');
      goto('/usuarios');
    } catch (err) {
      console.error(err);
      error = err.message || 'Falha ao atualizar o usuário.';
    } finally {
      loading = false;
    }
  }

  async function handleReactivate() {
    const ok = confirm('Deseja reativar este usuário?');
    if (!ok) return;
    try {
      loading = true;
      await UserApi.reactive(id);
      isActive = true;
      alert('✅ Usuário reativado com sucesso!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Falha ao reativar o usuário.');
    } finally {
      loading = false;
    }
  }

  async function handleDeactivate() {
    const ok = confirm('Deseja desativar este usuário?');
    if (!ok) return;
    try {
      loading = true;
      await UserApi.deactivate(id, 'Desativado via edição');
      isActive = false;
      alert('✅ Usuário desativado com sucesso!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Falha ao desativar o usuário.');
    } finally {
      loading = false;
    }
  }
</script>

<div class="header">
  <h1>Editar Usuário</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/usuarios')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
  {#if isActive}
    <button class="btn delete" on:click={handleDeactivate} disabled={loading}>
      {#if loading}
        <i class="fas fa-spinner fa-spin"></i> Desativando...
      {:else}
        <i class="fas fa-ban"></i> Desativar usuário
      {/if}
    </button>
  {/if}
  {#if !isActive}
    <button class="btn" on:click={handleReactivate} disabled={loading}>
      {#if loading}
        <i class="fas fa-spinner fa-spin"></i> Reativando...
      {:else}
        <i class="fas fa-undo"></i> Reativar usuário
      {/if}
    </button>
  {/if}
</div>

{#if loadingData}
  <div class="loading">Carregando dados do usuário...</div>
{:else}
  <div class="section">
    <h2>Dados do Usuário</h2>

    <form on:submit={handleSubmit}>
      <div class="form-row">
        <div class="form-group">
          <label for="name">Nome Completo *</label>
          <input id="name" type="text" bind:value={name} required />
        </div>
        <div class="form-group">
          <label for="email">E-mail *</label>
          <input id="email" type="email" bind:value={email} required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="role">Perfil de Acesso *</label>
          <select id="role" bind:value={role} required>
            <option value="">Selecione um perfil</option>
            <option value="ADMIN">Administrador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="TECHNICIAN">Técnico</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="password">Nova Senha (opcional)</label>
          <input id="password" type="password" bind:value={password} />
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirmar Nova Senha</label>
          <input id="confirmPassword" type="password" bind:value={confirmPassword} />
        </div>
      </div>

      {#if error}
        <div class="error">⚠️ {error}</div>
      {/if}

      <div class="form-actions">
        <button type="button" class="btn secondary" on:click={() => goto('/usuarios')}>
          Cancelar
        </button>
        <button type="submit" class="btn" disabled={loading}>
          {#if loading}
            <i class="fas fa-spinner fa-spin"></i> Salvando...
          {:else}
            <i class="fas fa-save"></i> Salvar alterações
          {/if}
        </button>
      </div>
    </form>
  </div>
{/if}
