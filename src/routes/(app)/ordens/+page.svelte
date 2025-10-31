<script>
  import '$lib/styles/ordens.css';
  import { onMount } from 'svelte';
  import { OrdersApi } from '$lib/api/orders';
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

  // função para definir a cor do status
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

<div class="header">
  <h1>Ordens de Serviço</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar ordem de serviço..." bind:value={search} />
  </div>
  <button class="btn" on:click={() => goto('/ordens/cadastro')}>
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
      <option value="COMPLETED">Concluída</option>
      <option value="CANCELLED">Cancelada</option>
    </select>
  </div>

  <div class="filter-group">
    <label for="dateFilter">Data de abertura</label>
    <input type="date" id="dateFilter" bind:value={dateFilter} />
  </div>
</div>

{#if loading}
  <div class="loading">Carregando ordens...</div>
{:else if error}
  <div class="error">⚠️ {error}</div>
{:else}
  <div class="section">
    <h2>Lista de Ordens de Serviço</h2>
    {#if filteredOrders.length > 0}
      <table>
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
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>Nenhuma ordem encontrada.</p>
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
