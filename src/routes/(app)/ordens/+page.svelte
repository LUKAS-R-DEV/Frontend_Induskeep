<script>
  import '$lib/styles/ordens.css';

  let search = '';
  let statusFilter = '';
  let priorityFilter = '';
  let dateFilter = '';

  let ordens = [
    {
      id: '#045',
      equipamento: 'Máquina de Moldagem A',
      abertura: '05/09/2023',
      previsao: '10/09/2023',
      tecnico: 'Carlos Silva',
      prioridade: 'alta',
      status: 'aberta'
    },
    {
      id: '#044',
      equipamento: 'Compressor B',
      abertura: '03/09/2023',
      previsao: '05/09/2023',
      tecnico: 'Ana Santos',
      prioridade: 'media',
      status: 'andamento'
    },
    {
      id: '#043',
      equipamento: 'Prensa Hidráulica',
      abertura: '01/09/2023',
      previsao: '03/09/2023',
      tecnico: 'João Pereira',
      prioridade: 'baixa',
      status: 'concluida'
    },
    {
      id: '#042',
      equipamento: 'Misturador Industrial',
      abertura: '28/08/2023',
      previsao: '30/08/2023',
      tecnico: 'Maria Oliveira',
      prioridade: 'alta',
      status: 'cancelada'
    }
  ];

  // Label para mostrar o texto bonitinho
  const statusLabels = {
    aberta: 'Aberta',
    andamento: 'Em Andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada'
  };

  const prioridadeLabels = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa'
  };
</script>

<div class="header">
  <h1>Ordens de Serviço</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar ordem de serviço..." bind:value={search} />
  </div>
  <button class="btn" on:click={() => window.location.href='/ordens/cadastro'}>
    <i class="fas fa-plus"></i> Nova OS
  </button>
</div>

<div class="filters">
  <div class="filter-group">
    <label for="statusFilter">Status</label>
    <select id="statusFilter" bind:value={statusFilter}>
      <option value="">Todos</option>
      <option value="aberta">Aberta</option>
      <option value="andamento">Em Andamento</option>
      <option value="concluida">Concluída</option>
      <option value="cancelada">Cancelada</option>
    </select>
  </div>
  <div class="filter-group">
    <label for="priorityFilter">Prioridade</label>
    <select id="priorityFilter" bind:value={priorityFilter}>
      <option value="">Todas</option>
      <option value="alta">Alta</option>
      <option value="media">Média</option>
      <option value="baixa">Baixa</option>
    </select>
  </div>
  <div class="filter-group">
    <label for="dateFilter">Período</label>
    <input type="date" id="dateFilter" bind:value={dateFilter} />
  </div>
  <div class="filter-actions">
    <button class="apply">Aplicar Filtros</button>
    <button on:click={() => {statusFilter=''; priorityFilter=''; dateFilter=''}}>Limpar</button>
  </div>
</div>

<div class="section">
  <h2>Lista de Ordens de Serviço</h2>
  <table>
    <thead>
      <tr>
        <th>Nº OS</th>
        <th>Equipamento</th>
        <th>Data Abertura</th>
        <th>Previsão</th>
        <th>Técnico</th>
        <th>Prioridade</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {#each ordens as os}
        <tr>
          <td>{os.id}</td>
          <td>{os.equipamento}</td>
          <td>{os.abertura}</td>
          <td>{os.previsao}</td>
          <td>{os.tecnico}</td>
          <td><span class={"priority " + os.prioridade}>{prioridadeLabels[os.prioridade]}</span></td>
          <td><span class={"status " + os.status}>{statusLabels[os.status]}</span></td>
          <td class="actions">
            <button class="action-btn view" title="Ver detalhes"><i class="fas fa-eye"></i></button>
            <button class="action-btn edit" title="Editar"><i class="fas fa-edit"></i></button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
