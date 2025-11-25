<script>
  import '$lib/styles/ordens.css';
  import { onMount } from 'svelte';
  import { OrdersApi } from '$lib/api/orders';
  import { goto } from '$app/navigation';
  import { feedback } from '$lib/stores/feedback.stores.js';
  import { hasPermission } from '$lib/utils/permissions.js';

  // ✅ Ícones Lucide
  import {
    Plus,
    Search,
    Filter,
    Calendar,
    X,
    Loader2,
    AlertCircle,
    RotateCcw,
    ClipboardList,
    Hash,
    Factory,
    User,
    Eye,
    Play,
    Pause,
    Pencil,
    Check,
    Trash2,
  } from 'lucide-svelte';

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
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          user = JSON.parse(stored);
        }
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

  function completeOrder(id) {
    // Redireciona para a página de conclusão
    goto(`/ordens/${id}/concluir`);
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

  // Tornar reativo para atualizar quando user mudar
  $: canCreateOrder = (() => {
    if (!user || !user.role) {
      return false;
    }
    return hasPermission(user.role, 'CREATE_ORDER');
  })();

  function canCreate() {
    return canCreateOrder;
  }

  function canUpdate(order = null) {
    if (!user || !hasPermission(user.role, 'UPDATE_ORDER')) {
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
    return user && (hasPermission(user.role, 'DELETE_ORDER') || hasPermission(user.role, 'ALL'));
  }

  function canComplete(order = null) {
    if (!order || !user) return false;
    // Apenas técnicos podem concluir ordens
    const userRole = String(user.role || '').toUpperCase().trim();
    if (userRole !== 'TECHNICIAN') {
      return false;
    }
    // Técnico só pode concluir ordens atribuídas a ele
    if (order.userId !== user.id) {
      return false;
    }
    // OBRIGATÓRIO: Apenas ordens em execução podem ser concluídas
    return order.status === 'IN_PROGRESS';
  }

  function canStart(order = null) {
    if (!order || !user) return false;
    const userRole = String(user.role || '').toUpperCase().trim();
    // Apenas técnicos podem iniciar ordens
    if (userRole !== 'TECHNICIAN') {
      return false;
    }
    // Técnico pode iniciar apenas ordens atribuídas a ele que estejam pendentes
    return order.userId === user.id && order.status === 'PENDING';
  }

  function canPause(order = null) {
    if (!order || !user) return false;
    const userRole = String(user.role || '').toUpperCase().trim();
    // Apenas técnicos podem pausar ordens atribuídas a eles que estejam em andamento
    if (userRole === 'TECHNICIAN') {
      return order.userId === user.id && order.status === 'IN_PROGRESS';
    }
    // Supervisores e admins não podem pausar ordens, apenas cancelar
    return false;
  }

  async function startOrder(id) {
    try {
      const order = ordens.find(o => o.id === id);
      if (!order) {
        throw new Error('Ordem de serviço não encontrada');
      }

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
      
      // Atualiza a ordem na lista
      ordens = ordens.map(o =>
        o.id === id ? { ...o, status: 'IN_PROGRESS' } : o
      );

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

  async function pauseOrder(id) {
    try {
      const order = ordens.find(o => o.id === id);
      if (!order) {
        throw new Error('Ordem de serviço não encontrada');
      }

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
      
      // Atualiza a ordem na lista
      ordens = ordens.map(o =>
        o.id === id ? { ...o, status: 'PENDING' } : o
      );

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

<div class="orders-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Ordens de Serviço</h1>
        <p class="page-subtitle">Gerencie todas as ordens de manutenção</p>
      </div>
      {#if canCreateOrder}
        <button 
          class="btn-primary" 
          on:click={() => goto('/ordens/cadastro')}
          title="Criar nova ordem de serviço"
        >
          <Plus size={18} />
          Nova Ordem
        </button>
      {/if}
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="filters-card">
    <div class="search-wrapper">
      <Search size={18} class="search-icon" />
      <input 
        type="text" 
        class="search-input"
        placeholder="Digite o título, número da OS ou nome do equipamento..." 
        bind:value={search} 
      />
    </div>

    <div class="filters-row">
      <div class="filter-item">
        <label for="statusFilter">
          <Filter size={16} />
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
          <Calendar size={16} />
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
          <X size={16} />
          Limpar Filtros
        </button>
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <Loader2 class="spin" size={32} />
      </div>
      <p>Carregando ordens de serviço...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <AlertCircle size={36} color="#ef4444" />
      </div>
      <h3>Erro ao carregar dados</h3>
      <p>{error}</p>
      <button class="btn-retry" on:click={() => window.location.reload()}>
        <RotateCcw size={18} />
        Tentar novamente
      </button>
    </div>
  {:else if filteredOrders.length > 0}
    <!-- Orders List -->
    <div class="orders-card">
      <div class="card-header">
        <h2 class="card-title">
          <ClipboardList size={20} />
          Ordens de Serviço ({filteredOrders.length})
        </h2>
      </div>

      <div class="orders-list">
        {#each filteredOrders as order}
          <div class="order-card">
            <div class="order-header">
              <div class="order-id">
                <Hash size={16} />
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
                  <Factory size={14} />
                  <span>{order.machine?.name || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <User size={14} />
                  <span>{order.user?.name || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <Calendar size={14} />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>

            <div class="order-actions">
              <button 
                class="action-btn view" 
                on:click={() => {
                  console.log('🔍 [Lista] Botão Ver clicado:', { orderId: order.id, orderTitle: order.title });
                  const targetUrl = `/ordens/${order.id}`;
                  console.log('🔍 [Lista] Redirecionando para:', targetUrl);
                  goto(targetUrl);
                }}
                title="Ver detalhes"
              >
                <Eye size={16} />
                Ver
              </button>
              {#if canStart(order)}
                <button
                  class="action-btn start"
                  on:click={() => startOrder(order.id)}
                  title="Iniciar ordem"
                >
                  <Play size={16} />
                  Iniciar
                </button>
              {/if}
              {#if canPause(order)}
                <button
                  class="action-btn pause"
                  on:click={() => pauseOrder(order.id)}
                  title="Pausar ordem"
                >
                  <Pause size={16} />
                  Pausar
                </button>
              {/if}
              {#if canUpdate(order)}
                <button
                  class="action-btn edit"
                  on:click={() => goto(`/ordens/${order.id}/editar`)}
                  title="Editar"
                >
                  <Pencil size={16} />
                  Editar
                </button>
              {/if}
              {#if canComplete(order)}
                <button
                  class="action-btn complete"
                  on:click={() => completeOrder(order.id)}
                  title="Concluir ordem em execução"
                >
                  <Check size={16} />
                  Concluir
                </button>
              {/if}
              {#if canDelete()}
                <button
                  class="action-btn delete"
                  on:click={() => deleteOrder(order.id)}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">
        <ClipboardList size={32} color="#94a3b8" />
      </div>
      <h3>Nenhuma ordem encontrada</h3>
      <p>{search || statusFilter || dateFilter ? 'Tente ajustar os filtros de busca.' : 'Comece criando uma nova ordem de serviço.'}</p>
      {#if canCreate() && !search && !statusFilter && !dateFilter}
        <button class="btn-primary" on:click={() => goto('/ordens/cadastro')}>
          <Plus size={18} />
          Criar Primeira Ordem
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }

  /* Ícones SVG refinados */
  svg {
    vertical-align: middle;
    stroke-width: 2;
    flex-shrink: 0;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    z-index: 1;
  }

  /* Ajustes para ícones em labels */
  label svg {
    margin-right: 0.5rem;
  }

  /* Ajustes para ícones em botões */
  .btn-primary svg,
  .btn-secondary svg,
  .btn-retry svg,
  .btn-clear-filters svg,
  .action-btn svg {
    flex-shrink: 0;
  }

  /* Ajustes para ícones em meta-items */
  .meta-item svg {
    margin-right: 0.5rem;
    flex-shrink: 0;
  }

  /* Ajustes para card-title */
  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para order-id */
  .order-id {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
