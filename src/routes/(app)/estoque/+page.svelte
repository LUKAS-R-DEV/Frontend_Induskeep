<script>
  import '$lib/styles/estoque.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PieceApi } from '$lib/api/pieces';
  import { StockApi } from '$lib/api/stock';
  import { SettingsApi } from '$lib/api/settings';

  import { isAdmin } from '$lib/utils/permissions.js';

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
        {#if isAdmin(user?.role)}
          <button class="btn-primary" on:click={() => goto('/estoque/cadastro')}>
            <i class="fas fa-plus"></i>
            Nova Peça
          </button>
        {/if}
        <button class="btn-secondary" on:click={() => goto('/estoque/movimentacoes')}>
          <i class="fas fa-list"></i>
          Movimentações
        </button>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando dados do estoque...</p>
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
    <!-- Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon total">
          <i class="fas fa-boxes"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Total de Itens</h3>
          <div class="metric-value">{totalSkus}</div>
          <p class="metric-description">SKUs cadastrados</p>
        </div>
      </div>

      <div class="metric-card value">
        <div class="metric-icon money">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Valor Total</h3>
          <div class="metric-value">{moedaBR(totalValor)}</div>
          <p class="metric-description">Valor em estoque</p>
        </div>
      </div>

      <div class="metric-card warning">
        <div class="metric-icon alert">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Baixo Estoque</h3>
          <div class="metric-value">{itensBaixo}</div>
          <p class="metric-description">Itens abaixo do mínimo</p>
        </div>
      </div>

      <div class="metric-card critical">
        <div class="metric-icon danger">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-label">Críticos</h3>
          <div class="metric-value">{itensCritico}</div>
          <p class="metric-description">Itens sem estoque</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-card">
      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          class="search-input"
          placeholder="Buscar por código ou nome..." 
          bind:value={busca} 
        />
      </div>

      <div class="filters-row">
        <div class="filter-item">
          <label for="filtroStatus">
            <i class="fas fa-filter"></i>
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
            <i class="fas fa-tag"></i>
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
            <i class="fas fa-times"></i>
            Limpar Filtros
          </button>
        {/if}
      </div>
    </div>

    <!-- Stock List -->
    <div class="stock-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-boxes"></i>
          Peças em Estoque ({pecasFiltradas.length})
        </h2>
      </div>

      {#if pecasFiltradas.length > 0}
        <div class="stock-list">
          {#each pecasFiltradas as p}
            <div class="stock-item {getStatusClass(p.status)}">
              <div class="stock-icon">
                <i class="fas fa-box"></i>
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
            <i class="fas fa-box-open"></i>
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
            <i class="fas fa-exchange-alt"></i>
            Últimas Movimentações
          </h2>
          <a href="/estoque/movimentacoes" class="section-link">
            Ver todas
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>

        <div class="movements-list">
          {#each movimentacoes.slice(0, 10) as m}
            <div class="movement-item">
              <div class="movement-icon {m.type.toLowerCase()}">
                <i class="fas fa-{m.type === 'ENTRY' ? 'arrow-down' : 'arrow-up'}"></i>
              </div>
              <div class="movement-info">
                <h4 class="movement-piece">{m.piece?.name || 'N/A'}</h4>
                <div class="movement-meta">
                  <span class="meta-item">
                    <i class="fas fa-calendar"></i>
                    {dataBR(m.movedAt)}
                  </span>
                  <span class="meta-item">
                    <i class="fas fa-user"></i>
                    {m.user?.name || 'N/A'}
                  </span>
                  {#if m.notes}
                    <span class="meta-item">
                      <i class="fas fa-comment"></i>
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
