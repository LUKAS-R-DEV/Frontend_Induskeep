<script>
  import '$lib/styles/equipamentos-cadastro.css';
  import { goto } from '$app/navigation';
  import { MachinesApi } from '$lib/api/machines';
  import { onMount } from 'svelte';

  let name = '';
  let serial = '';
  let location = '';
  let status = 'ACTIVE';
  let userId = '';

  let loading = false;
  let error = '';

  // 🔹 Recupera o ID do usuário logado (caso o token o contenha)
  onMount(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id;
      }
    } catch (e) {
      console.warn('Falha ao carregar usuário local:', e);
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) {
      alert('Usuário não autenticado! Faça login novamente.');
      return;
    }

    const payload = {
      name,
      serial,
      location,
      userId,
    };

    try {
      loading = true;
      await MachinesApi.create(payload);
      alert(`Equipamento "${name}" cadastrado com sucesso!`);
      goto('/equipamentos');
    } catch (err) {
      error = err.message || 'Erro ao salvar equipamento';
      alert(error);
    } finally {
      loading = false;
    }
  }
</script>

<div class="header">
  <h1>Cadastro de Equipamento</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/equipamentos')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

<div class="section">
  <h2>Informações do Equipamento</h2>
  <form on:submit={handleSubmit}>
    <div class="form-row">
      <div class="form-group">
        <label for="name">Nome do Equipamento *</label>
        <input id="name" type="text" bind:value={name} required />
      </div>
      <div class="form-group">
        <label for="serial">Número de Série *</label>
        <input id="serial" type="text" bind:value={serial} required />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="location">Localização / Setor *</label>
        <select id="location" bind:value={location} required>
          <option value="">Selecione um setor</option>
          <option value="Produção">Produção</option>
          <option value="Utilidades">Utilidades</option>
          <option value="Expedição">Expedição</option>
          <option value="Preparação">Preparação</option>
          <option value="Manutenção">Manutenção</option>
        </select>
      </div>
      <div class="form-group">
        <label for="status">Status *</label>
        <select id="status" bind:value={status} required>
          <option value="ACTIVE">Ativo</option>
          <option value="MAINTENANCE">Em Manutenção</option>
          <option value="INACTIVE">Inativo</option>
        </select>
      </div>
    </div>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <div class="form-actions">
      <button
        type="button"
        class="btn secondary"
        on:click={() => goto('/equipamentos')}
      >
        Cancelar
      </button>
      <button type="submit" class="btn" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Equipamento'}
      </button>
    </div>
  </form>
</div>

<style>
  .error {
    color: #b91c1c;
    margin-top: 1rem;
    font-weight: 500;
  }

  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
