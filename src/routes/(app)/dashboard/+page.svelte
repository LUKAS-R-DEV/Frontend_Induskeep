<script>
  import { onMount } from 'svelte';
  import { DashboardApi } from '$lib/api/dashboard.js';
  import '$lib/styles/dashboard.css';
  import { goto } from '$app/navigation';
  import { hasPermission, isSupervisorOrAdmin } from '$lib/utils/permissions.js';

  // ✅ Ícones Lucide
  import {
    Loader2,
    AlertCircle,
    RotateCcw,
    Factory,
    Clock,
    CheckCircle2,
    TriangleAlert,
    ClipboardList,
    User,
    Box,
    ArrowRight,
    Plus,
    CalendarX,
  } from 'lucide-svelte';

  let data = null;
  let error = '';
  let loading = true;
  let user = null;

  onMount(async () => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
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
    const s = status.toUpperCase();
    return {
      PENDING: 'status-pending',
      IN_PROGRESS: 'status-progress',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled',
      CANCELED: 'status-cancelled'
    }[s] || '';
  }

  function getStatusLabel(status) {
    const s = status?.toUpperCase() || '';
    return {
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
      CANCELED: 'Cancelada',
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em Andamento'
    }[s] || status || '-';
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
</script>

<div class="dashboard-container">
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <Loader2 class="spin" size={32} />
      </div>
      <p>Carregando dados do painel...</p>
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
  {:else}
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Visão geral do sistema de manutenção</p>
        </div>
      </div>
    </div>

    <!-- Cards de Métricas -->
    <div class="metrics-grid">
      {#if isSupervisorOrAdmin(user?.role)}
        <div class="metric-card">
          <div class="metric-icon equipment">
            <Factory size={28} color="white" />
          </div>
          <div class="metric-content">
            <h3 class="metric-label">Equipamentos</h3>
            <div class="metric-value">{data.sumary?.totalMachines ?? 0}</div>
            <p class="metric-description">Total cadastrado</p>
          </div>
        </div>
      {/if}

      <div class="metric-card pending">
        <div class="metric-icon warning">
          <Clock size={26} color="white" />
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Pendentes</h3>
          <div class="metric-value">{data.sumary?.pendingOrders ?? 0}</div>
          <p class="metric-description">
            {#if user && String(user.role || '').toUpperCase().trim() === 'TECHNICIAN'}
              Minhas ordens aguardando
            {:else}
              Ordens aguardando
            {/if}
          </p>
        </div>
      </div>

      {#if isSupervisorOrAdmin(user?.role)}
        <div class="metric-card critical">
          <div class="metric-icon danger">
            <TriangleAlert size={26} color="white" />
          </div>
          <div class="metric-content">
            <h3 class="metric-label">Estoque Crítico</h3>
            <div class="metric-value">{data.lowStockPieces?.length ?? 0}</div>
            <p class="metric-description">Peças em alerta</p>
          </div>
        </div>

        <div class="metric-card overdue" on:click={() => goto('/agendamentos')} style="cursor: pointer;">
          <div class="metric-icon danger">
            <CalendarX size={26} color="white" />
          </div>
          <div class="metric-content">
            <h3 class="metric-label">Agendamentos Atrasados</h3>
            <div class="metric-value">{data.sumary?.overdueSchedules ?? 0}</div>
            <p class="metric-description">Manutenções pendentes</p>
          </div>
        </div>
      {/if}
    </div>

    <div class="dashboard-grid">
      <!-- Últimas Ordens -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">
            <ClipboardList size={20} />
            {#if user && String(user.role || '').toUpperCase().trim() === 'TECHNICIAN'}
              Minhas Ordens de Serviço
            {:else}
              Últimas Ordens de Serviço
            {/if}
          </h2>
          <a href="/ordens" class="section-link">
            Ver todas
            <ArrowRight size={18} />
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
                        <Factory size={14} />
                        {order.machine?.name || 'N/A'}
                      </span>
                      <span class="order-meta-item">
                        <User size={14} />
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
                <ClipboardList size={32} color="#94a3b8" />
              </div>
              <h3>Nenhuma ordem encontrada</h3>
              <p>{canCreate() ? 'Comece criando uma nova ordem de serviço' : 'Nenhuma ordem de serviço disponível no momento'}</p>
              {#if canCreate()}
                <button class="btn-secondary" on:click={() => goto('/ordens/cadastro')}>
                  <Plus size={18} />
                  Criar Ordem
                </button>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      {#if isSupervisorOrAdmin(user?.role)}
        <!-- Estoque Crítico -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2 class="section-title">
              <TriangleAlert size={20} color="#f87171" />
              Estoque Crítico
            </h2>
            <a href="/estoque" class="section-link">
              Ver estoque
              <ArrowRight size={18} />
            </a>
          </div>

          <div class="section-content">
            {#if data.lowStockPieces?.length > 0}
              <div class="stock-list">
                {#each data.lowStockPieces.slice(0, 5) as piece}
                  <div class="stock-item">
                    <div class="stock-icon danger">
                      <Box size={22} color="white" />
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
                  <CheckCircle2 size={28} color="#22c55e" />
                </div>
                <h3>Estoque em dia</h3>
                <p>Todas as peças estão com estoque adequado</p>
              </div>
            {/if}
          </div>
        </div>
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
  }
</style>
