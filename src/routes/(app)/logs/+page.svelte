<script>
  import { onMount } from 'svelte';
  import { AuditApi } from '$lib/api/audit';
  import { UserApi } from '$lib/api/users';
  import { isAdmin } from '$lib/utils/permissions';
  import { feedback } from '$lib/stores/feedback.stores.js';

  let loading = true;
  let error = '';
  let user = null;
  let logs = [];
  let users = [];
  let total = 0;
  let currentPage = 1;
  let pageSize = 20;
  
  // Filtros
  let filterModule = '';
  let filterAction = '';
  let filterUserId = '';
  let filterDate = '';
  let selectedLog = null;
  let showDetails = false;

  const modules = [
    { value: '', label: 'Todos os módulos' },
    { value: 'ORDERS', label: 'Ordens' },
    { value: 'MACHINES', label: 'Equipamentos' },
    { value: 'USERS', label: 'Usuários' },
    { value: 'PIECES', label: 'Peças' },
    { value: 'STOCK', label: 'Estoque' },
    { value: 'HISTORY', label: 'Histórico' },
    { value: 'SETTINGS', label: 'Configurações' },
    { value: 'SCHEDULE', label: 'Agendamentos' }
  ];

  const actions = [
    { value: '', label: 'Todas as ações' },
    { value: 'CREATE', label: 'Criar' },
    { value: 'UPDATE', label: 'Atualizar' },
    { value: 'DELETE', label: 'Excluir' },
    { value: 'GET', label: 'Visualizar' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' }
  ];

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        user = JSON.parse(stored);
      }

      // Verifica se é admin
      if (!isAdmin(user?.role)) {
        error = 'Acesso negado. Apenas administradores podem acessar esta página.';
        loading = false;
        return;
      }

      // Carrega usuários para o filtro
      try {
        const usersData = await UserApi.list();
        users = Array.isArray(usersData) ? usersData : [];
      } catch (e) {
        console.warn('Erro ao carregar usuários:', e);
      }

      await loadLogs();
    } catch (e) {
      console.error('Erro ao carregar logs:', e);
      error = e?.message || 'Erro ao carregar logs de auditoria.';
    } finally {
      loading = false;
    }
  });

  async function loadLogs() {
    try {
      loading = true;
      const filters = {
        page: currentPage,
        pageSize: pageSize
      };

      if (filterModule) filters.module = filterModule;
      if (filterAction) filters.action = filterAction;
      if (filterUserId) filters.userId = filterUserId;

      const data = await AuditApi.list(filters);
      logs = data.items || [];
      total = data.total || 0;
    } catch (e) {
      console.error('Erro ao carregar logs:', e);
      error = e?.message || 'Erro ao carregar logs.';
      feedback.set({
        show: true,
        type: 'error',
        title: 'Erro',
        message: error,
      });
    } finally {
      loading = false;
    }
  }

  function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function formatDuration(ms) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function getStatusColor(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return '#10b981'; // verde
    if (statusCode >= 300 && statusCode < 400) return '#3b82f6'; // azul
    if (statusCode >= 400 && statusCode < 500) return '#f59e0b'; // amarelo
    if (statusCode >= 500) return '#ef4444'; // vermelho
    return '#64748b'; // cinza
  }

  function getStatusLabel(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return 'Sucesso';
    if (statusCode >= 300 && statusCode < 400) return 'Redirecionamento';
    if (statusCode >= 400 && statusCode < 500) return 'Erro do Cliente';
    if (statusCode >= 500) return 'Erro do Servidor';
    return 'Desconhecido';
  }

  function openDetails(log) {
    selectedLog = log;
    showDetails = true;
  }

  function closeDetails() {
    showDetails = false;
    selectedLog = null;
  }

  function clearFilters() {
    filterModule = '';
    filterAction = '';
    filterUserId = '';
    filterDate = '';
    currentPage = 1;
    loadLogs();
  }

  function changePage(newPage) {
    currentPage = newPage;
    loadLogs();
  }

  $: totalPages = Math.ceil(total / pageSize);
  $: hasFilters = filterModule || filterAction || filterUserId || filterDate;
</script>

