<script>
  import '$lib/styles/ordens.css';
  import { onMount } from 'svelte';
  import { OrdersApi } from '$lib/api/orders';
  import {HistoryApi} from '$lib/api/history';
  import {NotificationsApi} from '$lib/api/notifications';
  import { goto } from '$app/navigation';

  let search = '';
  let statusFilter = '';
  let dateFilter = ''; // YYYY-MM-DD

  let ordens = [];
  let error = '';
  let loading = true;

  const statusLabels = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada'
  };

  onMount(async () => {
    try {
      const data = await OrdersApi.list();
      ordens = Array.isArray(data) ? data : [];
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  // helpers
  const up = (v) => (v ?? '').toString().trim().toUpperCase();
  const dateISO = (d) => new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD

  // Filtros reativos
  $: filteredOrders = ordens
  // remove concluídas
  .filter(os => up(os.status) !== 'COMPLETED')
  // busca
  .filter(os => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (os.title || '').toLowerCase().includes(q) ||
      (os.id || '').toLowerCase().includes(q) ||
      (os.machine?.name || '').toLowerCase().includes(q)
    );
  })
  // status
  .filter(os => !statusFilter || up(os.status) === up(statusFilter))
  // data
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
      const ok = confirm('Tem certeza que deseja excluir esta OS? Esta ação não poderá ser desfeita.');
      if (!ok) return;
      await OrdersApi.remove(id);
      ordens = ordens.filter(o => o.id !== id);
    } catch (e) {
      alert(e?.message || 'Falha ao excluir a OS');
    }
  }
  async function completeOrder(id) {
  try {
    let concluida = false;
    const ok = confirm('Deseja marcar esta OS como concluída?');
    if (!ok) return;
    
    const order = ordens.find(o => o.id === id);
    if (!order) {
      throw new Error('Ordem de serviço não encontrada');
    }
    await HistoryApi.create({
      orderId: id,
      notes: 'Ordem de serviço concluída pelo sistema'
    });
    concluida = true;

    if (concluida==true){
      alert('Ordem de serviço concluida com sucesso');

      const notificationPayload = {
        title: 'Ordem de serviço concluida',
        message: `Ordem de serviço concluida: ${order.title}`,
        userId: order.userId,
      };
      await NotificationsApi.create(notificationPayload);

      
    }
    ordens = ordens.map(order => 
      order.id === id ? { ...order, status: 'COMPLETED' } : order
      
    );

  } catch (e) {
    alert(e?.message || 'Falha ao concluir a OS');
  }
}

  

  function getStatusClass(status) {
    switch (status) {
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
</script>

<div class="page-header">
  <h1>🔧 Ordens de Serviço</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar ordem de serviço..." bind:value={search} />
  </div>
  <button class="btn-primary" on:click={() => goto('/ordens/cadastro')}>
    <i class="fas fa-plus"></i> Nova OS
  </button>
</div>

<div class="filters">
  <div class="filter-group">
    <label for="statusFilter">Status</label>
    <select id="statusFilter" bind:value={statusFilter}>
      <option value="">Todos</option>
      <option value="PENDING">Pendente</option>
      <option value="IN_PROGRESS">Em Andamento</option>
      <option value="CANCELLED">Cancelada</option>
    </select>
  </div>

  <div class="filter-group">
    <label for="dateFilter">Data de abertura</label>
    <input type="date" id="dateFilter" bind:value={dateFilter} />
  </div>
</div>

{#if loading}
  <div class="loading-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Carregando ordens...</p>
  </div>
{:else if error}
  <div class="error-state">
    <i class="fas fa-exclamation-circle"></i>
    <p>{error}</p>
  </div>
{:else}
  <div class="page-section">
    <h2>Lista de Ordens de Serviço</h2>
    {#if filteredOrders.length > 0}
      <div class="table-wrapper">
        <table class="standard-table">
        <thead>
          <tr>
            <th>Nº OS</th>
            <th>Título</th>
            <th>Equipamento</th>
            <th>Data Abertura</th>
            <th>Técnico</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredOrders as os}
            <tr>
              <td>{(os.id || '').slice(0, 6).toUpperCase()}</td>
              <td>{os.title}</td>
              <td>{os.machine?.name}</td>
              <td>{os.createdAt ? new Date(os.createdAt).toLocaleDateString() : '-'}</td>
              <td>{os.user?.name}</td>
              <td>
                <span class={getStatusClass(up(os.status))}>
                  {statusLabels[up(os.status)] || os.status}
                </span>
              </td>
              <td class="actions">
                <button
                  class="action-btn edit"
                  title="Atualizar OS"
                  on:click={() => goto(`/ordens/${os.id}/editar`)}
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  class="action-btn delete"
                  title="Excluir OS"
                  on:click={() => deleteOrder(os.id)}
                >
                  <i class="fas fa-trash"></i>
                </button>
                <button
                  class="action-btn complete"
                  title="Concluir OS"
                  on:click={() => completeOrder(os.id)}
                disabled={os.status === 'COMPLETED'}
                  >
                  <i class="fas fa-check"></i>
</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
    {:else}
      <div class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <p>Nenhuma ordem encontrada.</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Removendo prioridade */
  .priority {
    display: none;
  }

  /* Status coloridos */
  .status-pending {
    background: #fff4e5;
    color: #c47f00;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
  }
  .status-progress {
    background: #e6f0ff;
    color: #1d4ed8;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
  }
  .status-completed {
    background: #e6f9ef;
    color: #008a4e;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
  }
  .status-cancelled {
    background: #fde8e8;
    color: #b91c1c;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
  }
</style>
