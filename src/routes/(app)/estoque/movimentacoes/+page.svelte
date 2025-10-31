<script>
  import '$lib/styles/estoque.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { StockApi } from '$lib/api/stock';

  let loading = true;
  let error = '';
  let movimentacoes = [];

  let busca = '';
  let filtroTipo = '';

  onMount(async () => {
    try {
      const data = await StockApi.listMovements();
      movimentacoes = data || [];
    } catch (e) {
      console.error(e);
      error = e.message || 'Erro ao carregar movimentações.';
    } finally {
      loading = false;
    }
  });

  // Formatações
  const dataBR = (v) =>
    new Date(v).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Filtros reativos
  $: movFiltradas = movimentacoes.filter(
    (m) =>
      (!filtroTipo || m.type === filtroTipo) &&
      (!busca ||
        m.piece?.name?.toLowerCase().includes(busca.toLowerCase()) ||
        m.piece?.code?.toLowerCase().includes(busca.toLowerCase()) ||
        m.user?.name?.toLowerCase().includes(busca.toLowerCase()))
  );

  const labelTipo = (tipo) => (tipo === 'ENTRY' ? 'Entrada' : 'Saída');
</script>

<div class="header">
  <h1>Movimentações de Estoque</h1>
</div>

<div class="page-actions">
  <button class="btn secondary" on:click={() => goto('/estoque')}>
    <i class="fas fa-arrow-left"></i> Voltar
  </button>
  <button class="btn" on:click={() => goto('/estoque/movimentacoes/nova')}>
    <i class="fas fa-plus"></i> Nova Movimentação
  </button>
</div>

{#if loading}
  <div class="loading">Carregando movimentações...</div>
{:else if error}
  <div class="error">⚠️ {error}</div>
{:else}
  <div class="filters">
    <div class="search-bar">
      <i class="fas fa-search"></i>
      <input type="text" placeholder="Buscar por peça ou usuário..." bind:value={busca} />
    </div>

    <div class="filter-group">
      <label>Tipo</label>
      <select bind:value={filtroTipo}>
        <option value="">Todos</option>
        <option value="ENTRY">Entrada</option>
        <option value="EXIT">Saída</option>
      </select>
    </div>
  </div>

  <div class="section">
    <h2>Histórico de Movimentações</h2>

    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Peça</th>
          <th>Código</th>
          <th>Tipo</th>
          <th>Qtd.</th>
          <th>Usuário</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>
        {#if movFiltradas.length === 0}
          <tr><td colspan="7">Nenhuma movimentação encontrada.</td></tr>
        {:else}
          {#each movFiltradas as m}
            <tr>
              <td>{dataBR(m.movedAt)}</td>
              <td>{m.piece?.name}</td>
              <td>{m.piece?.code}</td>
              <td>
                <span class={"mov-type " + m.type.toLowerCase()}>
                  {labelTipo(m.type)}
                </span>
              </td>
              <td>{m.quantity}</td>
              <td>{m.user?.name}</td>
              <td>{m.notes || '-'}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .loading, .error {
    text-align: center;
    margin: 2rem 0;
  }

  .filters {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin: 1rem 0;
    align-items: center;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .search-bar input {
    flex: 1;
    padding: 0.6rem;
    border: 1px solid #ccc;
    border-radius: 6px;
  }

  .mov-type.entry { color: #16a34a; font-weight: bold; }
  .mov-type.exit { color: #dc2626; font-weight: bold; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
  }

  th, td {
    padding: 0.75rem;
    border-bottom: 1px solid #eee;
    text-align: left;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
  }

  tr:hover {
    background: #f3f4f6;
  }
</style>
