<script>
  import '$lib/styles/ordens.css';
  import '$lib/styles/ordens-cadastro.css';
  import { page } from '$app/stores';
  import { OrdersApi } from '$lib/api/orders';
  import { HistoryApi } from '$lib/api/history';
  import { PieceApi } from '$lib/api/pieces';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let id = '';
  let ordem = null;
  let loading = true;
  let error = '';
  let user = null;
  let completionNotes = '';
  let pieces = [];
  let availablePieces = [];
  let selectedPieceId = '';
  let selectedQuantity = 1;
  let loadingPieces = false;
  let completingOrder = false;

  onMount(async () => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          user = JSON.parse(stored);
        }
      }

      id = $page.params.id;
      if (!id) {
        throw new Error('ID da ordem não fornecido');
      }

      // Carrega dados da ordem
      ordem = await OrdersApi.get(id);
      
      // Verifica se o usuário pode concluir esta ordem
      if (!user || user.role !== 'TECHNICIAN' || ordem.userId !== user.id) {
        feedback.set({
          show: true,
          type: 'error',
          title: 'Acesso Negado',
          message: 'Você não tem permissão para concluir esta ordem.',
        });
        goto(`/ordens/${id}`);
        return;
      }

      // Verifica se a ordem está em execução (IN_PROGRESS)
      if (ordem.status !== 'IN_PROGRESS') {
        feedback.set({
          show: true,
          type: 'error',
          title: 'Ordem não está em execução',
          message: 'Apenas ordens em execução podem ser concluídas. Inicie a ordem primeiro.',
        });
        goto(`/ordens/${id}`);
        return;
      }

      // Carrega peças disponíveis
      loadingPieces = true;
      try {
        availablePieces = await PieceApi.list();
        availablePieces = Array.isArray(availablePieces) 
          ? availablePieces.filter(p => p.quantity > 0) 
          : [];
      } catch (e) {
        console.error('Erro ao carregar peças:', e);
        availablePieces = [];
      } finally {
        loadingPieces = false;
      }
    } catch (e) {
      console.error('Erro ao carregar ordem:', e);
      error = e?.message || 'Falha ao carregar os detalhes da ordem de serviço.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
    } finally {
      loading = false;
    }
  });

  function addPiece() {
    if (!selectedPieceId || selectedQuantity <= 0) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Selecione uma peça e informe a quantidade.',
      });
      return;
    }

    const piece = availablePieces.find(p => p.id === selectedPieceId);
    if (!piece) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Peça não encontrada.',
      });
      return;
    }

    if (piece.quantity < selectedQuantity) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: `Quantidade insuficiente em estoque. Disponível: ${piece.quantity}`,
      });
      return;
    }

    // Verifica se a peça já foi adicionada
    if (pieces.find(p => p.pieceId === selectedPieceId)) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Esta peça já foi adicionada. Remova e adicione novamente se necessário.',
      });
      return;
    }

    pieces = [...pieces, {
      pieceId: selectedPieceId,
      quantity: selectedQuantity,
      pieceName: piece.name,
      pieceCode: piece.code
    }];

    selectedPieceId = '';
    selectedQuantity = 1;
  }

  function removePiece(index) {
    pieces = pieces.filter((_, i) => i !== index);
  }

  async function completeOrder() {
    if (!completionNotes || completionNotes.trim() === '') {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Por favor, informe as notas de conclusão.',
      });
      return;
    }

    try {
      completingOrder = true;
      
      const payload = {
        orderId: id,
        notes: completionNotes,
        pieces: pieces.map(p => ({
          pieceId: p.pieceId,
          quantity: p.quantity
        }))
      };
      
      await HistoryApi.create(payload);

      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de serviço concluída com sucesso.',
      });

      setTimeout(() => {
        goto(`/ordens/${id}`);
      }, 1000);
    } catch (e) {
      console.error('Erro ao concluir ordem:', e);
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: e?.message || 'Falha ao concluir a ordem de serviço.',
      });
    } finally {
      completingOrder = false;
    }
  }
</script>

