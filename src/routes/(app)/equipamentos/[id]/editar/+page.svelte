<script>
  import '$lib/styles/ordens-cadastro.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { MachinesApi } from '$lib/api/machines';
  import { feedback } from '$lib/stores/feedback.stores.js';

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

    // Validação de campos obrigatórios (com trim para remover espaços)
    if (!name || !name.trim() || !serial || !serial.trim() || !location || !location.trim()) {
      error = 'Por favor, preencha todos os campos obrigatórios (Nome, Número de Série e Localização).';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Campos obrigatórios',
        message: error,
      });
      loading = false;
      return;
    }

    try {
      const payload = { name, serial, location };
      if (status) payload.status = status;

      await MachinesApi.update(id, payload);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Equipamento atualizado com sucesso!',
      });

      setTimeout(() => {
        goto('/equipamentos');
      }, 1000);
    } catch (err) {
      console.error(err);
      error = err.message || 'Falha ao atualizar o equipamento.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
      loading = false;
    }
  }

  function getStatusLabel(status) {
    const labels = {
      ACTIVE: 'Ativo',
      MAINTENANCE: 'Em Manutenção',
      INACTIVE: 'Inativo'
    };
    return labels[status] || status;
  }
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Editar Equipamento</h1>
        <p class="page-subtitle">Atualize as informações do equipamento</p>
      </div>
      <button class="btn-secondary" on:click={() => goto('/equipamentos')}>
        <i class="fas fa-arrow-left"></i>
        Voltar
      </button>
    </div>
  </div>

  {#if loadingData}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando dados do equipamento...</p>
    </div>
  {:else if error && !name}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h3>Erro ao carregar equipamento</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => goto('/equipamentos')}>
        <i class="fas fa-arrow-left"></i>
        Voltar para lista
      </button>
    </div>
  {:else}
    <!-- Form Card -->
    <div class="form-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-industry"></i>
          Informações do Equipamento
        </h2>
      </div>

      <form on:submit={handleSubmit} class="form-content">
        <!-- Row: Nome e Número de Série -->
        <div class="form-row">
          <div class="form-group">
            <label for="name">
              <i class="fas fa-tag"></i>
              Nome do Equipamento *
            </label>
            <input 
              id="name" 
              type="text" 
              bind:value={name} 
              required
              placeholder="Ex: Prensa Hidráulica Modelo X"
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Nome identificador do equipamento</small>
          </div>
          <div class="form-group">
            <label for="serial">
              <i class="fas fa-barcode"></i>
              Número de Série *
            </label>
            <input 
              id="serial" 
              type="text" 
              bind:value={serial} 
              required
              placeholder="Ex: SN123456789"
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Número de série único do equipamento</small>
          </div>
        </div>

        <!-- Row: Localização e Status -->
        <div class="form-row">
          <div class="form-group">
            <label for="location">
              <i class="fas fa-map-marker-alt"></i>
              Localização / Setor *
            </label>
            <input 
              id="location" 
              type="text" 
              bind:value={location} 
              required
              placeholder="Ex: Produção, Utilidades, Expedição..."
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Setor onde o equipamento está localizado</small>
          </div>
          <div class="form-group">
            <label for="status">
              <i class="fas fa-flag"></i>
              Status
            </label>
            <select 
              id="status" 
              bind:value={status}
              class="form-select"
              disabled={loading}
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
            <small class="form-hint">
              Status atual: <strong>{getStatusLabel(status)}</strong>
            </small>
          </div>
        </div>

        <!-- Status Preview -->
        <div class="status-preview">
          <div class="preview-badge status-{status.toLowerCase()}">
            <i class="fas fa-{status === 'ACTIVE' ? 'check-circle' : status === 'MAINTENANCE' ? 'wrench' : 'times-circle'}"></i>
            <span>Status: {getStatusLabel(status)}</span>
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
            on:click={() => goto('/equipamentos')}
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
              <span>Salvar Alterações</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .status-preview {
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

  .preview-badge.status-active {
    background: #d1fae5;
    color: #059669;
  }

  .preview-badge.status-maintenance {
    background: #fef3c7;
    color: #d97706;
  }

  .preview-badge.status-inactive {
    background: #fee2e2;
    color: #dc2626;
  }

  .preview-badge i {
    font-size: 1.1rem;
  }
</style>
