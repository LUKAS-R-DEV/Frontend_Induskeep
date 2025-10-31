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
</script>

{#if loading}
  <div class="loading">Carregando dados do painel...</div>
{:else if error}
  <div class="error">⚠️ {error}</div>
{:else}
  <div class="dashboard">
    <!-- Cabeçalho -->
    <div class="header">
      <h1>Dashboard - Área principal</h1>
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
    <div class="section">
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
            <div class="status {order.status.toLowerCase()}">
              {order.status}
            </div>
          </div>
        {/each}
      {:else}
        <p>Nenhuma ordem de serviço encontrada.</p>
      {/if}
    </div>

    <!-- Estoque Crítico -->
    <div class="section">
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
        <p>Nenhuma peça em nível crítico.</p>
      {/if}
    </div>
  </div>
{/if}