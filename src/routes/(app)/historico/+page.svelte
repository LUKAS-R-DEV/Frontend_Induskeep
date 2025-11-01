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
</script>

<!-- Cabeçalho -->
<div class="header">
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
  <button class="btn" on:click={exportarGeral}>
    <i class="fas fa-file-pdf"></i> Exportar Relatório Geral
  </button>
</div>

<!-- Filtros -->
<div class="filters">
  <div class="filter-group">
    <label>Equipamento</label>
    <select bind:value={filtroEquipamento}>
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
    <input type="date" bind:value={dataDe} />
  </div>

  <div class="filter-group">
    <label>Até</label>
    <input type="date" bind:value={dataAte} />
  </div>

  <div class="filter-actions">
    <button class="apply" on:click={aplicarFiltros}>
      <i class="fas fa-filter"></i> Aplicar
    </button>
    <button on:click={limparFiltros}>
      <i class="fas fa-eraser"></i> Limpar
    </button>
  </div>
</div>

<!-- Conteúdo principal -->
{#if loading}
  <div class="loading">Carregando histórico...</div>
{:else if filtrado.length === 0}
  <div class="empty">Nenhum registro encontrado.</div>
{:else}
  <div class="section">
    <h2>Histórico Completo</h2>
    <table>
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
        <span class={"status " + (h.order?.status?.toLowerCase() || '')}>
          {h.order?.status === 'CONCLUDED' ? 'Concluída'
           : h.order?.status === 'CANCELED' ? 'Cancelada'
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
{/if}

<style>
  .header {
    background: white;
    border-bottom: 2px solid #e5e7eb;
    padding: 1rem 1.5rem;
  }

  .page-actions {
    margin: 1.5rem 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .search-bar {
    display: flex;
    align-items: center;
    background: #f3f4f6;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    width: 300px;
  }
  .search-bar i { margin-right: 0.5rem; color: #6b7280; }
  .search-bar input {
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
    background: #fff;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .filter-group label { font-weight: 500; font-size: 0.9rem; }
  .filter-group input, .filter-group select {
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0.4rem 0.6rem;
  }

  .filter-actions { display: flex; gap: 0.75rem; margin-left: auto; }
  .filter-actions button {
    background: #2563eb; color: white; border: none; padding: 0.5rem 1rem;
    border-radius: 6px; cursor: pointer; font-size: 0.9rem;
  }
  .filter-actions button:last-child { background: #6b7280; }

  .section {
    margin-top: 1.5rem;
    background: #fff;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0.75rem;
  }
  thead th {
    background: #2563eb;
    color: white;
    padding: 0.75rem;
    text-align: left;
  }
  tbody td {
    padding: 0.6rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .status {
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    color: white;
    font-size: 0.85rem;
    text-transform: capitalize;
  }
  .status.concluida { background: #10b981; }
  .status.cancelada { background: #ef4444; }
  .status.pendente { background: #f59e0b; }

  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .action-btn {
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }
  .action-btn:hover { background: #e5e7eb; }

  .btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
  }

  .loading, .empty {
    text-align: center;
    margin: 2rem 0;
    color: #6b7280;
  }
</style>
