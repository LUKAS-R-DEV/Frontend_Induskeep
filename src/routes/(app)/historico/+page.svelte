<script>
  import '$lib/styles/historico.css';
  import { onMount } from 'svelte';
  import { HistoryApi } from '$lib/api/history';
  import { ExportFactory } from '$lib/export';

  let loading = true;
  let busca = '';
  let filtroEquipamento = '';
  let dataDe = '';
  let dataAte = '';
  let historico = [];
  let filtrado = [];

  function duration(createdAt, completedAt) {
    if (!createdAt || !completedAt) return '-';
    const start = new Date(createdAt);
    const end = new Date(completedAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-';
    const diff = Math.max(0, end - start);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  // ========= Carregar histórico =========
  onMount(async () => {
    try {
      const data = await HistoryApi.list();
      historico = Array.isArray(data) ? data : [];
      filtrado = [...historico];
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      loading = false;
    }
  });

  // ========= Aplicar filtros =========
  function aplicarFiltros() {
    filtrado = historico.filter((item) => {
      const texto = busca.toLowerCase();
      const buscaMatch =
        busca === '' ||
        item.order?.machine?.name?.toLowerCase().includes(texto) ||
        item.order?.user?.name?.toLowerCase().includes(texto) ||
        item.order?.title?.toLowerCase().includes(texto) ||
        item.notes?.toLowerCase().includes(texto);

      const equipMatch = !filtroEquipamento || item.order?.machine?.name === filtroEquipamento;

      const dataItem = item.completedAt ? new Date(item.completedAt) : null;
      const dataDeMatch = !dataDe || (dataItem && dataItem >= new Date(dataDe));
      const dataAteMatch = !dataAte || (dataItem && dataItem <= new Date(dataAte));

      return buscaMatch && equipMatch && dataDeMatch && dataAteMatch;
    });
  }

  // ========= Limpar filtros =========
  function limparFiltros() {
    busca = '';
    filtroEquipamento = '';
    dataDe = '';
    dataAte = '';
    filtrado = [...historico];
  }

  // ========= Exportar PDF geral =========
  async function exportarGeral() {
    try {
      await ExportFactory.reports(historico, 'pdf');
    } catch (err) {
      alert("⚠️ Erro ao exportar: " + err.message);
    }
  }

  // (Exportação individual removida)

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

<!-- Cabeçalho -->
<div class="page-header">
  <h1>📋 Histórico de Manutenções</h1>
</div>

<!-- Ações principais -->
<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input
      type="text"
      placeholder="Buscar no histórico..."
      bind:value={busca}
      on:input={aplicarFiltros}
    />
  </div>
  <button class="btn-primary" on:click={exportarGeral}>
    <i class="fas fa-file-pdf"></i> Exportar Relatório Geral
  </button>
</div>

<!-- Filtros -->
<div class="filters">
  <div class="filter-group">
    <label>Equipamento</label>
    <select bind:value={filtroEquipamento} on:change={aplicarFiltros}>
      <option value="">Todos</option>
      <option value="Máquina de Moldagem A">Máquina de Moldagem A</option>
      <option value="Compressor B">Compressor B</option>
      <option value="Prensa Hidráulica">Prensa Hidráulica</option>
      <option value="Misturador Industrial">Misturador Industrial</option>
      <option value="Esteira Transportadora">Esteira Transportadora</option>
    </select>
  </div>

  <div class="filter-group">
    <label>De</label>
    <input type="date" bind:value={dataDe} on:change={aplicarFiltros} />
  </div>

  <div class="filter-group">
    <label>Até</label>
    <input type="date" bind:value={dataAte} on:change={aplicarFiltros} />
  </div>

  <div class="filter-actions">
    <button class="btn-primary" on:click={aplicarFiltros}>
      <i class="fas fa-filter"></i> Aplicar
    </button>
    <button class="btn-primary" on:click={limparFiltros} style="background: #6b7280;">
      <i class="fas fa-eraser"></i> Limpar
    </button>
  </div>
</div>

<!-- Conteúdo principal -->
{#if loading}
  <div class="loading-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Carregando histórico...</p>
  </div>
{:else if filtrado.length === 0}
  <div class="empty-state">
    <i class="fas fa-history"></i>
    <p>Nenhum registro encontrado.</p>
  </div>
{:else}
  <div class="page-section">
    <h2>Histórico Completo</h2>
    <div class="table-wrapper">
      <table class="standard-table">
      <thead>
        <tr>
          <th>Nº OS</th>
          <th>Equipamento</th>
          <th>Data Execução</th>
          <th>Tempo</th>
          <th>Técnico</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  {#each filtrado as h}
    <tr>
      <td>{h.id || '-'}</td>
      <td>{h.order?.machine?.name || '-'}</td>
      <td>{h.completedAt ? new Date(h.completedAt).toLocaleDateString('pt-BR') : '-'}</td>
      <td>{duration(h.order?.createdAt, h.completedAt)}</td>
      <td>{h.order?.user?.name || '-'}</td>
      <td>
        <span class={getStatusClass(h.order?.status)}>
          {h.order?.status === 'COMPLETED' ? 'Concluída'
           : h.order?.status === 'CANCELLED' ? 'Cancelada'
           : h.order?.status === 'IN_PROGRESS' ? 'Em Andamento'
           : h.order?.status === 'PENDING' ? 'Pendente'
           : h.order?.status || '-'}
        </span>
      </td>
      <td class="actions">
        <button class="action-btn view" title="Visualizar detalhes">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  {/each}
</tbody>

      </table>
    </div>
  </div>
{/if}

<style>
  /* Estilos específicos para filtros nesta página */
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    margin-bottom: 1.5rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-weight: 500;
    font-size: 0.9rem;
    color: #374151;
  }

  .filter-group input,
  .filter-group select {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.625rem 0.75rem;
    font-size: 0.95rem;
    transition: border-color 0.2s ease;
  }

  .filter-group input:focus,
  .filter-group select:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }

  .filter-actions {
    display: flex;
    gap: 0.75rem;
    margin-left: auto;
  }
</style>
