<aside class="sidebar">
  <ul>
    <li><a href="/dashboard"><i class="fas fa-home"></i> Dashboard</a></li>
    <li><a href="/ordens"><i class="fas fa-tasks"></i> Ordens de Serviço</a></li>
    <li><a href="/usuarios"><i class="fas fa-users"></i> Usuários</a></li>
    <li><a href="/equipamentos"><i class="fas fa-cogs"></i> Equipamentos</a></li>
    <li><a href="/estoque"><i class="fas fa-boxes"></i> Estoque</a></li>
    <li><a href="/relatorios"><i class="fas fa-chart-bar"></i> Relatórios</a></li>
    <li><a href="/historico"><i class="fas fa-history"></i> Histórico</a></li>
    <li><a href="/notificacoes"><i class="fas fa-bell"></i> Notificações</a></li>
    <li><a href="/login" data-sveltekit-reload><i class="fas fa-sign-out-alt"></i>Sair</a></li>
  </ul>
</aside>

<style>
  .sidebar {
    width: 220px;
    background:#003366;
    border-right: 1px solid #ddd;
    padding: 1rem;
    height: 100vh;
    position:fixed;
    top: 0;
    overflow-y: auto;
    flex-shrink: 0;
  }
  .sidebar ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0;
    padding: 0;
  }
  .sidebar a {
    color:white;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: .5rem;
    font-weight: 500;
    transition: color .2s;
    padding: 0.5rem;
    border-radius: 4px;
  }
  .sidebar a:hover {
    color: #0066cc;
    background: #eef2f7;
  } 

</style>