<div class="logs-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div>
        <h1 class="page-title">Logs de Auditoria</h1>
        <p class="page-subtitle">Visualize todas as ações realizadas no sistema</p>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading && logs.length === 0}
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Carregando logs...</p>
    </div>
  {:else if error && !isAdmin(user?.role)}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-lock"></i>
      </div>
      <h3>Acesso Negado</h3>
      <p>{error}</p>
    </div>
  {:else}
    <!-- Filters -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-item">
          <label for="filterModule">
            <i class="fas fa-filter"></i>
            Módulo
          </label>
          <select id="filterModule" bind:value={filterModule} class="filter-select" on:change={loadLogs}>
            {#each modules as m}
              <option value={m.value}>{m.label}</option>
            {/each}
          </select>
        </div>

        <div class="filter-item">
          <label for="filterAction">
            <i class="fas fa-bolt"></i>
            Ação
          </label>
          <select id="filterAction" bind:value={filterAction} class="filter-select" on:change={loadLogs}>
            {#each actions as a}
              <option value={a.value}>{a.label}</option>
            {/each}
          </select>
        </div>

        <div class="filter-item">
          <label for="filterUserId">
            <i class="fas fa-user"></i>
            Usuário
          </label>
          <select id="filterUserId" bind:value={filterUserId} class="filter-select" on:change={loadLogs}>
            <option value="">Todos os usuários</option>
            {#each users as u}
              <option value={u.id}>{u.name}</option>
            {/each}
          </select>
        </div>

        {#if hasFilters}
          <button class="btn-clear-filters" on:click={clearFilters}>
            <i class="fas fa-times"></i>
            Limpar Filtros
          </button>
        {/if}
      </div>
    </div>

    <!-- Logs Table -->
    <div class="logs-card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-list"></i>
          Registros de Auditoria ({total})
        </h2>
      </div>

      {#if logs.length > 0}
        <div class="table-wrapper">
          <table class="logs-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Módulo</th>
                <th>Ação</th>
                <th>Rota</th>
                <th>Status</th>
                <th>Duração</th>
              </tr>
            </thead>
            <tbody>
              {#each logs as log}
                <tr class="log-row" on:click={() => openDetails(log)} title="Clique para ver detalhes">
                  <td>{formatDate(log.createdAt)}</td>
                  <td>
                    {#if log.user}
                      <div class="user-cell">
                        <div class="user-avatar-small">
                          <i class="fas fa-user"></i>
                        </div>
                        <span>{log.user.name || 'N/A'}</span>
                      </div>
                    {:else}
                      <span class="muted">Sistema</span>
                    {/if}
                  </td>
                  <td>
                    <span class="module-badge">{log.module || 'N/A'}</span>
                  </td>
                  <td>
                    <span class="action-badge {log.action?.toLowerCase()}">{log.action || log.method || 'N/A'}</span>
                  </td>
                  <td>
                    <span class="route-text" title={log.route}>{log.route || 'N/A'}</span>
                  </td>
                  <td>
                    <span class="status-badge" style="background: {getStatusColor(log.statusCode)}; color: white;">
                      {log.statusCode || 'N/A'}
                    </span>
                  </td>
                  <td>{formatDuration(log.duration)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="pagination">
            <button 
              class="pagination-btn" 
              disabled={currentPage === 1}
              on:click={() => changePage(currentPage - 1)}
            >
              <i class="fas fa-chevron-left"></i>
              Anterior
            </button>
            
            <span class="pagination-info">
              Página {currentPage} de {totalPages} ({total} registros)
            </span>
            
            <button 
              class="pagination-btn" 
              disabled={currentPage === totalPages}
              on:click={() => changePage(currentPage + 1)}
            >
              Próxima
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        {/if}
      {:else}
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <h3>Nenhum log encontrado</h3>
          <p>{hasFilters ? 'Tente ajustar os filtros de busca.' : 'Ainda não há registros de auditoria.'}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Modal de Detalhes -->
{#if showDetails && selectedLog}
  <div class="modal-overlay" on:click={closeDetails} on:keydown={(e) => e.key === 'Escape' && closeDetails()}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="modal-title">
          <i class="fas fa-info-circle"></i>
          Detalhes do Log
        </h2>
        <button class="modal-close" on:click={closeDetails}>
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item">
            <label>Data/Hora</label>
            <div class="detail-value">{formatDate(selectedLog.createdAt)}</div>
          </div>
          
          <div class="detail-item">
            <label>Usuário</label>
            <div class="detail-value">
              {selectedLog.user ? selectedLog.user.name : 'Sistema'}
              {#if selectedLog.user}
                <span class="detail-sub">({selectedLog.user.email})</span>
              {/if}
            </div>
          </div>
          
          <div class="detail-item">
            <label>Módulo</label>
            <div class="detail-value">
              <span class="module-badge">{selectedLog.module || 'N/A'}</span>
            </div>
          </div>
          
          <div class="detail-item">
            <label>Ação</label>
            <div class="detail-value">
              <span class="action-badge {selectedLog.action?.toLowerCase()}">
                {selectedLog.action || selectedLog.method || 'N/A'}
              </span>
            </div>
          </div>
          
          <div class="detail-item">
            <label>Rota</label>
            <div class="detail-value route-full">{selectedLog.route || 'N/A'}</div>
          </div>
          
          <div class="detail-item">
            <label>Método HTTP</label>
            <div class="detail-value">{selectedLog.method || 'N/A'}</div>
          </div>
          
          <div class="detail-item">
            <label>Status Code</label>
            <div class="detail-value">
              <span class="status-badge" style="background: {getStatusColor(selectedLog.statusCode)}; color: white;">
                {selectedLog.statusCode || 'N/A'} - {getStatusLabel(selectedLog.statusCode)}
              </span>
            </div>
          </div>
          
          <div class="detail-item">
            <label>Duração</label>
            <div class="detail-value">{formatDuration(selectedLog.duration)}</div>
          </div>
          
          {#if selectedLog.ip}
            <div class="detail-item">
              <label>IP</label>
              <div class="detail-value">{selectedLog.ip}</div>
            </div>
          {/if}
          
          {#if selectedLog.userAgent}
            <div class="detail-item">
              <label>User Agent</label>
              <div class="detail-value user-agent">{selectedLog.userAgent}</div>
            </div>
          {/if}
          
          {#if selectedLog.payload}
            <div class="detail-item full-width">
              <label>Payload</label>
              <div class="detail-value payload">
                <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
              </div>
            </div>
          {/if}
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" on:click={closeDetails}>
          <i class="fas fa-times"></i>
          Fechar
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .logs-container {
    max-width: 1600px;
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

  /* Filters Card */
  .filters-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
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

  /* Logs Card */
  .logs-card {
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

  /* Table */
  .table-wrapper {
    overflow-x: auto;
    border-radius: 12px;
  }

  .logs-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  .logs-table thead {
    background: #f8fafc;
  }

  .logs-table th {
    padding: 1rem 1.25rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
  }

  .logs-table td {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    font-size: 0.9rem;
  }

  .logs-table tbody tr.log-row {
    transition: background 0.15s ease;
    cursor: pointer;
  }

  .logs-table tbody tr.log-row:hover {
    background: #f1f5f9;
    transform: scale(1.01);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .logs-table tbody tr:last-child td {
    border-bottom: none;
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .user-avatar-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .module-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    background: #e0e7ff;
    color: #4338ca;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .action-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .action-badge.create,
  .action-badge.post {
    background: #d1fae5;
    color: #059669;
  }

  .action-badge.update,
  .action-badge.put {
    background: #dbeafe;
    color: #2563eb;
  }

  .action-badge.delete {
    background: #fee2e2;
    color: #dc2626;
  }

  .action-badge.get {
    background: #fef3c7;
    color: #d97706;
  }

  .route-text {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    color: #64748b;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .status-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }


  .muted {
    color: #94a3b8;
    font-style: italic;
  }

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 2px solid #f1f5f9;
  }

  .pagination-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: white;
    color: #3b82f6;
    border: 2px solid #3b82f6;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #3b82f6;
    color: white;
    transform: translateY(-2px);
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-info {
    color: #64748b;
    font-weight: 600;
    font-size: 0.95rem;
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
    margin: 0;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
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

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: fadeIn 0.2s ease-out;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 2px solid #f1f5f9;
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .modal-title i {
    color: #3b82f6;
  }

  .modal-close {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: none;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: #e2e8f0;
    color: #1e293b;
  }

  .modal-body {
    padding: 2rem;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item.full-width {
    grid-column: 1 / -1;
  }

  .detail-item label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-value {
    font-size: 1rem;
    color: #1e293b;
    font-weight: 500;
  }

  .detail-sub {
    display: block;
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 400;
    margin-top: 0.25rem;
  }

  .route-full {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    color: #475569;
    word-break: break-all;
  }

  .user-agent {
    font-size: 0.85rem;
    color: #64748b;
    word-break: break-all;
  }

  .payload {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .payload pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: #1e293b;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .modal-footer {
    padding: 1.5rem 2rem;
    border-top: 2px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
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
  }

  .btn-secondary:hover {
    background: #3b82f6;
    color: white;
    transform: translateY(-2px);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .logs-container {
      padding: 1rem;
    }

    .filters-row {
      flex-direction: column;
    }

    .filter-item {
      min-width: 100%;
    }

    .table-wrapper {
      overflow-x: scroll;
    }

    .logs-table {
      min-width: 800px;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }

    .modal-content {
      margin: 1rem;
      max-height: calc(100vh - 2rem);
    }
  }
</style>

