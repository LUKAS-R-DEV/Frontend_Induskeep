<!-- src/routes/(app)/estoque/+page.svelte -->
<script>
  import '$lib/styles/estoque.css';
  import { goto } from '$app/navigation';

  // Abas
  let abaAtiva = 'listagem'; // 'listagem' | 'visao' | 'movimentacoes'

  function trocarAba(aba) {
    abaAtiva = aba;
  }

  // Filtros e busca
  let busca = '';
  let filtroStatus = '';
  let filtroCategoria = '';

  // Tabela principal de peças (exemplo mock)
  let pecas = [
    { codigo: 'P001', nome: 'Rolamento AX-205', categoria: 'Mecânica', quantidade: 5,  minimo: 10, status: 'critico', valorUnit: 85.0 },
    { codigo: 'P002', nome: 'Sensor de Temperatura', categoria: 'Elétrica', quantidade: 15, minimo: 5,  status: 'normal',  valorUnit: 120.0 },
    { codigo: 'P003', nome: 'Correia Dentada 5M',   categoria: 'Mecânica', quantidade: 8,  minimo: 10, status: 'baixo',   valorUnit: 45.0 },
    { codigo: 'P004', nome: 'Válvula Solenoide',    categoria: 'Pneumática', quantidade: 22, minimo: 8, status: 'normal',  valorUnit: 75.0 },
    { codigo: 'P005', nome: 'Cilindro Hidráulico',  categoria: 'Hidráulica', quantidade: 4,  minimo: 6,  status: 'baixo',   valorUnit: 320.0 }
  ];

  // Movimentações (exemplo mock)
  const movimentacoes = [
    { data: '05/09/2023', peca: 'Rolamento AX-205', tipo: 'Saída',   quantidade: 2, responsavel: 'Carlos Silva', os: '#045' },
    { data: '04/09/2023', peca: 'Sensor de Temperatura', tipo: 'Entrada', quantidade: 10, responsavel: 'Admin', os: '-' },
    { data: '03/09/2023', peca: 'Correia Dentada 5M', tipo: 'Saída', quantidade: 3, responsavel: 'Ana Santos', os: '#044' }
  ];

  // Formatação de moeda pt-BR
  const moedaBR = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Filtro reativo
  $: pecasFiltradas = pecas
    .filter(p =>
      (!filtroStatus || p.status === filtroStatus) &&
      (!filtroCategoria || p.categoria.toLowerCase() === filtroCategoria) &&
      (
        !busca ||
        p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busca.toLowerCase())
      )
    );

  // Métricas da visão geral (exemplo com base nos mocks)
  $: totalSkus = pecas.length;
  $: totalValor = pecas.reduce((acc, p) => acc + (p.valorUnit * p.quantidade), 0);
  $: itensBaixo   = pecas.filter(p => p.status === 'baixo').length;
  $: itensCritico = pecas.filter(p => p.status === 'critico').length;

  // Labels de status
  const labelStatus = (s) => s === 'normal' ? 'Normal' : s === 'baixo' ? 'Baixo' : 'Crítico';
</script>

<svelte:head>
  <!-- Ícones (Font Awesome via CDN) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</svelte:head>

<div class="header">
  <h1>Gestão de Estoque</h1>

</div>

<!-- Abas -->
<div class="tabs">
  <div class="tab {abaAtiva === 'listagem' ? 'active' : ''}" on:click={() => trocarAba('listagem')}>Listagem</div>
  <div class="tab {abaAtiva === 'visao' ? 'active' : ''}" on:click={() => trocarAba('visao')}>Visão Geral</div>
  <div class="tab {abaAtiva === 'movimentacoes' ? 'active' : ''}" on:click={() => trocarAba('movimentacoes')}>Movimentações</div>
</div>

