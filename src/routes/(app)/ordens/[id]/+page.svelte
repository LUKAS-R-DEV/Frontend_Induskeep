<script>
  import '$lib/styles/ordens.css';
  import { page } from '$app/stores';
  import { OrdersApi } from '$lib/api/orders';
  import { HistoryApi } from '$lib/api/history';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { hasPermission } from '$lib/utils/permissions.js';

  let id = '';
  let ordem = null;
  let loading = true;
  let error = '';
  let user = null;
  let history = [];

  const statusLabels = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada'
  };

  const statusIcons = {
    PENDING: 'fa-clock',
    IN_PROGRESS: 'fa-spinner',
    COMPLETED: 'fa-check-circle',
    CANCELLED: 'fa-times-circle'
  };

  const statusColors = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444'
  };

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
      
      // Carrega histórico se disponível
      try {
        const historyData = await HistoryApi.get(id);
        history = Array.isArray(historyData) ? historyData : (historyData?.history || []);
        // Ordena histórico por data (mais recente primeiro)
        history.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } catch (e) {
        console.warn('Erro ao carregar histórico:', e);
        history = [];
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

  function getStatusClass(status) {
    const statusUpper = String(status || '').toUpperCase().trim();
    switch (statusUpper) {
      case 'PENDING':
        return 'status-pending';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDateShort(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function getStatusColor(status) {
    const statusUpper = String(status || '').toUpperCase().trim();
    return statusColors[statusUpper] || '#64748b';
  }

  function getStatusIcon(status) {
    const statusUpper = String(status || '').toUpperCase().trim();
    return statusIcons[statusUpper] || 'fa-circle';
  }

  async function excluirOS() {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Confirmar exclusão',
          message: 'Tem certeza que deseja excluir esta ordem de serviço? Esta ação não poderá ser desfeita.',
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      await OrdersApi.remove(id);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de serviço excluída com sucesso.',
      });

      setTimeout(() => {
        goto('/ordens');
      }, 1000);
    } catch (e) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: e?.message || 'Falha ao excluir a ordem de serviço.',
      });
    }
  }

  function canUpdate() {
    return user && hasPermission(user.role, 'UPDATE_ORDER');
  }

  function canDelete() {
    return user && hasPermission(user.role, 'ALL');
  }
</script>