<div class="form-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Concluir Ordem de Serviço</h1>
        <p class="page-subtitle">
          {#if ordem}
            {ordem.title}
          {:else}
            Carregando...
          {/if}
        </p>
      </div>
      <button class="btn-secondary" on:click={() => goto(`/ordens/${id}`)}>
        <i class="fas fa-arrow-left"></i>
        Voltar
      </button>
    </div>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando dados...</p>
    </div>
  {:else if error || !ordem}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <h3>Erro ao carregar ordem</h3>
      <p>{error || 'Ordem de serviço não encontrada'}</p>
      <button class="btn-retry" on:click={() => goto('/ordens')}>
        <i class="fas fa-arrow-left"></i>
        Voltar para lista
      </button>
    </div>
  {:else}
    <!-- Form Card -->
    <div class="form-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-check-circle"></i>
          Dados de Conclusão
        </h2>
      </div>

      <div class="form-content">
        <!-- Informações da Ordem -->
        <div class="info-section">
          <h3 class="section-title">
            <i class="fas fa-info-circle"></i>
            Informações da Ordem
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Equipamento:</span>
              <span class="info-value">{ordem.machine?.name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status Atual:</span>
              <span class="info-value">{ordem.status === 'COMPLETED' ? 'Concluída' : ordem.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Pendente'}</span>
            </div>
          </div>
        </div>

        <!-- Notas de Conclusão -->
        <div class="form-group">
          <label for="completionNotes">
            <i class="fas fa-sticky-note"></i>
            Notas de Conclusão *
          </label>
          <textarea
            id="completionNotes"
            bind:value={completionNotes}
            placeholder="Descreva o trabalho realizado, problemas encontrados e soluções aplicadas..."
            rows="6"
            class="form-textarea"
            required
            disabled={completingOrder}
          ></textarea>
          <small class="form-hint">Descreva detalhadamente o que foi feito na manutenção</small>
        </div>

        <!-- Peças Utilizadas -->
        <div class="form-group">
          <label>
            <i class="fas fa-cog"></i>
            Peças Utilizadas (quando aplicável)
          </label>
          
          <!-- Lista de peças adicionadas -->
          {#if pieces.length > 0}
            <div class="pieces-list">
              {#each pieces as piece, index}
                <div class="piece-item">
                  <div class="piece-info">
                    <strong>{piece.pieceName}</strong>
                    <span class="piece-code">{piece.pieceCode}</span>
                    <span class="piece-quantity">Qtd: {piece.quantity}</span>
                  </div>
                  <button 
                    class="btn-remove-piece" 
                    on:click={() => removePiece(index)}
                    title="Remover peça"
                    disabled={completingOrder}
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Formulário para adicionar nova peça -->
          <div class="add-piece-form">
            <div class="form-row">
              <div class="form-col">
                <select 
                  bind:value={selectedPieceId}
                  class="form-select"
                  disabled={loadingPieces || completingOrder}
                >
                  <option value="">Selecione uma peça</option>
                  {#each availablePieces as piece}
                    <option value={piece.id}>
                      {piece.name} ({piece.code}) - Estoque: {piece.quantity}
                    </option>
                  {/each}
                </select>
              </div>
              <div class="form-col-quantity">
                <input
                  type="number"
                  bind:value={selectedQuantity}
                  min="1"
                  placeholder="Qtd"
                  class="form-input"
                  disabled={completingOrder}
                />
              </div>
              <button 
                type="button"
                class="btn-add-piece"
                on:click={addPiece}
                disabled={!selectedPieceId || selectedQuantity <= 0 || completingOrder}
              >
                <i class="fas fa-plus"></i>
                Adicionar
              </button>
            </div>
          </div>
          <small class="form-hint">
            Informe apenas se houve peças substituídas ou consumidas nesta manutenção.
          </small>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn-cancel" 
            on:click={() => goto(`/ordens/${id}`)}
            disabled={completingOrder}
          >
            <i class="fas fa-times"></i>
            Cancelar
          </button>

          <button 
            type="button" 
            class="btn-submit" 
            on:click={completeOrder}
            disabled={completingOrder || !completionNotes || completionNotes.trim() === ''}
          >
            {#if completingOrder}
              <i class="fas fa-spinner fa-spin"></i>
              <span>Concluindo...</span>
            {:else}
              <i class="fas fa-check"></i>
              <span>Concluir Ordem</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .form-container {
    padding: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .info-section {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .section-title i {
    color: #3b82f6;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-value {
    font-size: 1rem;
    color: #1e293b;
    font-weight: 600;
  }

  .pieces-list {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .piece-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .piece-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .piece-info strong {
    color: #1e293b;
    font-weight: 600;
  }

  .piece-code {
    color: #64748b;
    font-size: 0.85rem;
  }

  .piece-quantity {
    color: #3b82f6;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .btn-remove-piece {
    background: #ef4444;
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-remove-piece:hover:not(:disabled) {
    background: #dc2626;
  }

  .btn-remove-piece:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-piece-form {
    margin-top: 1rem;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
  }

  .form-col {
    flex: 1;
  }

  .form-col-quantity {
    width: 120px;
  }

  .form-select,
  .form-input {
    width: 100%;
    padding: 0.875rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: border-color 0.2s ease;
  }

  .form-select:focus,
  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .btn-add-piece {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .btn-add-piece:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-add-piece:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .form-error i {
    color: #dc2626;
  }

  @media (max-width: 768px) {
    .form-container {
      padding: 1rem;
    }

    .form-row {
      flex-direction: column;
      align-items: stretch;
    }

    .form-col-quantity {
      width: 100%;
    }
  }
</style>

