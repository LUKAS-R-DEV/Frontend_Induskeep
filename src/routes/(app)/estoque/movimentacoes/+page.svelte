<script>
  import '$lib/styles/estoque.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { StockApi } from '$lib/api/stock';
  import { hasPermission } from '$lib/utils/permissions.js';

  let loading = true;
  let error = '';
  let movimentacoes = [];
  let busca = '';
  let filtroTipo = '';
  let user = null;

  onMount(async () => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          user = JSON.parse(stored);
          console.log('🔍 Movimentações - User carregado:', { user, role: user?.role, roleType: typeof user?.role });
        }
      }

      const data = await StockApi.listMovements();
      movimentacoes = data || [];
    } catch (e) {
      console.error(e);
      error = e.message || 'Erro ao carregar movimentações.';
    } finally {
      loading = false;
    }
  });

  const dataBR = (v) =>
    new Date(v).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  $: movFiltradas = movimentacoes.filter(
    (m) =>
      (!filtroTipo || m.type === filtroTipo) &&
      (!busca ||
        m.piece?.name?.toLowerCase().includes(busca.toLowerCase()) ||
        m.piece?.code?.toLowerCase().includes(busca.toLowerCase()) ||
        m.user?.name?.toLowerCase().includes(busca.toLowerCase()))
  );

  function labelTipo(tipo) {
    return tipo === 'ENTRY' ? 'Entrada' : 'Saída';
  }

  function getTypeClass(type) {
    return type === 'ENTRY' ? 'type-entry' : 'type-exit';
  }

  // Tornar reativo para atualizar quando user mudar
  $: canCreateMovement = (() => {
    if (!user || !user.role) {
      console.log('❌ Movimentações - canCreate: sem user ou role', { user, hasUser: !!user, hasRole: !!user?.role });
      return false;
    }
    const userRole = String(user.role).toUpperCase().trim();
    const result = userRole === 'ADMIN' || userRole === 'SUPERVISOR' || userRole === 'TECHNICIAN';
    console.log('🔍 Movimentações - canCreate:', { userRole: user.role, normalized: userRole, result });
    return result;
  })();

  function canCreate() {
    return canCreateMovement;
  }
</script>