<div class="order-detail-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Detalhes da Ordem de Serviço</h1>
        <p class="page-subtitle">Visualize informações completas da ordem</p>
      </div>
      <button class="btn-secondary" on:click={() => goto('/ordens')}>
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
      <p>Carregando detalhes da ordem...</p>
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
    <!-- Order Header Card -->
    <div class="detail-card order-header-card" style="background: linear-gradient(135deg, {getStatusColor(ordem.status)} 0%, {getStatusColor(ordem.status)}dd 100%);">
      <div class="order-header-content">
        <div class="order-header-left">
          <div class="order-id-large">
            <i class="fas fa-hashtag"></i>
            OS-{(ordem.id || '').slice(0, 8).toUpperCase()}
          </div>
          <h2 class="order-title-large">{ordem.title}</h2>
          <div class="status-badge-container">
            <span class="status-badge-large {getStatusClass(ordem.status)}">
              <i class="fas {getStatusIcon(ordem.status)}"></i>
              {statusLabels[String(ordem.status || '').toUpperCase().trim()] || ordem.status}
            </span>
            {#if ordem.createdAt}
              <span class="order-date-badge">
                <i class="fas fa-calendar"></i>
                Criada em {formatDateShort(ordem.createdAt)}
              </span>
            {/if}
          </div>
        </div>
        <div class="order-header-actions">
          {#if canUpdate()}
            <button 
              class="btn-action edit" 
              on:click={() => goto(`/ordens/${ordem.id}/editar`)}
              title="Editar ordem"
            >
              <i class="fas fa-edit"></i>
              Editar
            </button>
          {/if}
          {#if canDelete()}
            <button 
              class="btn-action delete" 
              on:click={excluirOS}
              title="Excluir ordem"
            >
              <i class="fas fa-trash"></i>
              Excluir
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-grid">
      <!-- Left Column -->
      <div class="left-column">
        <!-- Order Info Card -->
        <div class="detail-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-info-circle"></i>
              Informações da Ordem
            </h3>
          </div>
          <div class="card-content">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">
                  <i class="fas fa-industry"></i>
                  <span>Equipamento</span>
                </div>
                <div class="info-value">{ordem.machine?.name || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>Localização</span>
                </div>
                <div class="info-value">{ordem.machine?.location || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <i class="fas fa-user-tie"></i>
                  <span>Técnico Responsável</span>
                </div>
                <div class="info-value">{ordem.user?.name || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <i class="fas fa-calendar-plus"></i>
                  <span>Data de Abertura</span>
                </div>
                <div class="info-value">{formatDate(ordem.createdAt)}</div>
              </div>
              {#if ordem.updatedAt && ordem.updatedAt !== ordem.createdAt}
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-calendar-edit"></i>
                    <span>Última Atualização</span>
                  </div>
                  <div class="info-value">{formatDate(ordem.updatedAt)}</div>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Description Card -->
        <div class="detail-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-align-left"></i>
              Descrição
            </h3>
          </div>
          <div class="card-content">
            <p class="description-text">{ordem.description || 'Sem descrição disponível.'}</p>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="right-column">
        <!-- Status Timeline Card -->
        <div class="detail-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-history"></i>
              Histórico de Atualizações
            </h3>
          </div>
          <div class="card-content">
            {#if history.length > 0}
              <div class="timeline">
                {#each history as h, index}
                  <div class="timeline-item">
                    <div class="timeline-marker" style="background: {getStatusColor(ordem.status)};">
                      <i class="fas fa-circle"></i>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <div class="timeline-date">
                          <i class="fas fa-clock"></i>
                          {formatDate(h.createdAt)}
                        </div>
                        {#if index === 0}
                          <span class="timeline-badge">Mais recente</span>
                        {/if}
                      </div>
                      <div class="timeline-text">{h.notes || 'Sem observações'}</div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="empty-timeline">
                <i class="fas fa-inbox"></i>
                <p>Nenhum histórico disponível</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Quick Actions Card -->
        {#if canUpdate() || canDelete()}
          <div class="detail-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-bolt"></i>
                Ações Rápidas
              </h3>
            </div>
            <div class="card-content">
              <div class="quick-actions">
                {#if canUpdate()}
                  <button 
                    class="quick-action-btn primary" 
                    on:click={() => goto(`/ordens/${ordem.id}/editar`)}
                  >
                    <i class="fas fa-edit"></i>
                    <span>Editar Ordem</span>
                  </button>
                {/if}
                {#if canDelete()}
                  <button 
                    class="quick-action-btn danger" 
                    on:click={excluirOS}
                  >
                    <i class="fas fa-trash"></i>
                    <span>Excluir Ordem</span>
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .order-detail-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .order-header-card {
    color: white;
    margin-bottom: 2rem;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .order-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    padding: 2rem;
  }

  .order-header-left {
    flex: 1;
  }

  .order-id-large {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    opacity: 0.95;
    margin-bottom: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .order-title-large {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 1.25rem 0;
    color: white;
    line-height: 1.2;
  }

  .status-badge-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .status-badge-large {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.95rem;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .order-date-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    opacity: 0.9;
  }

  .order-header-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .btn-action {
    padding: 0.875rem 1.5rem;
    border-radius: 10px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .btn-action.edit {
    background: rgba(255, 255, 255, 0.25);
    color: white;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .btn-action.edit:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .btn-action.delete {
    background: rgba(239, 68, 68, 0.25);
    color: white;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  .btn-action.delete:hover {
    background: rgba(239, 68, 68, 0.35);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
  }

  .main-grid {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 1.5rem;
  }

  .left-column,
  .right-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .detail-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }

  .detail-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .card-header {
    padding: 1.5rem 2rem;
    border-bottom: 2px solid #f1f5f9;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.15rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .card-title i {
    color: #3b82f6;
    font-size: 1.25rem;
  }

  .card-content {
    padding: 2rem;
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .info-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-label i {
    color: #94a3b8;
    font-size: 1rem;
    width: 20px;
    text-align: center;
  }

  .info-value {
    font-size: 1.1rem;
    color: #1e293b;
    font-weight: 600;
    margin-left: 2rem;
  }

  .description-text {
    line-height: 1.8;
    color: #475569;
    margin: 0;
    font-size: 1rem;
  }

  .timeline {
    position: relative;
    padding-left: 2.5rem;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 0.75rem;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #3b82f6 0%, #e2e8f0 100%);
    border-radius: 2px;
  }

  .timeline-item {
    position: relative;
    margin-bottom: 2rem;
  }

  .timeline-item:last-child {
    margin-bottom: 0;
  }

  .timeline-marker {
    position: absolute;
    left: -2rem;
    top: 0.5rem;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 0 0 3px #e2e8f0, 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1;
  }

  .timeline-marker i {
    font-size: 0.5rem;
    color: white;
  }

  .timeline-content {
    background: #f8fafc;
    padding: 1.25rem;
    border-radius: 12px;
    border-left: 4px solid #3b82f6;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .timeline-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
  }

  .timeline-date i {
    color: #94a3b8;
  }

  .timeline-badge {
    padding: 0.25rem 0.75rem;
    background: #3b82f6;
    color: white;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .timeline-text {
    font-size: 0.95rem;
    color: #1e293b;
    line-height: 1.6;
  }

  .empty-timeline {
    text-align: center;
    padding: 3rem 2rem;
    color: #94a3b8;
  }

  .empty-timeline i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-timeline p {
    margin: 0;
    font-weight: 600;
  }

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .quick-action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .quick-action-btn.primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }

  .quick-action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
  }

  .quick-action-btn.danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  .quick-action-btn.danger:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
  }

  .quick-action-btn i {
    font-size: 1.1rem;
  }

  @media (max-width: 1024px) {
    .main-grid {
      grid-template-columns: 1fr;
    }

    .right-column {
      order: -1;
    }
  }

  @media (max-width: 768px) {
    .order-detail-container {
      padding: 1rem;
    }

    .order-header-content {
      flex-direction: column;
      padding: 1.5rem;
    }

    .order-title-large {
      font-size: 1.5rem;
    }

    .card-content {
      padding: 1.5rem;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
    }
  }
</style>
