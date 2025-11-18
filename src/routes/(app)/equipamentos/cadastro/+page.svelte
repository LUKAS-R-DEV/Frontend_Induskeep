<script>
  import '$lib/styles/ordens-cadastro.css';
  import { goto } from '$app/navigation';
  import { MachinesApi } from '$lib/api/machines';
  import { onMount } from 'svelte';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let name = '';
  let serial = '';
  let location = '';
  let status = 'ACTIVE';
  let userId = '';
  let loading = false;
  let error = '';
  let loadingUser = true;

  onMount(() => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id;
        }
      }
    } catch (e) {
      console.warn('Falha ao carregar usuário local:', e);
    } finally {
      loadingUser = false;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    if (!userId) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Usuário não autenticado! Faça login novamente.',
      });
      loading = false;
      return;
    }

    if (!name || !serial || !location) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha todos os campos obrigatórios.',
      });
      loading = false;
      return;
    }

    const payload = {
      name,
      serial,
      location,
      userId,
    };

    try {
      await MachinesApi.create(payload);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: `Equipamento "${name}" cadastrado com sucesso!`,
      });

      setTimeout(() => {
        goto('/equipamentos');
      }, 1000);
    } catch (err) {
      error = err.message || 'Erro ao salvar equipamento';
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
        <h1 class="page-title">Cadastro de Equipamento</h1>
        <p class="page-subtitle">Registre um novo equipamento no sistema</p>
      </div>
      <button class="btn-secondary" on:click={() => goto('/equipamentos')}>
        <i class="fas fa-arrow-left"></i>
        Voltar
      </button>
    </div>
  </div>

  {#if loadingUser}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando dados...</p>
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
              Status Inicial
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
              <span>Salvar Equipamento</span>
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
