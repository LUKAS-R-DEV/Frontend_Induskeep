<script>
  import '$lib/styles/ordens-cadastro.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PieceApi } from '$lib/api/pieces';
  import { StockApi } from '$lib/api/stock';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let pecas = [];
  let pieceId = '';
  let quantity = '';
  let type = 'ENTRY';
  let notes = '';
  let loading = false;
  let error = '';
  let loadingData = true;
  let user = null;

  onMount(async () => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (stored) {
        user = JSON.parse(stored);
        // Se for técnico, define tipo padrão como EXIT
        const userRole = user ? String(user.role || '').toUpperCase().trim() : '';
        if (userRole === 'TECHNICIAN') {
          type = 'EXIT';
        }
      }

      pecas = await PieceApi.list();
    } catch (e) {
      console.error(e);
      error = 'Erro ao carregar peças. Verifique a conexão.';
    } finally {
      loadingData = false;
    }
  });

  async function salvarMovimentacao(e) {
    e.preventDefault();
    
    if (!pieceId || !quantity || !type) {
      error = 'Por favor, preencha todos os campos obrigatórios.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Campos obrigatórios',
        message: error,
      });
      return;
    }

    if (Number(quantity) <= 0) {
      error = 'A quantidade deve ser maior que zero.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Valor inválido',
        message: error,
      });
      return;
    }

    // Validação: técnico só pode fazer saída
    const userRole = user ? String(user.role || '').toUpperCase().trim() : '';
    if (userRole === 'TECHNICIAN' && type !== 'EXIT') {
      error = 'Técnicos podem realizar apenas saídas de estoque.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Tipo inválido',
        message: error,
      });
      return;
    }

    loading = true;
    error = '';

    try {
      const payload = {
        pieceId,
        quantity: Number(quantity),
        type,
        notes: notes || null,
        userId: user?.id || null
      };

      await StockApi.create(payload);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Movimentação registrada com sucesso!',
      });

      setTimeout(() => {
        goto('/estoque/movimentacoes');
      }, 1000);
    } catch (err) {
      console.error(err);
      error = err.message || 'Erro ao salvar movimentação.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
      loading = false;
    }
  }

  function getTypeLabel(type) {
    return type === 'ENTRY' ? 'Entrada' : 'Saída';
  }
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Nova Movimentação</h1>
        <p class="page-subtitle">Registre uma entrada ou saída de peças no estoque</p>
      </div>
      <button class="btn-secondary" on:click={() => goto('/estoque/movimentacoes')}>
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
  {:else if error && !pecas.length}
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
  {:else}
    <!-- Form Card -->
    <div class="form-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-exchange-alt"></i>
          Informações da Movimentação
        </h2>
      </div>

      <form on:submit={salvarMovimentacao} class="form-content">
        <!-- Row: Peça e Quantidade -->
        <div class="form-row">
          <div class="form-group">
            <label for="pieceId">
              <i class="fas fa-box"></i>
              Peça *
            </label>
            <select 
              id="pieceId" 
              bind:value={pieceId} 
              required
              class="form-select"
              disabled={loading}
            >
              <option value="">Selecione a peça</option>
              {#each pecas as p}
                <option value={p.id}>
                  {p.name} ({p.code}) - Estoque: {p.quantity || 0}
                </option>
              {/each}
            </select>
            <small class="form-hint">Selecione a peça que será movimentada</small>
          </div>

          <div class="form-group">
            <label for="quantity">
              <i class="fas fa-hashtag"></i>
              Quantidade *
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              bind:value={quantity}
              placeholder="Ex: 5"
              required
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Quantidade de peças a movimentar</small>
          </div>
        </div>

        <!-- Row: Tipo e Observação -->
        <div class="form-row">
          <div class="form-group">
            <label for="type">
              <i class="fas fa-arrows-alt-v"></i>
              Tipo de Movimentação *
            </label>
            <select 
              id="type" 
              bind:value={type} 
              required
              class="form-select"
              disabled={loading || (user && String(user.role || '').toUpperCase().trim() === 'TECHNICIAN')}
            >
              {#if !user || String(user.role || '').toUpperCase().trim() !== 'TECHNICIAN'}
                <option value="ENTRY">Entrada</option>
              {/if}
              <option value="EXIT">Saída</option>
            </select>
            <small class="form-hint">
              {#if user && String(user.role || '').toUpperCase().trim() === 'TECHNICIAN'}
                <span style="color: #f59e0b;">
                  <i class="fas fa-info-circle"></i>
                  Técnicos podem realizar apenas saídas de estoque.
                </span>
              {:else}
                Entrada aumenta o estoque, saída diminui
              {/if}
            </small>
          </div>

          <div class="form-group">
            <label for="notes">
              <i class="fas fa-comment"></i>
              Observação
            </label>
            <input
              id="notes"
              type="text"
              bind:value={notes}
              placeholder="Ex: Reposição semanal, uso em manutenção..."
              class="form-input"
              disabled={loading}
            />
            <small class="form-hint">Informações adicionais sobre a movimentação</small>
          </div>
        </div>

        <!-- Tipo Badge -->
        <div class="type-preview">
          <div class="preview-badge {type === 'ENTRY' ? 'entry' : 'exit'}">
            <i class="fas fa-{type === 'ENTRY' ? 'arrow-down' : 'arrow-up'}"></i>
            <span>{getTypeLabel(type)} de {quantity || 0} unidade(s)</span>
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
            on:click={() => goto('/estoque/movimentacoes')}
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
              <span>Registrando...</span>
            {:else}
              <i class="fas fa-save"></i>
              <span>Registrar Movimentação</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .type-preview {
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

  .preview-badge.entry {
    background: #d1fae5;
    color: #059669;
  }

  .preview-badge.exit {
    background: #fee2e2;
    color: #dc2626;
  }

  .preview-badge i {
    font-size: 1.1rem;
  }
</style>
