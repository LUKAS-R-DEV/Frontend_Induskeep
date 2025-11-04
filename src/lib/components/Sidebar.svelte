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
    <li><a href="/agendamentos"><i class="fas fa-calendar-alt"></i> Agendamentos</a></li>
    <li><a href="/configuracoes"><i class="fas fa-gear"></i> Configurações</a></li>
    <li><a href="/login" data-sveltekit-reload><i class="fas fa-sign-out-alt"></i> Sair</a></li>

  </ul>
</aside>

<style>
  /* ===========================
     SIDEBAR BASE
  =========================== */
  .sidebar {
    width: 220px;
    background: #003366;
    border-right: 1px solid #ddd;
    padding: 1rem;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    overflow-y: auto;
    flex-shrink: 0;
    z-index: 100;

    /* 🧩 PREVENÇÃO DE ARTEFATOS E LINHAS DE TABELA */
    transform: translateZ(0);
    backface-visibility: hidden;
    contain: layout paint;
    will-change: scroll-position;
  }

  .sidebar ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
  }

  .sidebar li {
    border-radius: 6px;
    overflow: hidden;
  }

  .sidebar a {
    color: #ffffff;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 500;
    padding: 0.65rem 0.75rem;
    border-radius: 6px;
    transition: background 0.2s ease, color 0.2s ease;
  }

  /* ===========================
     HOVER SEM TRANSFORM/FILTER
  =========================== */
  .sidebar a:hover {
    background: linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(230,235,245,0.95) 100%);
    color: #003366;
  }

  /* ===========================
     ITEM ATIVO (opcional)
  =========================== */
  .sidebar a.active {
    background: #ffffff;
    color: #003366;
    font-weight: 600;
  }

  .sidebar i {
    width: 20px;
    text-align: center;
  }

  /* ===========================
     SCROLLBAR PERSONALIZADA
  =========================== */
  .sidebar::-webkit-scrollbar {
    width: 8px;
  }
  .sidebar::-webkit-scrollbar-track {
    background: #002b5c;
  }
  .sidebar::-webkit-scrollbar-thumb {
    background-color: #0059b3;
    border-radius: 8px;
  }

  /* ===========================
     RESPONSIVIDADE MOBILE
  =========================== */
  @media (max-width: 920px) {
    .sidebar {
      position: fixed;
      left: -220px;
      transition: left 0.3s ease;
      z-index: 999;
    }

    .sidebar.open {
      left: 0;
    }
  }
</style>