<div class="movements-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Movimentações de Estoque</h1>
        <p class="page-subtitle">
          {#if user && String(user.role || '').toUpperCase().trim() === 'TECHNICIAN'}
            Minhas movimentações de estoque
          {:else}
            Histórico de entradas e saídas de peças
          {/if}
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" on:click={() => goto('/estoque')}>
          <i class="fas fa-arrow-left"></i>
          Voltar
        </button>
        {#if canCreateMovement}
          <button 
            class="btn-primary" 
            on:click={() => goto('/estoque/movimentacoes/nova')}
            title="Registrar nova movimentação"
          >
            <i class="fas fa-plus"></i>
            Nova Movimentação
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando movimentações...</p>
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
    <!-- Filters -->
    <div class="filters-card">
      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          class="search-input"
          placeholder="Digite o nome da peça, código do item ou nome do usuário..." 
          bind:value={busca} 
        />
      </div>

      <div class="filters-row">
        <div class="filter-item">
          <label for="filtroTipo">
            <i class="fas fa-filter"></i>
            Tipo
          </label>
          <select id="filtroTipo" bind:value={filtroTipo} class="filter-select">
            <option value="">Todos os tipos</option>
            <option value="ENTRY">Entrada</option>
            <option value="EXIT">Saída</option>
          </select>
        </div>

        {#if busca || filtroTipo}
          <button class="btn-clear-filters" on:click={() => { busca = ''; filtroTipo = ''; }}>
            <i class="fas fa-times"></i>
            Limpar Filtros
          </button>
        {/if}
      </div>
    </div>

    <!-- Movements List -->
    {#if movFiltradas.length > 0}
      <div class="movements-card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-exchange-alt"></i>
            Histórico de Movimentações ({movFiltradas.length})
          </h2>
        </div>

        <div class="movements-list">
          {#each movFiltradas as m}
            <div class="movement-item">
              <div class="movement-icon {getTypeClass(m.type)}">
                <i class="fas fa-{m.type === 'ENTRY' ? 'arrow-down' : 'arrow-up'}"></i>
              </div>
              <div class="movement-content">
                <div class="movement-header">
                  <h3 class="movement-piece">{m.piece?.name || 'N/A'}</h3>
                  <span class="movement-type {getTypeClass(m.type)}">
                    {labelTipo(m.type)}
                  </span>
                </div>
                <div class="movement-meta">
                  <div class="meta-item">
                    <i class="fas fa-barcode"></i>
                    <span>Código: {m.piece?.code || 'N/A'}</span>
                  </div>
                  <div class="meta-item">
                    <i class="fas fa-box"></i>
                    <span>Quantidade: <strong>{m.quantity}</strong></span>
                  </div>
                  <div class="meta-item">
                    <i class="fas fa-user"></i>
                    <span>{m.user?.name || 'N/A'}</span>
                  </div>
                  <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>{dataBR(m.movedAt)}</span>
                  </div>
                  {#if m.notes}
                    <div class="meta-item">
                      <i class="fas fa-comment"></i>
                      <span>{m.notes}</span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-exchange-alt"></i>
        </div>
        <h3>Nenhuma movimentação encontrada</h3>
        <p>{busca || filtroTipo ? 'Tente ajustar os filtros de busca.' : 'Ainda não há movimentações registradas.'}</p>
        {#if canCreate() && !busca && !filtroTipo}
          <button class="btn-primary" on:click={() => goto('/estoque/movimentacoes/nova')}>
            <i class="fas fa-plus"></i>
            Registrar Movimentação
          </button>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .movements-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Header */
  .page-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.5px;
  }

  .page-subtitle {
    font-size: 1rem;
    color: #64748b;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    text-decoration: none;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: white;
    color: #3b82f6;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .btn-secondary:hover {
    background: #3b82f6;
    color: white;
    transform: translateY(-2px);
  }

  /* Filters Card */
  .filters-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .search-wrapper {
    position: relative;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    z-index: 2;
    flex-shrink: 0;
    width: 18px !important;
    height: 18px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .search-input {
    width: 100%;
    padding-left: 3rem !important;
    padding-right: 1rem;
    padding-top: 0.875rem;
    padding-bottom: 0.875rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background: #ffffff !important;
    color: #1e293b !important;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: #ffffff !important;
    color: #1e293b !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  .search-input::placeholder {
    color: #94a3b8 !important;
  }

  .filters-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 200px;
  }

  .filter-item label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
  }

  .filter-item label i {
    color: #3b82f6;
    font-size: 0.875rem;
  }

  .filter-select {
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    background: #ffffff !important;
    color: #1e293b !important;
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    background: #ffffff !important;
    color: #1e293b !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  .btn-clear-filters {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #f1f5f9;
    color: #64748b;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    height: fit-content;
  }

  .btn-clear-filters:hover {
    background: #e2e8f0;
    color: #475569;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.5rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-state p {
    color: #64748b;
    font-size: 1rem;
  }

  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .error-icon {
    width: 80px;
    height: 80px;
    background: #fee2e2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .error-icon i {
    font-size: 2.5rem;
    color: #ef4444;
  }

  .error-state h3 {
    font-size: 1.5rem;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .error-state p {
    color: #64748b;
    margin: 0 0 1.5rem 0;
  }

  .btn-retry {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-retry:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }

  /* Movements Card */
  .movements-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .card-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f1f5f9;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .card-title i {
    color: #3b82f6;
  }

  .movements-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .movement-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .movement-item:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  .movement-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .movement-icon.type-entry {
    background: #d1fae5;
    color: #059669;
  }

  .movement-icon.type-exit {
    background: #fee2e2;
    color: #dc2626;
  }

  .movement-content {
    flex: 1;
  }

  .movement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .movement-piece {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .movement-type {
    padding: 0.375rem 0.875rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .movement-type.type-entry {
    background: #d1fae5;
    color: #059669;
  }

  .movement-type.type-exit {
    background: #fee2e2;
    color: #dc2626;
  }

  .movement-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .meta-item i {
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .meta-item strong {
    color: #1e293b;
    font-weight: 600;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background: white;
    border-radius: 16px;
    border: 2px dashed #e2e8f0;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .empty-icon i {
    font-size: 2.5rem;
    color: #94a3b8;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    color: #64748b;
    margin: 0 0 1.5rem 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .movements-container {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      flex-direction: column;
      width: 100%;
    }

    .header-actions button {
      width: 100%;
    }

    .movement-item {
      flex-direction: column;
      align-items: stretch;
    }

    .movement-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
