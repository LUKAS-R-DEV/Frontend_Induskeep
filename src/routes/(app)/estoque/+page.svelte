<script>
  import '$lib/styles/estoque.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PieceApi } from '$lib/api/pieces';
  import { StockApi } from '$lib/api/stock';
  import { SettingsApi } from '$lib/api/settings';

  import { isAdmin, isSupervisorOrAdmin } from '$lib/utils/permissions.js';

  // ✅ Ícones Lucide
  import {
    Plus,
    List,
    Loader2,
    AlertCircle,
    RotateCcw,
    Search,
    Filter,
    Tag,
    X,
    Boxes,
    DollarSign,
    TriangleAlert,
    Package,
    PackageOpen,
    ArrowRight,
    ArrowDown,
    ArrowUp,
    Calendar,
    User,
    MessageSquare,
  } from 'lucide-svelte';

  let loading = true;
  let error = '';
  let pecas = [];
  let movimentacoes = [];
  let busca = '';
  let filtroStatus = '';
  let filtroCategoria = '';
  let minStockThreshold = 5;
  let user = null;

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        user = JSON.parse(stored);
      }

      const [settings, pieces, movements] = await Promise.all([
        SettingsApi.get(),
        PieceApi.list(),
        StockApi.listMovements(),
      ]);

      minStockThreshold = settings?.minStockThreshold ?? 5;

      pecas = (pieces || []).map((p) => ({
        id: p.id,
        codigo: p.code,
        nome: p.name,
        quantidade: p.quantity,
        minimo: p.minStock ?? minStockThreshold,
        valorUnit: p.unitPrice ?? 0,
        status:
          p.quantity <= 0
            ? 'critico'
            : p.quantity <= (p.minStock ?? minStockThreshold)
            ? 'baixo'
            : 'normal',
      }));

      movimentacoes = movements || [];
    } catch (e) {
      console.error(e);
      error = e.message || 'Erro ao carregar dados do estoque.';
    } finally {
      loading = false;
    }
  });

  const moedaBR = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  
  const dataBR = (v) =>
    new Date(v).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  $: pecasFiltradas = pecas.filter(
    (p) =>
      (!filtroStatus || p.status === filtroStatus) &&
      (!filtroCategoria ||
        p.nome.toLowerCase().includes(filtroCategoria.toLowerCase()) ||
        p.codigo.toLowerCase().includes(filtroCategoria.toLowerCase())) &&
      (!busca ||
        p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        p.nome.toLowerCase().includes(busca.toLowerCase()))
  );

  $: totalSkus = pecas.length;
  $: totalValor = pecas.reduce((acc, p) => acc + p.quantidade * p.valorUnit, 0);
  $: itensBaixo = pecas.filter((p) => p.status === 'baixo').length;
  $: itensCritico = pecas.filter((p) => p.status === 'critico').length;

  function labelStatus(s) {
    return s === 'normal' ? 'Normal' : s === 'baixo' ? 'Baixo' : 'Crítico';
  }

  function getStatusClass(status) {
    return `status-${status}`;
  }
</script>

