<script>
  import '$lib/styles/ordens.css';
  import { page } from '$app/stores';
  import { OrdersApi } from '$lib/api/orders';
  import { HistoryApi } from '$lib/api/history';
  import { OrderItemsApi } from '$lib/api/orderItems';
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
  let orderItems = [];
  let loadingItems = false;

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
    console.log('🚀 [Frontend] Página de detalhes montada!');
    console.log('🚀 [Frontend] URL atual:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          user = JSON.parse(stored);
          console.log('👤 [Frontend] Usuário carregado:', { id: user?.id, role: user?.role });
        }
      }

      id = $page.params.id;
      console.log('🔍 [Frontend] Parâmetros da página:', { 
        params: $page.params, 
        id,
        idType: typeof id,
        idLength: id?.length 
      });
      
      if (!id || id.trim().length === 0) {
        console.error('❌ [Frontend] ID da ordem não fornecido');
        throw new Error('ID da ordem não fornecido');
      }

      // Limpa o ID (remove aspas e espaços)
      id = String(id).replace(/['"]+/g, "").trim();
      
      if (id.length < 30) {
        console.error('❌ [Frontend] ID muito curto, formato inválido:', id);
        throw new Error('Formato de ID inválido');
      }

      // Carrega dados da ordem
      console.log('🔍 [Frontend] Tentando carregar ordem:', id);
      try {
        ordem = await OrdersApi.get(id);
        console.log('✅ [Frontend] Ordem carregada:', ordem ? {
          id: ordem.id,
          status: ordem.status,
          title: ordem.title
        } : 'Não');
      } catch (apiError) {
        console.error('❌ [Frontend] Erro na API ao carregar ordem:', {
          message: apiError?.message,
          status: apiError?.status,
          response: apiError?.response,
          stack: apiError?.stack
        });
        
        // Se for erro 403 (permissão), mostra mensagem específica
        if (apiError?.status === 403 || apiError?.response?.status === 403) {
          error = 'Você não tem permissão para visualizar esta ordem de serviço.';
          feedback.set({
            show: true,
            type: 'error',
            title: 'Acesso Negado',
            message: error,
          });
          setTimeout(() => {
            goto('/ordens');
          }, 2000);
          loading = false;
          return;
        }
        // Se for erro 404, mostra mensagem específica
        if (apiError?.status === 404 || apiError?.response?.status === 404) {
          error = 'Ordem de serviço não encontrada.';
          feedback.set({
            show: true,
            type: 'error',
            title: 'Não Encontrada',
            message: error,
          });
          setTimeout(() => {
            goto('/ordens');
          }, 2000);
          loading = false;
          return;
        }
        // Para outros erros, propaga
        throw apiError;
      }
      
      if (!ordem) {
        console.error('❌ [Frontend] Ordem retornada é null/undefined');
        throw new Error('Ordem não encontrada');
      }
      
      // Carrega histórico e constrói timeline
      try {
        await buildTimeline();
      } catch (timelineError) {
        console.error('Erro ao carregar timeline (não crítico):', timelineError);
        // Continua mesmo se a timeline falhar
      }
      
      // Carrega peças utilizadas (apenas se ordem estiver concluída)
      // Faz isso de forma assíncrona para não bloquear o carregamento da página
      if (ordem && ordem.status === 'COMPLETED') {
        loadOrderItems().catch(err => {
          console.error('Erro ao carregar peças (não crítico):', err);
          // Não mostra erro para o usuário, apenas loga
        });
      }
    } catch (e) {
      console.error('Erro ao carregar ordem:', e);
      console.error('Detalhes do erro:', {
        message: e?.message,
        status: e?.status,
        response: e?.response
      });
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

  // Função auxiliar para construir a timeline
  async function loadOrderItems() {
    try {
      loadingItems = true;
      // Só carrega peças se a ordem estiver concluída
      if (ordem && ordem.status === 'COMPLETED') {
        const items = await OrderItemsApi.findByOrder(id);
        orderItems = Array.isArray(items) ? items : [];
      } else {
        orderItems = [];
      }
    } catch (e) {
      console.error('Erro ao carregar peças utilizadas:', e);
      // Não mostra erro para o usuário, apenas loga
      orderItems = [];
    } finally {
      loadingItems = false;
    }
  }

  async function buildTimeline() {
    if (!ordem) return;
    
    try {
      const historyData = await HistoryApi.get(id);
      
      // Verifica se é array ou objeto com propriedade history
      let historyRecords = [];
      if (Array.isArray(historyData)) {
        historyRecords = historyData;
      } else if (historyData && Array.isArray(historyData.history)) {
        historyRecords = historyData.history;
      } else if (historyData && historyData.data && Array.isArray(historyData.data)) {
        historyRecords = historyData.data;
      }
      
      // Constrói timeline com eventos da ordem
      history = [];
      
      // 1. Adiciona criação da ordem
      if (ordem.createdAt) {
        history.push({
          type: 'created',
          date: ordem.createdAt,
          notes: `Ordem de serviço criada`,
          status: ordem.status
        });
      }
      
      // 2. Adiciona histórico de conclusão (se existir)
      if (historyRecords && historyRecords.length > 0) {
        historyRecords.forEach(h => {
          history.push({
            type: 'completed',
            date: h.completedAt || h.createdAt,
            notes: h.notes || 'Ordem de serviço concluída',
            status: 'COMPLETED'
          });
        });
      }
      
      // 3. Adiciona atualização (se diferente da criação)
      if (ordem.updatedAt && ordem.updatedAt !== ordem.createdAt) {
        // Verifica se não é a mesma data da conclusão
        const isUpdate = !historyRecords.some(h => {
          const completedDate = new Date(h.completedAt || h.createdAt).getTime();
          const updatedDate = new Date(ordem.updatedAt).getTime();
          return Math.abs(completedDate - updatedDate) < 1000; // menos de 1 segundo de diferença
        });
        
        if (isUpdate) {
          history.push({
            type: 'updated',
            date: ordem.updatedAt,
            notes: `Ordem atualizada`,
            status: ordem.status
          });
        }
      }
      
      // Ordena timeline por data (mais recente primeiro)
      history.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      });
    } catch (e) {
      console.warn('Erro ao carregar histórico:', e);
      // Mesmo com erro, mostra pelo menos a criação
      history = [];
      if (ordem.createdAt) {
        history.push({
          type: 'created',
          date: ordem.createdAt,
          notes: `Ordem de serviço criada`,
          status: ordem.status
        });
      }
    }
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
    if (!user || !hasPermission(user.role, 'UPDATE_ORDER')) {
      return false;
    }
    // Ordens concluídas não podem ser editadas
    if (ordem && ordem.status === 'COMPLETED') {
      return false;
    }
    // Técnicos não podem editar (removido botão editar para técnicos)
    const userRole = user ? String(user.role || '').toUpperCase().trim() : '';
    if (userRole === 'TECHNICIAN') {
      return false;
    }
    return true;
  }

  function canDelete() {
    // Ordens concluídas não podem ser excluídas
    if (ordem && ordem.status === 'COMPLETED') {
      return false;
    }
    return user && (hasPermission(user.role, 'DELETE_ORDER') || hasPermission(user.role, 'ALL'));
  }

  function canComplete() {
    if (!ordem || !user) return false;
    // Apenas técnicos podem concluir ordens
    const userRole = String(user.role || '').toUpperCase().trim();
    if (userRole !== 'TECHNICIAN') return false;
    // Técnico só pode concluir ordens atribuídas a ele
    if (ordem.userId !== user.id) return false;
    // OBRIGATÓRIO: Apenas ordens em execução podem ser concluídas
    return ordem.status === 'IN_PROGRESS';
  }

  function canStart() {
    if (!ordem || !user) return false;
    // Ordens concluídas não podem ser iniciadas
    if (ordem.status === 'COMPLETED') {
      return false;
    }
    const userRole = String(user.role || '').toUpperCase().trim();
    // Apenas técnicos podem iniciar ordens
    if (userRole !== 'TECHNICIAN') {
      return false;
    }
    // Técnico pode iniciar apenas ordens atribuídas a ele que estejam pendentes
    return ordem.userId === user.id && ordem.status === 'PENDING';
  }

  function canPause() {
    if (!ordem || !user) return false;
    // Ordens concluídas não podem ser pausadas
    if (ordem.status === 'COMPLETED') {
      return false;
    }
    const userRole = String(user.role || '').toUpperCase().trim();
    // Apenas técnicos podem pausar ordens atribuídas a eles que estejam em andamento
    if (userRole === 'TECHNICIAN') {
      return ordem.userId === user.id && ordem.status === 'IN_PROGRESS';
    }
    // Supervisores e admins não podem pausar ordens, apenas cancelar
    return false;
  }

  async function startOrder() {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Iniciar ordem',
          message: 'Deseja iniciar esta ordem de serviço? A máquina será colocada em manutenção.',
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      await OrdersApi.update(id, { status: 'IN_PROGRESS' });
      
      // Recarrega os dados da ordem
      ordem = await OrdersApi.get(id);
      
      // Reconstrói a timeline
      await buildTimeline();

      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de serviço iniciada com sucesso.',
      });
    } catch (e) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: e?.message || 'Falha ao iniciar a ordem de serviço.',
      });
    }
  }

  async function pauseOrder() {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Pausar ordem',
          message: 'Deseja pausar esta ordem de serviço? A máquina voltará ao status anterior.',
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      await OrdersApi.update(id, { status: 'PENDING' });
      
      // Recarrega os dados da ordem
      ordem = await OrdersApi.get(id);
      
      // Reconstrói a timeline
      await buildTimeline();

      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de serviço pausada com sucesso.',
      });
    } catch (e) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: e?.message || 'Falha ao pausar a ordem de serviço.',
      });
    }
  }

