<script>
  import '$lib/styles/equipamentos.css';
  import { goto } from '$app/navigation';

  let search = '';

  let equipamentos = [
    {
      nome: 'Máquina de Moldagem A',
      serie: 'MMA-2023-001',
      setor: 'Produção',
      ultimaManutencao: '15/08/2023',
      status: 'ativo'
    },
    {
      nome: 'Compressor B',
      serie: 'COM-2022-045',
      setor: 'Utilidades',
      ultimaManutencao: '22/07/2023',
      status: 'manutencao'
    },
    {
      nome: 'Esteira Transportadora',
      serie: 'EST-2021-078',
      setor: 'Expedição',
      ultimaManutencao: '10/06/2023',
      status: 'inativo'
    },
    {
      nome: 'Prensa Hidráulica',
      serie: 'PRE-2023-012',
      setor: 'Produção',
      ultimaManutencao: '05/09/2023',
      status: 'ativo'
    },
    {
      nome: 'Misturador Industrial',
      serie: 'MIS-2022-033',
      setor: 'Preparação',
      ultimaManutencao: '18/08/2023',
      status: 'ativo'
    }
  ];

  function editarEquipamento(eq) {
    alert(`Editar equipamento: ${eq.nome}`);
  }

  function deletarEquipamento(eq) {
    if (confirm(`Deseja realmente excluir ${eq.nome}?`)) {
      equipamentos = equipamentos.filter(e => e !== eq);
    }
  }
</script>

<div class="header">
  <h1>Gestão de Equipamentos</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar equipamento..." bind:value={search} />
  </div>
  <button class="btn" on:click={() => goto('/equipamentos/cadastro')}>
    <i class="fas fa-plus"></i> Novo Equipamento
  </button>
</div>

<div class="section">
  <h2>Lista de Equipamentos</h2>
  <table>
    <thead>
      <tr>
        <th>Nome</th>
        <th>Nº Série</th>
        <th>Setor</th>
        <th>Última Manutenção</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {#each equipamentos.filter(e => e.nome.toLowerCase().includes(search.toLowerCase()) || e.serie.toLowerCase().includes(search.toLowerCase())) as eq}
        <tr>
          <td>{eq.nome}</td>
          <td>{eq.serie}</td>
          <td>{eq.setor}</td>
          <td>{eq.ultimaManutencao}</td>
          <td><span class={"status " + eq.status}>{eq.status}</span></td>
          <td class="actions">
            <button class="action-btn edit" on:click={() => editarEquipamento(eq)}><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" on:click={() => deletarEquipamento(eq)}><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
