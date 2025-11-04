<script>
  import '$lib/styles/estoque.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PieceApi } from '$lib/api/pieces';
  import { StockApi } from '$lib/api/stock';
  import { SettingsApi } from '$lib/api/settings';

  let loading = true;
  let error = '';

  let pecas = [];
  let movimentacoes = [];

  let busca = '';
  let filtroStatus = '';
  let filtroCategoria = '';
  let minStockThreshold = 5;

  onMount(async () => {
    try {
      // busca dados da API em paralelo
      const [settings, pieces, movements] = await Promise.all([
        SettingsApi.get(),
        PieceApi.list(),
        StockApi.listMovements(),
      ]);

      minStockThreshold = settings?.minStockThreshold ?? 5;

      // processa peças conforme API
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

  // helpers
  const moedaBR = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const dataBR = (v) =>
    new Date(v).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // filtros reativos
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

  // métricas
  $: totalSkus = pecas.length;
  $: totalValor = pecas.reduce((acc, p) => acc + p.quantidade * p.valorUnit, 0);
  $: itensBaixo = pecas.filter((p) => p.status === 'baixo').length;
  $: itensCritico = pecas.filter((p) => p.status === 'critico').length;

  const labelStatus = (s) =>
    s === 'normal' ? 'Normal' : s === 'baixo' ? 'Baixo' : 'Crítico';
</script>

<div class="page-header">
  <h1>📦 Estoque</h1>
</div>

{#if loading}
  <div class="loading-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Carregando dados...</p>
  </div>
{:else if error}
  <div class="error-state">
    <i class="fas fa-exclamation-circle"></i>
    <p>{error}</p>
  </div>
{:else}
  <!-- Barra de ações e filtros -->
  <div class="page-actions">
    <div class="search-bar">
      <i class="fas fa-search"></i>
      <input type="text" placeholder="Buscar peça..." bind:value={busca} />
    </div>
    <div>
      <button class="btn-primary" on:click={() => goto('/estoque/cadastro')}>
        <i class="fas fa-plus"></i> Nova Peça
      </button>
      <button class="btn-primary" on:click={() => goto('/estoque/movimentacoes')}>
        <i class="fas fa-list"></i> Movimentações
      </button>
    </div>
  </div>

  <div class="filters">
    <div class="filter-group">
      <label>Status</label>
      <select bind:value={filtroStatus}>
        <option value="">Todos</option>
        <option value="normal">Normal</option>
        <option value="baixo">Baixo</option>
        <option value="critico">Crítico</option>
      </select>
    </div>
    <div class="filter-group">
      <label>Categoria / Nome</label>
      <input type="text" placeholder="Filtrar por nome ou código" bind:value={filtroCategoria} />
    </div>
  </div>

  <!-- Métricas -->
  <div class="cards">
    <div class="card">
      <h3>Total de Itens</h3>
      <div class="number">{totalSkus}</div>
    </div>
    <div class="card">
      <h3>Valor Total</h3>
      <div class="number">{moedaBR(totalValor)}</div>
    </div>
    <div class="card baixo">
      <h3>Baixo Estoque</h3>
      <div class="number">{itensBaixo}</div>
    </div>
    <div class="card critico">
      <h3>Críticos</h3>
      <div class="number">{itensCritico}</div>
    </div>
  </div>

  <!-- Tabela de peças -->
  <div class="page-section">
    <h2>Peças em Estoque</h2>
    <div class="table-wrapper">
      <table class="standard-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nome</th>
          <th>Qtd.</th>
          <th>Mínimo</th>
          <th>Status</th>
          <th>Valor Unit.</th>
        </tr>
      </thead>
      <tbody>
        {#if pecasFiltradas.length === 0}
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
              <div class="empty-state" style="padding: 0; box-shadow: none; background: transparent;">
                <i class="fas fa-box-open"></i>
                <p>Nenhum registro encontrado.</p>
              </div>
            </td>
          </tr>
        {:else}
          {#each pecasFiltradas as p}
            <tr class={p.status}>
              <td>{p.codigo}</td>
              <td>{p.nome}</td>
              <td>{p.quantidade}</td>
              <td>{p.minimo}</td>
              <td><span class={"status-estoque " + p.status}>{labelStatus(p.status)}</span></td>
              <td>{moedaBR(p.valorUnit)}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
    </div>
  </div>

  <!-- Últimas movimentações -->
  <div class="page-section">
    <h2>Últimas Movimentações</h2>
    <div class="table-wrapper">
      <table class="standard-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Peça</th>
          <th>Tipo</th>
          <th>Qtd.</th>
          <th>Usuário</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>
        {#each movimentacoes.slice(0, 10) as m}
          <tr>
            <td>{dataBR(m.movedAt)}</td>
            <td>{m.piece?.name}</td>
            <td>
              <span class={"mov-type " + m.type.toLowerCase()}>
                {m.type === 'ENTRY' ? 'Entrada' : 'Saída'}
              </span>
            </td>
            <td>{m.quantity}</td>
            <td>{m.user?.name}</td>
            <td>{m.notes || '-'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    </div>
  </div>
{/if}

<style>
  .loading, .error {
    text-align: center;
    margin: 2rem 0;
  }

  .status-estoque.normal { color: #15803d; font-weight: bold; }
  .status-estoque.baixo { color: #ca8a04; font-weight: bold; }
  .status-estoque.critico { color: #b91c1c; font-weight: bold; }

  .mov-type.entry { color: #16a34a; font-weight: bold; }
  .mov-type.exit { color: #dc2626; font-weight: bold; }

  tr.critico { background: #fee2e2; }
  tr.baixo { background: #fef9c3; }

  .cards {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin: 1.5rem 0;
  }

  .card {
    flex: 1;
    min-width: 200px;
    background: #fff;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }

  .card.baixo { background: #fff7e6; }
  .card.critico { background: #ffe6e6; }

  .card .number {
    font-size: 1.8rem;
    font-weight: 700;
    margin-top: .5rem;
  }
</style>