</script>

<div class="order-detail-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Detalhes da Ordem de Serviço</h1>
        <p class="page-subtitle">
          {#if ordem && ordem.status === 'COMPLETED'}
            Ordem concluída - Apenas visualização
          {:else}
            Visualize informações completas da ordem
          {/if}
        </p>
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
      <p style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">
        ID: {id || 'N/A'}
      </p>
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
              {#if ordem.createdBy && ordem.createdBy.id !== ordem.user?.id}
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-user-cog"></i>
                    <span>Gerador da Ordem</span>
                  </div>
                  <div class="info-value">{ordem.createdBy?.name || 'N/A'}</div>
                </div>
              {/if}
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

        <!-- Peças Utilizadas Card -->
        {#if ordem.status === 'COMPLETED'}
          <div class="detail-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-cog"></i>
                Peças Utilizadas
              </h3>
            </div>
            <div class="card-content">
              {#if loadingItems}
                <div class="loading-items">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Carregando peças...</span>
                </div>
              {:else if orderItems.length > 0}
                <div class="pieces-list">
                  {#each orderItems as item}
                    <div class="piece-item">
                      <div class="piece-info">
                        <div class="piece-name">
                          <i class="fas fa-box"></i>
                          <strong>{item.piece?.name || 'Peça não encontrada'}</strong>
                        </div>
                        <div class="piece-details">
                          <span class="piece-code">
                            <i class="fas fa-barcode"></i>
                            {item.piece?.code || 'N/A'}
                          </span>
                          <span class="piece-quantity">
                            <i class="fas fa-hashtag"></i>
                            Quantidade: {item.quantity}
                          </span>
                        </div>
                        <div class="piece-date">
                          <i class="fas fa-calendar"></i>
                          Utilizada em: {formatDate(item.usedAt)}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-pieces">
                  <i class="fas fa-info-circle"></i>
                  <span>Nenhuma peça foi registrada para esta ordem.</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
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
                    <div class="timeline-marker" style="background: {getStatusColor(h.status || ordem.status)};">
                      <i class="fas fa-circle"></i>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <div class="timeline-date">
                          <i class="fas fa-clock"></i>
                          {formatDate(h.date || h.completedAt || h.createdAt)}
                        </div>
                        {#if index === 0}
                          <span class="timeline-badge">Mais recente</span>
                        {/if}
                      </div>
                      <div class="timeline-text">{h.notes || 'Sem observações'}</div>
                      {#if h.type === 'completed'}
                        <div class="timeline-type-badge completed">
                          <i class="fas fa-check-circle"></i>
                          Concluída
                        </div>
                      {:else if h.type === 'created'}
                        <div class="timeline-type-badge created">
                          <i class="fas fa-plus-circle"></i>
                          Criada
                        </div>
                      {:else if h.type === 'updated'}
                        <div class="timeline-type-badge updated">
                          <i class="fas fa-edit"></i>
                          Atualizada
                        </div>
                      {/if}
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
                {#if canStart()}
                  <button 
                    class="quick-action-btn start" 
                    on:click={startOrder}
                    title="Iniciar ordem de serviço"
                  >
                    <i class="fas fa-play-circle"></i>
                    <span>Iniciar Ordem</span>
                  </button>
                {/if}
                {#if canPause()}
                  <button 
                    class="quick-action-btn pause" 
                    on:click={pauseOrder}
                    title="Pausar ordem de serviço"
                  >
                    <i class="fas fa-pause-circle"></i>
                    <span>Pausar Ordem</span>
                  </button>
                {/if}
                {#if canComplete()}
                  <button 
                    class="quick-action-btn success" 
                    on:click={() => goto(`/ordens/${ordem.id}/concluir`)}
                    title="Concluir ordem em execução"
                  >
                    <i class="fas fa-check-circle"></i>
                    <span>Concluir Ordem</span>
                  </button>
                {/if}
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
    position: relative;
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
    margin-bottom: 0.5rem;
  }

  .timeline-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  .loading-items {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    color: #64748b;
    font-size: 0.95rem;
  }

  .pieces-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .piece-item {
    padding: 1rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .piece-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .piece-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .piece-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    color: #1e293b;
  }

  .piece-name i {
    color: #3b82f6;
  }

  .piece-details {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.25rem;
  }

  .piece-code,
  .piece-quantity {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .piece-code i,
  .piece-quantity i {
    color: #94a3b8;
  }

  .piece-quantity {
    color: #3b82f6;
    font-weight: 600;
  }

  .piece-date {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }

  .piece-date i {
    color: #cbd5e1;
  }

  .empty-pieces {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    color: #64748b;
    font-size: 0.95rem;
    text-align: center;
    justify-content: center;
  }

  .empty-pieces i {
    color: #94a3b8;
  }

  .timeline-type-badge.completed {
    background: #d1fae5;
    color: #059669;
  }

  .timeline-type-badge.created {
    background: #dbeafe;
    color: #2563eb;
  }

  .timeline-type-badge.updated {
    background: #fef3c7;
    color: #d97706;
  }

  .timeline-type-badge i {
    font-size: 0.7rem;
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

  .quick-action-btn.success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .quick-action-btn.success:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
  }

  .quick-action-btn.start {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }

  .quick-action-btn.start:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
  }

  .quick-action-btn.pause {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  .quick-action-btn.pause:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
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

  .btn-remove-piece:hover {
    background: #dc2626;
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
    width: 100px;
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

  .modal-footer {
    display: flex;
    gap: 1rem;
    padding: 1.5rem 2rem;
    border-top: 2px solid #f1f5f9;
    justify-content: flex-end;
  }

  .btn-cancel {
    padding: 0.875rem 1.5rem;
    background: #f1f5f9;
    color: #64748b;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-cancel:hover:not(:disabled) {
    background: #e2e8f0;
  }

  .btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-submit {
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
