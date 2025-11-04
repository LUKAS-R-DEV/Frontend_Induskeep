<script>
  import {onMount} from 'svelte';
  import {DashboardApi} from '$lib/api/dashboard.js';
  import '$lib/styles/dashboard.css';

  let data=null;
  let error='';
  let loading=true;

  onMount(async () => {
    try {
      data = await DashboardApi.getData();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  function getStatusClass(status) {
    if (!status) return '';
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'status-pending';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
      case 'CANCELED':
        return 'status-cancelled';
      default:
        return '';
    }
  }
</script>

{#if loading}
  <div class="loading-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Carregando dados do painel...</p>
  </div>
{:else if error}
  <div class="error-state">
    <i class="fas fa-exclamation-circle"></i>
    <p>{error}</p>
  </div>
{:else}
  <div class="page-header">
    <h1>📊 Dashboard</h1>
  </div>

    <!-- Cards principais -->
    <div class="cards">
      <div class="card">
        <h3>Total de Equipamentos</h3>
        <div class="number">{data.sumary?.totalMachines ?? 0}</div>
      </div>
      <div class="card pending">
        <h3>Ordens Pendentes</h3>
        <div class="number">{data.sumary?.pendingOrders ?? 0}</div>
      </div>
      <div class="card completed">
        <h3>Ordens Concluídas</h3>
        <div class="number">{data.sumary?.completedOrders ?? 0}</div>
      </div>
      <div class="card critical">
        <h3>Estoque Crítico</h3>
        <div class="number">{data.lowStockPieces?.length ?? 0}</div>
      </div>
    </div>

  <!-- Últimas Ordens de Serviço -->
  <div class="page-section">
    <h2>Últimas Ordens de Serviço</h2>
    {#if data.recentOrders?.length > 0}
      {#each data.recentOrders.slice(0, 5) as order}
        <div class="maintenance-item">
          <div class="machine-info">
            <h4>{order.title}</h4>
            <p>
              Máquina: {order.machine?.name} • Responsável: {order.user?.name}
            </p>
            <p class="desc">{order.description}</p>
          </div>
          <div class="status-badge {getStatusClass(order.status)}">
            {order.status==='COMPLETED' ? 'Concluída' : order.status==='CANCELLED' || order.status==='CANCELED' ? 'Cancelada' : order.status==='PENDING' ? 'Pendente' : order.status==='IN_PROGRESS' ? 'Em Andamento' : '-'}
          </div>
        </div>
      {/each}
    {:else}
      <div class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <p>Nenhuma ordem de serviço encontrada.</p>
      </div>
    {/if}
  </div>

  <!-- Estoque Crítico -->
  <div class="page-section">
    <h2>Estoque Crítico</h2>
    {#if data.lowStockPieces?.length > 0}
      {#each data.lowStockPieces as piece}
        <div class="notification-item">
          <div class="notification-icon danger">
            <i class="fas fa-box"></i>
          </div>
          <div class="notification-content">
            <h4>{piece.name}</h4>
            <p>Código: {piece.code}</p>
            <div class="notification-time">Quantidade: {piece.quantity}</div>
          </div>
        </div>
      {/each}
    {:else}
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>Nenhuma peça em nível crítico.</p>
      </div>
    {/if}
  </div>
{/if}