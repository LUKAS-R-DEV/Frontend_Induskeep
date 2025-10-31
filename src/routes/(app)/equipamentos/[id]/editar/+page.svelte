<script>
  import '$lib/styles/equipamentos-cadastro.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { MachinesApi } from '$lib/api/machines';

  let id = '';

  let name = '';
  let serial = '';
  let location = '';
  let status = 'ACTIVE';

  let loading = false;
  let loadingData = true;
  let error = '';

  onMount(async () => {
    try {
      id = $page.params.id;
      const eq = await MachinesApi.get(id);
      name = eq.name || '';
      serial = eq.serial || '';
      location = eq.location || '';
      status = eq.status || 'ACTIVE';
    } catch (e) {
      error = e?.message || 'Falha ao carregar equipamento';
    } finally {
      loadingData = false;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const payload = { name, serial, location };
      if (status) payload.status = status; // inclui status se suportado pelo backend

      await MachinesApi.update(id, payload);
      alert('✅ Equipamento atualizado com sucesso!');
      goto('/equipamentos');
    } catch (err) {
      console.error(err);
      error = err.message || 'Falha ao atualizar o equipamento.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="header">
  <h1>Editar Equipamento</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/equipamentos')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
</div>

{#if loadingData}
  <div class="loading">Carregando dados do equipamento...</div>
{:else}
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
          <label for="status">Status</label>
          <select id="status" bind:value={status}>
            <option value="ACTIVE">Ativo</option>
            <option value="MAINTENANCE">Em Manutenção</option>
            <option value="INACTIVE">Inativo</option>
          </select>
        </div>
      </div>

      {#if error}
        <div class="error">⚠️ {error}</div>
      {/if}

      <div class="form-actions">
        <button type="button" class="btn secondary" on:click={() => goto('/equipamentos')}>
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
