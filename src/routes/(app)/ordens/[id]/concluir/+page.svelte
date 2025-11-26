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
  let showConfirmationModal = false;

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

  function showConfirmation() {
    if (!completionNotes || completionNotes.trim() === '') {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: 'Por favor, informe as notas de conclusão.',
      });
      return;
    }
    showConfirmationModal = true;
  }

  function closeConfirmation() {
    showConfirmationModal = false;
  }

  async function confirmCompleteOrder() {
    try {
      completingOrder = true;
      showConfirmationModal = false;
      
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
            on:click={showConfirmation}
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

  <!-- Modal de Confirmação -->
  {#if showConfirmationModal}
    <div class="modal-overlay" on:click={closeConfirmation} on:keydown={(e) => e.key === 'Escape' && closeConfirmation()}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <h2 class="modal-title">
            <i class="fas fa-check-circle"></i>
            Confirmar Conclusão da Ordem
          </h2>
          <button class="modal-close" on:click={closeConfirmation} disabled={completingOrder}>
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="confirmation-section">
            <h3 class="confirmation-section-title">
              <i class="fas fa-info-circle"></i>
              Dados que serão enviados:
            </h3>

            <!-- Informações da Ordem -->
            <div class="confirmation-item">
              <div class="confirmation-label">
                <i class="fas fa-clipboard-list"></i>
                Ordem de Serviço:
              </div>
              <div class="confirmation-value">
                <strong>{ordem?.title || 'N/A'}</strong>
                <span class="confirmation-subtext">Equipamento: {ordem?.machine?.name || 'N/A'}</span>
              </div>
            </div>

            <!-- Notas de Conclusão -->
            <div class="confirmation-item">
              <div class="confirmation-label">
                <i class="fas fa-sticky-note"></i>
                Notas de Conclusão:
              </div>
              <div class="confirmation-value">
                <div class="notes-preview">{completionNotes || 'N/A'}</div>
              </div>
            </div>

            <!-- Peças Utilizadas -->
            <div class="confirmation-item">
              <div class="confirmation-label">
                <i class="fas fa-cog"></i>
                Peças Utilizadas:
              </div>
              <div class="confirmation-value">
                {#if pieces.length > 0}
                  <div class="pieces-confirmation-list">
                    {#each pieces as piece}
                      <div class="piece-confirmation-item">
                        <i class="fas fa-check-circle"></i>
                        <span><strong>{piece.pieceName}</strong> ({piece.pieceCode})</span>
                        <span class="piece-quantity-badge">Qtd: {piece.quantity}</span>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <span class="no-pieces">Nenhuma peça foi adicionada</span>
                {/if}
              </div>
            </div>
          </div>

          {#if pieces.length > 0}
            <div class="confirmation-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <div>
                <strong>Atenção:</strong> Você adicionou {pieces.length} peça(s) a esta ordem. 
                Ao confirmar, essas peças serão registradas no histórico e o estoque será atualizado.
              </div>
            </div>
          {/if}

          <div class="confirmation-question">
            <i class="fas fa-question-circle"></i>
            <span>Deseja realmente concluir esta ordem de serviço?</span>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            type="button" 
            class="btn-modal-cancel" 
            on:click={closeConfirmation}
            disabled={completingOrder}
          >
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn-modal-confirm" 
            on:click={confirmCompleteOrder}
            disabled={completingOrder}
          >
            {#if completingOrder}
              <i class="fas fa-spinner fa-spin"></i>
              <span>Concluindo...</span>
            {:else}
              <i class="fas fa-check"></i>
              <span>Sim, Concluir Ordem</span>
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

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .modal-title i {
    color: #3b82f6;
  }

  .modal-close {
    background: none;
    border: none;
    color: #64748b;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .modal-close:hover:not(:disabled) {
    background: #f1f5f9;
    color: #1e293b;
  }

  .modal-close:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .confirmation-section {
    margin-bottom: 1.5rem;
  }

  .confirmation-section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .confirmation-section-title i {
    color: #3b82f6;
  }

  .confirmation-item {
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .confirmation-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .confirmation-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
  }

  .confirmation-label i {
    color: #3b82f6;
  }

  .confirmation-value {
    font-size: 0.95rem;
    color: #1e293b;
  }

  .confirmation-value strong {
    font-weight: 600;
    color: #1e293b;
  }

  .confirmation-subtext {
    display: block;
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .notes-preview {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    white-space: pre-wrap;
    max-height: 150px;
    overflow-y: auto;
    line-height: 1.6;
  }

  .pieces-confirmation-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .piece-confirmation-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .piece-confirmation-item i {
    color: #10b981;
    font-size: 1rem;
  }

  .piece-quantity-badge {
    margin-left: auto;
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .no-pieces {
    color: #94a3b8;
    font-style: italic;
  }

  .confirmation-warning {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: #fef3c7;
    border: 2px solid #fbbf24;
    border-radius: 12px;
    margin: 1.5rem 0;
  }

  .confirmation-warning i {
    color: #d97706;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .confirmation-warning div {
    color: #92400e;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .confirmation-warning strong {
    font-weight: 700;
  }

  .confirmation-question {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem;
    background: #eff6ff;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    color: #1e40af;
    margin-top: 1.5rem;
  }

  .confirmation-question i {
    color: #3b82f6;
    font-size: 1.25rem;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 2px solid #e2e8f0;
    justify-content: flex-end;
  }

  .btn-modal-cancel,
  .btn-modal-confirm {
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
  }

  .btn-modal-cancel {
    background: #f1f5f9;
    color: #64748b;
  }

  .btn-modal-cancel:hover:not(:disabled) {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-modal-confirm {
    background: #10b981;
    color: white;
  }

  .btn-modal-confirm:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .btn-modal-cancel:disabled,
  .btn-modal-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .modal-content {
      max-height: 95vh;
    }

    .modal-footer {
      flex-direction: column;
    }

    .btn-modal-cancel,
    .btn-modal-confirm {
      width: 100%;
      justify-content: center;
    }
  }
</style>