<!-- LISTAGEM -->
{#if abaAtiva === 'listagem'}
  <div class="page-actions">
    <div class="search-bar">
      <i class="fas fa-search"></i>
      <input type="text" placeholder="Buscar peça..." bind:value={busca} />
    </div>
    <div>
      <button class="btn success" on:click={() => goto('/estoque/entrada')}><i class="fas fa-plus"></i> Entrada</button>
      <button class="btn warning" on:click={() => goto('/estoque/saida')}><i class="fas fa-minus"></i> Saída</button>
      <button class="btn" on:click={() => goto('/estoque/cadastro')}><i class="fas fa-box"></i> Nova Peça</button>
    </div>
  </div>

  <div class="filters">
    <div class="filter-group">
      <label for="statusFilter">Status do Estoque</label>
      <select id="statusFilter" bind:value={filtroStatus}>
        <option value=''>Todos</option>
        <option value='normal'>Normal</option>
        <option value='baixo'>Baixo</option>
        <option value='critico'>Crítico</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="categoryFilter">Categoria</label>
      <select id="categoryFilter" bind:value={filtroCategoria}>
        <option value=''>Todas</option>
        <option value='elétrica'>Elétrica</option>
        <option value='mecânica'>Mecânica</option>
        <option value='hidráulica'>Hidráulica</option>
        <option value='pneumática'>Pneumática</option>
      </select>
    </div>
    <div class="filter-actions">
      <button class="apply" on:click={() => { /* já aplica automaticamente via bind */ }}>Aplicar Filtros</button>
      <button on:click={() => { filtroStatus=''; filtroCategoria=''; busca=''; }}>Limpar</button>
    </div>
  </div>

  <div class="section">
    <h2>Peças em Estoque</h2>
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Nome</th>
          <th>Categoria</th>
          <th>Quantidade</th>
          <th>Mínimo</th>
          <th>Status</th>
          <th>Valor Unit.</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {#if pecasFiltradas.length === 0}
          <tr><td colspan="8">Nenhum registro encontrado.</td></tr>
        {:else}
          {#each pecasFiltradas as p}
            <tr>
              <td>{p.codigo}</td>
              <td>{p.nome}</td>
              <td>{p.categoria}</td>
              <td>{p.quantidade}</td>
              <td>{p.minimo}</td>
              <td><span class={"status-estoque " + p.status}>{labelStatus(p.status)}</span></td>
              <td>{moedaBR(p.valorUnit)}</td>
              <td class="actions">
                <button class="action-btn edit" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="action-btn movement" title="Movimentar"><i class="fas fa-exchange-alt"></i></button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
{/if}

<!-- VISÃO GERAL -->
{#if abaAtiva === 'visao'}
  <div class="cards">
    <div class="card">
      <h3>Total de Itens (SKUs)</h3>
      <div class="number">{totalSkus}</div>
    </div>
    <div class="card">
      <h3>Valor Total em Estoque</h3>
      <div class="number">{moedaBR(totalValor)}</div>
    </div>
    <div class="card baixo">
      <h3>Itens com Estoque Baixo</h3>
      <div class="number">{itensBaixo}</div>
    </div>
    <div class="card critico">
      <h3>Itens com Estoque Crítico</h3>
      <div class="number">{itensCritico}</div>
    </div>
  </div>

  <div class="section">
    <h2>Itens Críticos</h2>
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Nome</th>
          <th>Qtd.</th>
          <th>Mín.</th>
          <th>Status</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {#each pecas.filter(p => p.status === 'critico') as p}
          <tr>
            <td>{p.codigo}</td>
            <td>{p.nome}</td>
            <td>{p.quantidade}</td>
            <td>{p.minimo}</td>
            <td><span class="status-estoque critico">Crítico</span></td>
            <td class="actions">
              <button class="action-btn movement" title="Repor"><i class="fas fa-exchange-alt"></i> Repor</button>
            </td>
          </tr>
        {/each}
        {#if pecas.filter(p => p.status === 'critico').length === 0}
          <tr><td colspan="6">Sem itens críticos no momento.</td></tr>
        {/if}
      </tbody>
    </table>
  </div>
{/if}

<!-- MOVIMENTAÇÕES -->
{#if abaAtiva === 'movimentacoes'}
  <div class="section">
    <h2>Histórico de Movimentações</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Peça</th>
          <th>Tipo</th>
          <th>Quantidade</th>
          <th>Responsável</th>
          <th>OS</th>
        </tr>
      </thead>
      <tbody>
        {#each movimentacoes as m}
          <tr>
            <td>{m.data}</td>
            <td>{m.peca}</td>
            <td>{m.tipo}</td>
            <td>{m.quantidade}</td>
            <td>{m.responsavel}</td>
            <td>{m.os}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
