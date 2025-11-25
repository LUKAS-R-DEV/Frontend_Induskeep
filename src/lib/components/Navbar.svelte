<script>
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { NotificationsApi } from '$lib/api/notifications';
  import { 
    Menu, 
    Bell, 
    Home, 
    ClipboardList, 
    Users, 
    UserPlus, 
    Cog, 
    Settings, 
    Package, 
    Boxes, 
    FileText, 
    ChartBar, 
    Calendar, 
    CalendarPlus, 
    History, 
    PlusCircle, 
    AlertTriangle 
  } from "lucide-svelte";

  let unreadCount = 0;
  let loadingNotifications = false;
  let intervalId = null;

  // Função para buscar notificações não lidas
  async function fetchUnreadCount() {
    if (loadingNotifications) return;
    
    try {
      loadingNotifications = true;
      const notifications = await NotificationsApi.list();
      unreadCount = notifications.filter(n => !n.read).length;
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      unreadCount = 0;
    } finally {
      loadingNotifications = false;
    }
  }

  // Função para alternar o sidebar
  function toggleSidebar() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sidebar-toggle'));
    }
  }

  // Atualizar contador quando a página de notificações mudar (com debounce)
  let lastPathname = '';
  $: if ($page.url.pathname === '/notificacoes' && $page.url.pathname !== lastPathname) {
    lastPathname = $page.url.pathname;
    // Pequeno delay para evitar chamadas simultâneas
    setTimeout(() => fetchUnreadCount(), 200);
  }

  onMount(() => {
    fetchUnreadCount();
    // Atualizar a cada 30 segundos
    intervalId = setInterval(fetchUnreadCount, 30000);
    
    // Escutar eventos de atualização de notificações
    if (typeof window !== 'undefined') {
      window.addEventListener('notification-updated', fetchUnreadCount);
    }
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('notification-updated', fetchUnreadCount);
    }
  });

  // Mapa de breadcrumbs com ícones Lucide (SVG vetoriais)
  const breadcrumbMap = [
    // Rotas filhas específicas
    { path: '/ordens/cadastro', label: 'Nova Ordem', icon: PlusCircle },
    { path: '/ordens/', label: 'Ordens de Serviço', icon: ClipboardList },
    { path: '/usuarios/cadastro', label: 'Novo Usuário', icon: UserPlus },
    { path: '/usuarios/', label: 'Usuários', icon: Users },
    { path: '/equipamentos/cadastro', label: 'Novo Equipamento', icon: Cog },
    { path: '/equipamentos/', label: 'Equipamentos', icon: Cog },
    { path: '/estoque/cadastro', label: 'Nova Peça', icon: Package },
    { path: '/estoque/movimentacoes', label: 'Movimentações', icon: Boxes },
    { path: '/estoque/', label: 'Estoque', icon: Boxes },
    { path: '/agendamentos/nova', label: 'Novo Agendamento', icon: CalendarPlus },
    { path: '/agendamentos/', label: 'Agendamentos', icon: Calendar },

    // Rotas principais
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList },
    { path: '/usuarios', label: 'Usuários', icon: Users },
    { path: '/equipamentos', label: 'Equipamentos', icon: Cog },
    { path: '/estoque', label: 'Estoque', icon: Boxes },
    { path: '/relatorios', label: 'Relatórios', icon: ChartBar },
    { path: '/historico', label: 'Histórico', icon: History },
    { path: '/notificacoes', label: 'Notificações', icon: Bell },
    { path: '/agendamentos', label: 'Agendamentos', icon: Calendar },
    { path: '/configuracoes', label: 'Configurações', icon: Settings },
    { path: '/logs', label: 'Logs de Auditoria', icon: FileText }
  ];

  // Caminho atual reativo
  $: currentPath = $page.url.pathname;

  // Breadcrumb atual
  $: currentBreadcrumb = (() => {
    const path = currentPath || '/';
    for (const item of breadcrumbMap) {
      const itemPath = item.path.replace(/\/$/, '');
      if (path === itemPath || path === item.path) return item;
    }
    for (const item of breadcrumbMap) {
      const itemPath = item.path.replace(/\/$/, '');
      if (path.startsWith(itemPath + '/')) return item;
    }
    return { label: 'Página', icon: AlertTriangle };
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
        <Menu size={22} />
      </button>
      
      <div class="page-title-wrapper">
        <div class="page-icon">
          <svelte:component this={currentBreadcrumb.icon} size={20} color="white" />
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
        <Bell size={20} />
        {#if unreadCount > 0}
          <span class="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        {/if}
      </a>
    </div>
  </div>
</nav>

<style>
  /* ===========================
     NAVBAR PROFISSIONAL COM ÍCONES SVG
  =========================== */
  .navbar {
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(10px);
  }

  .navbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
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
  }

  .page-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  }

  .page-title-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .page-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Right Section */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .action-btn {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #f8fafc;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .action-btn:hover {
    background: #f1f5f9;
    color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.125rem 0.375rem;
    border-radius: 10px;
    border: 2px solid white;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  /* SVG refinado */
  svg {
    stroke-width: 2;
    transition: transform 0.2s ease;
  }

  .action-btn:hover svg,
  .sidebar-toggle:hover svg {
    transform: scale(1.1);
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

    .page-icon {
      width: 40px;
      height: 40px;
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

    .notification-badge {
      font-size: 0.5625rem;
      min-width: 16px;
      height: 16px;
      padding: 0.125rem 0.25rem;
      top: -3px;
      right: -3px;
    }
  }

  @media (max-width: 480px) {
    .page-title {
      font-size: 1rem;
      max-width: 150px;
    }

    .notification-badge {
      font-size: 0.5rem;
      min-width: 14px;
      height: 14px;
      padding: 0.0625rem 0.25rem;
    }
  }
</style>
