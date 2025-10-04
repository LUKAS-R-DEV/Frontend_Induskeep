<script>
  import '$lib/styles/usuarios.css';
  import { goto } from '$app/navigation';

  let search = '';

  let usuarios = [
    {
      nome: 'Administrador Sistema',
      email: 'admin@induskeep.com',
      perfil: 'administrador',
      setor: 'Todos',
      status: 'ativo',
      ultimoAcesso: '05/09/2023 14:30'
    },
    {
      nome: 'Carlos Silva',
      email: 'carlos.silva@induskeep.com',
      perfil: 'supervisor',
      setor: 'Manutenção',
      status: 'ativo',
      ultimoAcesso: '05/09/2023 13:45'
    },
    {
      nome: 'Ana Santos',
      email: 'ana.santos@induskeep.com',
      perfil: 'tecnico',
      setor: 'Produção',
      status: 'ativo',
      ultimoAcesso: '05/09/2023 12:20'
    },
    {
      nome: 'João Pereira',
      email: 'joao.pereira@induskeep.com',
      perfil: 'tecnico',
      setor: 'Utilidades',
      status: 'ativo',
      ultimoAcesso: '04/09/2023 16:40'
    },
    {
      nome: 'Maria Oliveira',
      email: 'maria.oliveira@induskeep.com',
      perfil: 'tecnico',
      setor: 'Expedição',
      status: 'inativo',
      ultimoAcesso: '28/08/2023 10:15'
    }
  ];

  function editarUsuario(usuario) {
    alert(`Editar usuário: ${usuario.nome}`);
  }

  function deletarUsuario(usuario) {
    if (confirm(`Deseja realmente excluir ${usuario.nome}?`)) {
      usuarios = usuarios.filter(u => u !== usuario);
    }
  }
</script>

<div class="header">
  <h1>Gestão de Usuários</h1>
</div>

<div class="page-actions">
  <div class="search-bar">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar usuário..." bind:value={search} />
  </div>
  <button class="btn" on:click={() => goto('/usuarios/cadastro')}>
    <i class="fas fa-plus"></i> Novo Usuário
  </button>
</div>

<div class="section">
  <h2>Lista de Usuários</h2>
  <table>
    <thead>
      <tr>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Perfil</th>
        <th>Setor</th>
        <th>Status</th>
        <th>Último Acesso</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {#each usuarios.filter(u => u.nome.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) as u}
        <tr>
          <td>{u.nome}</td>
          <td>{u.email}</td>
          <td><span class={"role " + u.perfil}>{u.perfil}</span></td>
          <td>{u.setor}</td>
          <td><span class={"status " + u.status}>{u.status}</span></td>
          <td>{u.ultimoAcesso}</td>
          <td class="actions">
            <button class="action-btn edit" on:click={() => editarUsuario(u)}><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" on:click={() => deletarUsuario(u)}><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