<div class="stock-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Estoque</h1>
        <p class="page-subtitle">Gerencie peças e movimentações do estoque</p>
      </div>
      <div class="header-actions">
        {#if isSupervisorOrAdmin(user?.role)}
          <button class="btn-primary" on:click={() => goto('/estoque/cadastro')}>
            <Plus size={18} />
            Nova Peça
          </button>
        {/if}
        <button class="btn-secondary" on:click={() => goto('/estoque/movimentacoes')}>
          <List size={18} />
          Movimentações
        </button>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <Loader2 class="spin" size={32} />
      </div>
      <p>Carregando dados do estoque...</p>
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
    <!-- Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon total">
          <Boxes size={28} color="white" />
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Total de Itens</h3>
          <div class="metric-value">{totalSkus}</div>
          <p class="metric-description">SKUs cadastrados</p>
        </div>
      </div>

      {#if isSupervisorOrAdmin(user?.role)}
        <div class="metric-card value" data-full-value="Valor Total: {moedaBR(totalValor)}" title="Valor Total: {moedaBR(totalValor)}">
          <div class="metric-icon money">
            <DollarSign size={28} color="white" />
          </div>
          <div class="metric-content">
            <h3 class="metric-label">Valor Total</h3>
            <div class="metric-value" title="{moedaBR(totalValor)}">{moedaBR(totalValor)}</div>
            <p class="metric-description">Valor em estoque</p>
          </div>
        </div>

        <div class="metric-card warning">
          <div class="metric-icon alert">
            <TriangleAlert size={26} color="white" />
          </div>
          <div class="metric-content">
            <h3 class="metric-label">Baixo Estoque</h3>
            <div class="metric-value">{itensBaixo}</div>
            <p class="metric-description">Itens abaixo do mínimo</p>
          </div>
        </div>

        <div class="metric-card critical">
          <div class="metric-icon danger">
            <AlertCircle size={26} color="white" />
          </div>
          <div class="metric-content">
            <h3 class="metric-label">Críticos</h3>
            <div class="metric-value">{itensCritico}</div>
            <p class="metric-description">Itens sem estoque</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Filters -->
    <div class="filters-card">
      <div class="search-wrapper">
        <Search size={18} class="search-icon" />
        <input 
          type="text" 
          class="search-input"
          placeholder="Digite o código da peça ou nome do item..." 
          bind:value={busca} 
        />
      </div>

      <div class="filters-row">
        <div class="filter-item">
          <label for="filtroStatus">
            <Filter size={16} />
            Status
          </label>
          <select id="filtroStatus" bind:value={filtroStatus} class="filter-select">
            <option value="">Todos os status</option>
            <option value="normal">Normal</option>
            <option value="baixo">Baixo</option>
            <option value="critico">Crítico</option>
          </select>
        </div>

        <div class="filter-item">
          <label for="filtroCategoria">
            <Tag size={16} />
            Categoria / Nome
          </label>
          <input 
            type="text" 
            id="filtroCategoria"
            class="filter-input"
            placeholder="Filtrar por nome ou código" 
            bind:value={filtroCategoria} 
          />
        </div>

        {#if busca || filtroStatus || filtroCategoria}
          <button class="btn-clear-filters" on:click={() => { busca = ''; filtroStatus = ''; filtroCategoria = ''; }}>
            <X size={16} />
            Limpar Filtros
          </button>
        {/if}
      </div>
    </div>

    <!-- Stock List -->
    <div class="stock-card">
      <div class="card-header">
        <h2 class="card-title">
          <Boxes size={20} />
          Peças em Estoque ({pecasFiltradas.length})
        </h2>
      </div>

      {#if pecasFiltradas.length > 0}
        <div class="stock-list">
          {#each pecasFiltradas as p}
            <div class="stock-item {getStatusClass(p.status)}">
              <div class="stock-icon">
                <Package size={22} color="white" />
              </div>
              <div class="stock-info">
                <div class="stock-header">
                  <h3 class="stock-name">{p.nome}</h3>
                  <span class="stock-code">{p.codigo}</span>
                </div>
                <div class="stock-details">
                  <div class="detail-item">
                    <span class="detail-label">Quantidade:</span>
                    <span class="detail-value {p.status}">{p.quantidade}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Mínimo:</span>
                    <span class="detail-value">{p.minimo}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Valor Unit.:</span>
                    <span class="detail-value">{moedaBR(p.valorUnit)}</span>
                  </div>
                </div>
              </div>
              <div class="stock-status">
                <span class="status-badge {getStatusClass(p.status)}">
                  {labelStatus(p.status)}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">
            <PackageOpen size={32} color="#94a3b8" />
          </div>
          <h3>Nenhuma peça encontrada</h3>
          <p>{busca || filtroStatus || filtroCategoria ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando uma nova peça.'}</p>
        </div>
      {/if}
    </div>

    <!-- Recent Movements -->
    {#if movimentacoes.length > 0}
      <div class="movements-card">
        <div class="card-header">
          <h2 class="card-title">
            <ArrowDown size={20} />
            Últimas Movimentações
          </h2>
          <a href="/estoque/movimentacoes" class="section-link">
            Ver todas
            <ArrowRight size={18} />
          </a>
        </div>

        <div class="movements-list">
          {#each movimentacoes.slice(0, 10) as m}
            <div class="movement-item">
              <div class="movement-icon {m.type.toLowerCase()}">
                {#if m.type === 'ENTRY'}
                  <ArrowDown size={22} color={m.type === 'ENTRY' ? '#059669' : '#dc2626'} />
                {:else}
                  <ArrowUp size={22} color={m.type === 'ENTRY' ? '#059669' : '#dc2626'} />
                {/if}
              </div>
              <div class="movement-info">
                <h4 class="movement-piece">{m.piece?.name || 'N/A'}</h4>
                <div class="movement-meta">
                  <span class="meta-item">
                    <Calendar size={14} />
                    {dataBR(m.movedAt)}
                  </span>
                  <span class="meta-item">
                    <User size={14} />
                    {m.user?.name || 'N/A'}
                  </span>
                  {#if m.notes}
                    <span class="meta-item">
                      <MessageSquare size={14} />
                      {m.notes}
                    </span>
                  {/if}
                </div>
              </div>
              <div class="movement-details">
                <span class="movement-type {m.type.toLowerCase()}">
                  {m.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                </span>
                <span class="movement-quantity">{m.quantity}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
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
  .btn-clear-filters svg {
    flex-shrink: 0;
  }

  /* Ajustes para card-title */
  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Ajustes para meta-items */
  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .meta-item svg {
    flex-shrink: 0;
  }
</style>
