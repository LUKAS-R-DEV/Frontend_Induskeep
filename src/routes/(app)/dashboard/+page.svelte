<script>
  import {onMount} from 'svelte';
  import {DashboardApi} from '$lib/api/dashboard.js';
  import '$lib/styles/dashboard.css';
  import { goto } from '$app/navigation';
  import { hasPermission } from '$lib/utils/permissions.js';

  let data = null;
  let error = '';
  let loading = true;
  let user = null;

  onMount(async () => {
    try {
      // Carrega usuário do localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          user = JSON.parse(stored);
        }
      }
      
      data = await DashboardApi.getData();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  function canCreate() {
    return user && hasPermission(user.role, 'CREATE_ORDER');
  }

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

  function getStatusLabel(status) {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'COMPLETED':
        return 'Concluída';
      case 'CANCELLED':
      case 'CANCELED':
        return 'Cancelada';
      case 'PENDING':
        return 'Pendente';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      default:
        return status || '-';
    }
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
</script>

<div class="dashboard-container">
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando dados do painel...</p>
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
  {:else}
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Visão geral do sistema de manutenção</p>
        </div>
        <div class="header-actions">
          {#if canCreate()}
            <button class="btn-primary" on:click={() => goto('/ordens/cadastro')}>
              <i class="fas fa-plus"></i>
              Nova Ordem
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Cards de Métricas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon equipment">
          <i class="fas fa-industry"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Equipamentos</h3>
          <div class="metric-value">{data.sumary?.totalMachines ?? 0}</div>
          <p class="metric-description">Total cadastrado</p>
        </div>
      </div>

      <div class="metric-card pending">
        <div class="metric-icon warning">
          <i class="fas fa-clock"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Pendentes</h3>
          <div class="metric-value">{data.sumary?.pendingOrders ?? 0}</div>
          <p class="metric-description">Ordens aguardando</p>
        </div>
      </div>

      <div class="metric-card completed">
        <div class="metric-icon success">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Concluídas</h3>
          <div class="metric-value">{data.sumary?.completedOrders ?? 0}</div>
          <p class="metric-description">Ordens finalizadas</p>
        </div>
      </div>

      <div class="metric-card critical">
        <div class="metric-icon danger">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Estoque Crítico</h3>
          <div class="metric-value">{data.lowStockPieces?.length ?? 0}</div>
          <p class="metric-description">Peças em alerta</p>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Últimas Ordens de Serviço -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-tasks"></i>
            Últimas Ordens de Serviço
          </h2>
          <a href="/ordens" class="section-link">
            Ver todas
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>

        <div class="section-content">
          {#if data.recentOrders?.length > 0}
            <div class="orders-list">
              {#each data.recentOrders.slice(0, 5) as order}
                <div class="order-item" on:click={() => goto(`/ordens/${order.id}`)}>
                  <div class="order-main">
                    <h4 class="order-title">{order.title}</h4>
                    <div class="order-meta">
                      <span class="order-meta-item">
                        <i class="fas fa-industry"></i>
                        {order.machine?.name || 'N/A'}
                      </span>
                      <span class="order-meta-item">
                        <i class="fas fa-user"></i>
                        {order.user?.name || 'N/A'}
                      </span>
                    </div>
                    {#if order.description}
                      <p class="order-description">{order.description}</p>
                    {/if}
                  </div>
                  <div class="order-status">
                    <span class="status-badge {getStatusClass(order.status)}">
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-clipboard-list"></i>
              </div>
              <h3>Nenhuma ordem encontrada</h3>
              <p>{canCreate() ? 'Comece criando uma nova ordem de serviço' : 'Nenhuma ordem de serviço disponível no momento'}</p>
              {#if canCreate()}
                <button class="btn-secondary" on:click={() => goto('/ordens/cadastro')}>
                  <i class="fas fa-plus"></i>
                  Criar Ordem
                </button>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Estoque Crítico -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-exclamation-triangle"></i>
            Estoque Crítico
          </h2>
          <a href="/estoque" class="section-link">
            Ver estoque
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>

        <div class="section-content">
          {#if data.lowStockPieces?.length > 0}
            <div class="stock-list">
              {#each data.lowStockPieces.slice(0, 5) as piece}
                <div class="stock-item">
                  <div class="stock-icon danger">
                    <i class="fas fa-box"></i>
                  </div>
                  <div class="stock-info">
                    <h4 class="stock-name">{piece.name}</h4>
                    <p class="stock-code">Código: {piece.code}</p>
                    <div class="stock-quantity">
                      <span class="quantity-label">Quantidade:</span>
                      <span class="quantity-value critical">{piece.quantity}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state">
              <div class="empty-icon success">
                <i class="fas fa-check-circle"></i>
              </div>
              <h3>Estoque em dia</h3>
              <p>Todas as peças estão com estoque adequado</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
