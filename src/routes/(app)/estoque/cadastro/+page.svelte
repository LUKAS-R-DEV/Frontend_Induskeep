<script>
  import '$lib/styles/ordens-cadastro.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PieceApi } from '$lib/api/pieces';
  import { SettingsApi } from '$lib/api/settings';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let name = '';
  let code = '';
  let quantity = 0;
  let minStock = '';
  let unitPrice = '';
  let settingsMinStock = 5;
  let loading = false;
  let loadingData = true;

  onMount(async () => {
    try {
      const settings = await SettingsApi.get();
      settingsMinStock = settings?.minStockThreshold ?? 5;
    } catch (err) {
      console.warn('⚠️ Falha ao buscar configurações globais:', err);
    } finally {
      loadingData = false;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    if (!name || !code || quantity === null || quantity === '') {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha todos os campos obrigatórios.',
      });
      loading = false;
      return;
    }

    if (Number(quantity) < 0) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Valor inválido',
        message: 'A quantidade não pode ser negativa.',
      });
      loading = false;
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        quantity: Number(quantity),
        minStock: minStock ? Number(minStock) : settingsMinStock,
        unitPrice: unitPrice ? Number(unitPrice) : null,
      };

      await PieceApi.create(payload);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: `Peça "${payload.name}" cadastrada com sucesso!`,
      });

      setTimeout(() => {
        goto('/estoque');
      }, 1000);
    } catch (err) {
      console.error(err);
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: err.message || 'Erro ao cadastrar peça. Tente novamente.',
      });
      loading = false;
    }
  }

  function formatCurrency(value) {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  $: totalValue = quantity && unitPrice ? Number(quantity) * Number(unitPrice) : 0;
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Cadastro de Peça</h1>
        <p class="page-subtitle">Registre uma nova peça no estoque</p>
      </div>
      <button class="btn-secondary" on:click={() => goto('/estoque')}>
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
      <p>Carregando dados...</p>
    </div>
  {:else}
    <!-- Form Card -->
    <div class="form-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-box"></i>
          Informações da Peça
        </h2>
      </div>

      <form on:submit={handleSubmit} class="form-content">
        <!-- Row: Código e Nome -->
        <div class="form-row">
          <div class="form-group">
            <label for="code">
              <i class="fas fa-barcode"></i>
              Código da Peça *
            </label>
            <input 
              id="code" 
              bind:value={code} 
              required
              placeholder="Ex: PECA001"
              class="form-input"
              disabled={loading}
              style="text-transform: uppercase;"
            />
            <small class="form-hint">Código único de identificação da peça</small>
          </div>
          <div class="form-group">
            <label for="name">
              <i class="fas fa-tag"></i>
              Nome da Peça *
            </label>
            <input 
              id="name" 
              bind:value={name} 
              required
              placeholder="Ex: Parafuso M8x20"
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Nome descritivo da peça</small>
          </div>
        </div>

        <!-- Row: Quantidade e Estoque Mínimo -->
        <div class="form-row">
          <div class="form-group">
            <label for="quantity">
              <i class="fas fa-hashtag"></i>
              Quantidade Inicial *
            </label>
            <input 
              id="quantity" 
              type="number" 
              min="0" 
              bind:value={quantity} 
              required
              placeholder="0"
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Quantidade inicial em estoque</small>
          </div>
          <div class="form-group">
            <label for="minStock">
              <i class="fas fa-exclamation-triangle"></i>
              Quantidade Mínima
            </label>
            <input
              id="minStock"
              type="number"
              min="0"
              bind:value={minStock}
              placeholder={`Padrão: ${settingsMinStock}`}
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Estoque mínimo antes de alertar (padrão: {settingsMinStock})</small>
          </div>
        </div>

        <!-- Row: Preço Unitário e Valor Total -->
        <div class="form-row">
          <div class="form-group">
            <label for="unitPrice">
              <i class="fas fa-dollar-sign"></i>
              Custo Unitário (R$)
            </label>
            <input 
              id="unitPrice" 
              type="number" 
              min="0" 
              step="0.01" 
              bind:value={unitPrice}
              placeholder="0.00"
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Preço unitário da peça (opcional)</small>
          </div>
          <div class="form-group">
            <label>
              <i class="fas fa-calculator"></i>
              Valor Total Estimado
            </label>
            <div class="calculated-value">
              {totalValue > 0 ? formatCurrency(totalValue) : 'R$ 0,00'}
            </div>
            <small class="form-hint">Calculado automaticamente (Qtd × Preço Unit.)</small>
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
            on:click={() => goto('/estoque')}
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
              <span>Salvar Peça</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .calculated-value {
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
    color: #1e293b;
    font-size: 1.1rem;
    font-weight: 700;
    text-align: center;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .calculated-value:empty::before {
    content: 'R$ 0,00';
    color: #94a3b8;
  }
</style>
