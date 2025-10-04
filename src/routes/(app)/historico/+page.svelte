<script>
  import '$lib/styles/historico.css';

  let busca = '';
  let filtroEquipamento = '';
  let filtroTipo = '';
  let dataDe = '';
  let dataAte = '';

  let historico = [
    {
      id: '#043',
      equipamento: 'Prensa Hidráulica',
      tipo: 'Preventiva',
      data: '03/09/2023',
      tecnico: 'João Pereira',
      tempo: '4h 30min',
      custo: 'R$ 237,50',
      status: 'concluida'
    },
    {
      id: '#042',
      equipamento: 'Misturador Industrial',
      tipo: 'Corretiva',
      data: '30/08/2023',
      tecnico: 'Maria Oliveira',
      tempo: '6h 15min',
      custo: 'R$ 485,00',
      status: 'concluida'
    },
    {
      id: '#041',
      equipamento: 'Compressor B',
      tipo: 'Preventiva',
      data: '25/08/2023',
      tecnico: 'Carlos Silva',
      tempo: '3h 45min',
      custo: 'R$ 152,00',
      status: 'concluida'
    },
    {
      id: '#040',
      equipamento: 'Máquina de Moldagem A',
      tipo: 'Preditiva',
      data: '20/08/2023',
      tecnico: 'Ana Santos',
      tempo: '5h 20min',
      custo: 'R$ 320,00',
      status: 'concluida'
    },
    {
      id: '#039',
      equipamento: 'Esteira Transportadora',
      tipo: 'Corretiva',
      data: '15/08/2023',
      tecnico: 'João Pereira',
      tempo: '8h 00min',
      custo: 'R$ 720,00',
      status: 'concluida'
    }
  ];
</script>

<div class="header">
  <h1>Histórico de Manutenções</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar no histórico..." bind:value={busca} />
  </div>
  <button class="btn">
    <i class="fas fa-download"></i> Exportar
  </button>
</div>

<div class="filters">
  <div class="filter-group">
    <label for="equipmentFilter">Equipamento</label>
    <select id="equipmentFilter" bind:value={filtroEquipamento}>
      <option value="">Todos</option>
      <option value="Máquina de Moldagem A">Máquina de Moldagem A</option>
      <option value="Compressor B">Compressor B</option>
      <option value="Prensa Hidráulica">Prensa Hidráulica</option>
      <option value="Misturador Industrial">Misturador Industrial</option>
    </select>
  </div>
  <div class="filter-group">
    <label for="typeFilter">Tipo de Manutenção</label>
    <select id="typeFilter" bind:value={filtroTipo}>
      <option value="">Todos</option>
      <option value="Preventiva">Preventiva</option>
      <option value="Corretiva">Corretiva</option>
      <option value="Preditiva">Preditiva</option>
    </select>
  </div>
  <div class="filter-group">
    <label for="dateFrom">De</label>
    <input type="date" id="dateFrom" bind:value={dataDe} />
  </div>
  <div class="filter-group">
    <label for="dateTo">Até</label>
    <input type="date" id="dateTo" bind:value={dataAte} />
  </div>
  <div class="filter-actions">
    <button class="apply">Aplicar Filtros</button>
    <button on:click={() => {filtroEquipamento=''; filtroTipo=''; dataDe=''; dataAte=''}}>Limpar</button>
  </div>
</div>

<div class="section">
  <h2>Histórico Completo</h2>
  <table>
    <thead>
      <tr>
        <th>Nº OS</th>
        <th>Equipamento</th>
        <th>Tipo</th>
        <th>Data Execução</th>
        <th>Técnico</th>
        <th>Tempo</th>
        <th>Custo Total</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {#each historico as h}
        <tr>
          <td>{h.id}</td>
          <td>{h.equipamento}</td>
          <td>{h.tipo}</td>
          <td>{h.data}</td>
          <td>{h.tecnico}</td>
          <td>{h.tempo}</td>
          <td>{h.custo}</td>
          <td>
            <span class={"status " + h.status}>{h.status === 'concluida' ? 'Concluída' : h.status}</span>
          </td>
          <td class="actions">
            <button class="action-btn view"><i class="fas fa-eye"></i></button>
            <button class="action-btn download"><i class="fas fa-download"></i></button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
