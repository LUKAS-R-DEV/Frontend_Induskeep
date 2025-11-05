<script>
  import '$lib/styles/ordens.css';
  import { onMount } from 'svelte';
  import { OrdersApi } from '$lib/api/orders';
  import { HistoryApi } from '$lib/api/history';
  import { NotificationsApi } from '$lib/api/notifications';
  import { goto } from '$app/navigation';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { hasPermission } from '$lib/utils/permissions.js';

  let search = '';
  let statusFilter = '';
  let dateFilter = '';
  let ordens = [];
  let error = '';
  let loading = true;
  let user = null;

  const statusLabels = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada'
  };

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        user = JSON.parse(stored);
      }
      const data = await OrdersApi.list();
      ordens = Array.isArray(data) ? data : [];
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  const up = (v) => (v ?? '').toString().trim().toUpperCase();
  const dateISO = (d) => new Date(d).toISOString().slice(0, 10);

  $: filteredOrders = ordens
    .filter(os => up(os.status) !== 'COMPLETED')
    .filter(os => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (os.title || '').toLowerCase().includes(q) ||
        (os.id || '').toLowerCase().includes(q) ||
        (os.machine?.name || '').toLowerCase().includes(q)
      );
    })
    .filter(os => !statusFilter || up(os.status) === up(statusFilter))
    .filter(os => {
      if (!dateFilter) return true;
      try {
        return dateISO(os.createdAt) === dateFilter;
      } catch {
        return false;
      }
    });

  async function deleteOrder(id) {
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
      ordens = ordens.filter(o => o.id !== id);
      
      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de serviço excluída com sucesso.',
      });
    } catch (e) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: e?.message || 'Falha ao excluir a ordem de serviço.',
      });
    }
  }

  async function completeOrder(id) {
    try {
      const confirmed = await new Promise((resolve) => {
        feedback.set({
          show: true,
          type: 'confirm',
          title: 'Concluir ordem',
          message: 'Deseja marcar esta ordem de serviço como concluída?',
          confirmCallback: () => resolve(true)
        });
      });

      if (!confirmed) return;

      const order = ordens.find(o => o.id === id);
      if (!order) {
        throw new Error('Ordem de serviço não encontrada');
      }

      await HistoryApi.create({
        orderId: id,
        notes: 'Ordem de serviço concluída pelo sistema'
      });

      const notificationPayload = {
        title: 'Ordem de serviço concluída',
        message: `Ordem de serviço concluída: ${order.title}`,
        userId: order.userId,
      };
      await NotificationsApi.create(notificationPayload);

      ordens = ordens.map(order => 
        order.id === id ? { ...order, status: 'COMPLETED' } : order
      );

      feedback.set({
        show: true,
        type: 'success',
        title: 'Sucesso',
        message: 'Ordem de serviço concluída com sucesso.',
      });
    } catch (e) {
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: e?.message || 'Falha ao concluir a ordem de serviço.',
      });
    }
  }

  function getStatusClass(status) {
    const statusUpper = up(status);
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
      year: 'numeric'
    });
  }

  function canCreate() {
    return user && hasPermission(user.role, 'CREATE_ORDER');
  }

  function canUpdate() {
    return user && hasPermission(user.role, 'UPDATE_ORDER');
  }
</script>

<div class="orders-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Ordens de Serviço</h1>
        <p class="page-subtitle">Gerencie todas as ordens de manutenção</p>
      </div>
      <button 
        class="btn-primary" 
        on:click={() => {
          if (canCreate()) {
            goto('/ordens/cadastro');
          }
        }}
        disabled={!canCreate()}
        title={canCreate() ? 'Criar nova ordem de serviço' : 'Você não tem permissão para criar ordens'}
      >
        <i class="fas fa-plus"></i>
        Nova Ordem
      </button>
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="filters-card">
    <div class="search-wrapper">
      <i class="fas fa-search search-icon"></i>
      <input 
        type="text" 
        class="search-input"
        placeholder="Buscar por título, ID ou equipamento..." 
        bind:value={search} 
      />
    </div>

    <div class="filters-row">
      <div class="filter-item">
        <label for="statusFilter">
          <i class="fas fa-filter"></i>
          Status
        </label>
        <select id="statusFilter" bind:value={statusFilter} class="filter-select">
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="IN_PROGRESS">Em Andamento</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="dateFilter">
          <i class="fas fa-calendar"></i>
          Data de Abertura
        </label>
        <input 
          type="date" 
          id="dateFilter" 
          bind:value={dateFilter} 
          class="filter-input"
        />
      </div>

      {#if search || statusFilter || dateFilter}
        <button class="btn-clear-filters" on:click={() => { search = ''; statusFilter = ''; dateFilter = ''; }}>
          <i class="fas fa-times"></i>
          Limpar Filtros
        </button>
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando ordens de serviço...</p>
    </div>
  {:else if error}
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
  {:else if filteredOrders.length > 0}
    <!-- Orders List -->
    <div class="orders-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-tasks"></i>
          Ordens de Serviço ({filteredOrders.length})
        </h2>
      </div>

      <div class="orders-list">
        {#each filteredOrders as order}
          <div class="order-card">
            <div class="order-header">
              <div class="order-id">
                <i class="fas fa-hashtag"></i>
                OS-{(order.id || '').slice(0, 8).toUpperCase()}
              </div>
              <span class="status-badge {getStatusClass(order.status)}">
                {statusLabels[up(order.status)] || order.status}
              </span>
            </div>

            <div class="order-body">
              <h3 class="order-title">{order.title}</h3>
              {#if order.description}
                <p class="order-description">{order.description}</p>
              {/if}

              <div class="order-meta">
                <div class="meta-item">
                  <i class="fas fa-industry"></i>
                  <span>{order.machine?.name || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-user"></i>
                  <span>{order.user?.name || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-calendar"></i>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>

            <div class="order-actions">
              <button 
                class="action-btn view" 
                on:click={() => goto(`/ordens/${order.id}`)}
                title="Ver detalhes"
              >
                <i class="fas fa-eye"></i>
                Ver
              </button>
              {#if canUpdate()}
                <button
                  class="action-btn edit"
                  on:click={() => goto(`/ordens/${order.id}/editar`)}
                  title="Editar"
                >
                  <i class="fas fa-edit"></i>
                  Editar
                </button>
              {/if}
              <button
                class="action-btn complete"
                on:click={() => completeOrder(order.id)}
                disabled={order.status === 'COMPLETED'}
                title="Concluir"
              >
                <i class="fas fa-check"></i>
                Concluir
              </button>
              <button
                class="action-btn delete"
                on:click={() => deleteOrder(order.id)}
                title="Excluir"
              >
                <i class="fas fa-trash"></i>
                Excluir
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-clipboard-list"></i>
      </div>
      <h3>Nenhuma ordem encontrada</h3>
      <p>{search || statusFilter || dateFilter ? 'Tente ajustar os filtros de busca.' : 'Comece criando uma nova ordem de serviço.'}</p>
      {#if canCreate() && !search && !statusFilter && !dateFilter}
        <button class="btn-primary" on:click={() => goto('/ordens/cadastro')}>
          <i class="fas fa-plus"></i>
          Criar Primeira Ordem
        </button>
      {/if}
    </div>
  {/if}
</div>
