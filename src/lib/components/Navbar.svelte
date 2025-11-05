<script>
  import { page } from '$app/stores';

  function toggleSidebar() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sidebar-toggle'));
    }
  }

  // Breadcrumb mapping - mais completo e ordenado por prioridade (rotas mais específicas primeiro)
  const breadcrumbMap = [
    // Rotas filhas específicas (devem vir antes das rotas pai)
    { path: '/ordens/cadastro', label: 'Nova Ordem', icon: 'fas fa-plus-circle' },
    { path: '/ordens/', label: 'Ordens de Serviço', icon: 'fas fa-tasks' },
    { path: '/usuarios/cadastro', label: 'Novo Usuário', icon: 'fas fa-user-plus' },
    { path: '/usuarios/', label: 'Usuários', icon: 'fas fa-users' },
    { path: '/equipamentos/cadastro', label: 'Novo Equipamento', icon: 'fas fa-cog' },
    { path: '/equipamentos/', label: 'Equipamentos', icon: 'fas fa-cogs' },
    { path: '/estoque/cadastro', label: 'Nova Peça', icon: 'fas fa-box' },
    { path: '/estoque/movimentacoes', label: 'Movimentações', icon: 'fas fa-exchange-alt' },
    { path: '/estoque/', label: 'Estoque', icon: 'fas fa-boxes' },
    { path: '/agendamentos/nova', label: 'Novo Agendamento', icon: 'fas fa-calendar-plus' },
    { path: '/agendamentos/', label: 'Agendamentos', icon: 'fas fa-calendar-alt' },
    // Rotas principais
    { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-home' },
    { path: '/ordens', label: 'Ordens de Serviço', icon: 'fas fa-tasks' },
    { path: '/usuarios', label: 'Usuários', icon: 'fas fa-users' },
    { path: '/equipamentos', label: 'Equipamentos', icon: 'fas fa-cogs' },
    { path: '/estoque', label: 'Estoque', icon: 'fas fa-boxes' },
    { path: '/relatorios', label: 'Relatórios', icon: 'fas fa-chart-bar' },
    { path: '/historico', label: 'Histórico', icon: 'fas fa-history' },
    { path: '/notificacoes', label: 'Notificações', icon: 'fas fa-bell' },
    { path: '/agendamentos', label: 'Agendamentos', icon: 'fas fa-calendar-alt' },
    { path: '/configuracoes', label: 'Configurações', icon: 'fas fa-gear' }
  ];

  // Computed reativo - depende diretamente de $page.url.pathname
  $: currentPath = $page.url.pathname;
  
  $: currentBreadcrumb = (() => {
    const path = currentPath || '/';
    
    // Busca exata primeiro (sem trailing slash)
    for (const item of breadcrumbMap) {
      const itemPath = item.path.replace(/\/$/, ''); // Remove trailing slash
      if (path === itemPath || path === item.path) {
        return item;
      }
    }
    
    // Busca por prefixo (para rotas filhas) - precisa ter trailing slash ou ser seguido por /
    for (const item of breadcrumbMap) {
      const itemPath = item.path.replace(/\/$/, ''); // Remove trailing slash
      if (path.startsWith(itemPath + '/')) {
        return item;
      }
    }
    
    // Fallback
    return { label: 'Página', icon: 'fas fa-file' };
  })();
</script>

<nav class="navbar">
  <div class="navbar-content">
    <div class="navbar-left">
      <button 
        class="sidebar-toggle" 
        on:click={toggleSidebar} 
        aria-label="Abrir menu"
        title="Menu"
      >
        <i class="fas fa-bars"></i>
      </button>
      
      <div class="page-title-wrapper">
        <div class="page-icon">
          <i class={currentBreadcrumb.icon}></i>
        </div>
        <div class="page-title-content">
          <h1 class="page-title">{currentBreadcrumb.label}</h1>
          <span class="page-subtitle">INDUSKEEP</span>
        </div>
      </div>
    </div>

    <div class="navbar-right">
      <a 
        href="/notificacoes" 
        class="action-btn notifications" 
        title="Notificações"
        aria-label="Notificações"
      >
        <i class="fas fa-bell"></i>
        <span class="notification-badge">0</span>
      </a>
    </div>
  </div>
</nav>

<style>
  /* ===========================
     NAVBAR PROFISSIONAL
  =========================== */
  .navbar {
    width: 100%;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 50;
    padding: 0;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
  }

  .navbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 100%;
    min-height: 64px;
  }

  /* Left Section */
  .navbar-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 1;
  }

  .sidebar-toggle {
    display: none;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: #f8fafc;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .sidebar-toggle:hover {
    background: #f1f5f9;
    color: #3b82f6;
    transform: scale(1.05);
  }

  .sidebar-toggle:active {
    transform: scale(0.95);
  }

  /* Page Title */
  .page-title-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }

  .page-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  }

  .page-title-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .page-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.3px;
  }

  .page-subtitle {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
  }

  /* Right Section */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  .navbar-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .action-btn {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: #f8fafc;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .action-btn:hover {
    background: #f1f5f9;
    color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  .notification-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    min-width: 20px;
    text-align: center;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
    border: 2px solid white;
  }

  /* Responsive */
  @media (max-width: 920px) {
    .sidebar-toggle {
      display: flex;
    }

    .navbar-content {
      padding: 1rem 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .navbar-content {
      padding: 0.875rem 1rem;
      min-height: 56px;
    }

    .page-title-wrapper {
      gap: 0.75rem;
    }

    .page-icon {
      width: 40px;
      height: 40px;
      font-size: 1.1rem;
    }

    .page-title {
      font-size: 1.1rem;
    }

    .page-subtitle {
      display: none;
    }

    .action-btn {
      width: 40px;
      height: 40px;
    }
  }

  @media (max-width: 480px) {
    .page-title {
      font-size: 1rem;
      max-width: 150px;
    }
  }
</style>
