<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import { canAccessRoute, hasPermission, isAdmin } from '$lib/utils/permissions.js';

  // ✅ Ícones Lucide
  import {
    Home,
    ClipboardList,
    Users,
    Cog,
    Boxes,
    BarChart3,
    History,
    Bell,
    Calendar,
    Settings,
    FileText,
    Factory,
    X,
    UserCircle,
    LogOut,
  } from 'lucide-svelte';

  let user = null;
  let sidebarOpen = false;

  // Tornar reativo para atualizar automaticamente quando a rota mudar
  $: currentPath = $page.url.pathname;

  // Função para carregar user (apenas no browser)
  function loadUser() {
    // Verifica se está no browser antes de acessar localStorage
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        user = JSON.parse(stored);
        console.log('Sidebar: User loaded from localStorage', user);
      } else {
        user = null;
      }
    } catch (e) {
      console.error('Sidebar: Error parsing user', e);
      user = null;
    }
  }

  // Carrega user apenas no browser
  onMount(() => {
    // Carrega user inicialmente
    loadUser();

    // Escuta mudanças no localStorage (para atualizar quando fizer login)
    function handleStorageChange() {
      loadUser();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      // Também verifica periodicamente (para mudanças na mesma aba)
      const interval = setInterval(loadUser, 1000);

      // Escuta eventos do botão hamburger da Navbar
      function handleSidebarToggle() {
        sidebarOpen = !sidebarOpen;
      }

      window.addEventListener('sidebar-toggle', handleSidebarToggle);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('sidebar-toggle', handleSidebarToggle);
        clearInterval(interval);
      };
    }
  });

  // Recarrega user quando navegar (apenas no cliente)
  afterNavigate(() => {
    if (typeof window !== 'undefined') {
      loadUser();
    }
  });

  function closeSidebar() {
    sidebarOpen = false;
  }

  // Menu items com permissões
  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      permission: 'VIEW_MACHINES', // Todos podem ver
      roles: ['TECHNICIAN', 'SUPERVISOR', 'ADMIN']
    },
    {
      label: 'Ordens de Serviço',
      icon: ClipboardList,
      href: '/ordens',
      permission: 'VIEW_ORDERS',
      roles: ['TECHNICIAN', 'SUPERVISOR', 'ADMIN']
    },
    {
      label: 'Usuários',
      icon: Users,
      href: '/usuarios',
      permission: 'ALL',
      roles: ['ADMIN']
    },
    {
      label: 'Equipamentos',
      icon: Cog,
      href: '/equipamentos',
      permission: 'VIEW_MACHINES',
      roles: ['TECHNICIAN', 'SUPERVISOR', 'ADMIN']
    },
    {
      label: 'Estoque',
      icon: Boxes,
      href: '/estoque',
      permission: 'VIEW_PIECES',
      roles: ['TECHNICIAN', 'SUPERVISOR', 'ADMIN']
    },
    {
      label: 'Relatórios',
      icon: BarChart3,
      href: '/relatorios',
      permission: 'VIEW_REPORTS',
      roles: ['SUPERVISOR', 'ADMIN']
    },
    {
      label: 'Histórico',
      icon: History,
      href: '/historico',
      permission: 'VIEW_HISTORY',
      roles: ['SUPERVISOR', 'ADMIN'] // Apenas supervisor e admin
    },
    {
      label: 'Notificações',
      icon: Bell,
      href: '/notificacoes',
      permission: 'VIEW_NOTIFICATIONS',
      roles: ['TECHNICIAN', 'SUPERVISOR', 'ADMIN']
    },
    {
      label: 'Agendamentos',
      icon: Calendar,
      href: '/agendamentos',
      permission: 'CREATE_SCHEDULE',
      roles: ['SUPERVISOR', 'ADMIN']
    },
    {
      label: 'Configurações',
      icon: Settings,
      href: '/configuracoes',
      permission: 'MANAGE_SETTINGS',
      roles: ['SUPERVISOR', 'ADMIN']
    },
    {
      label: 'Logs de Auditoria',
      icon: FileText,
      href: '/logs',
      permission: 'ALL',
      roles: ['ADMIN']
    }
  ];

  function isItemVisible(item) {
    if (!user || !user.role) {
      return false;
    }
    
    const userRole = String(user.role).toUpperCase().trim();
    
    // ADMIN sempre tem acesso a tudo (porque tem "ALL" no RolePolicy)
    if (isAdmin(userRole)) {
      return true; // ADMIN vê todos os itens
    }
    
    // Se requer ALL, só ADMIN pode ver
    if (item.permission === 'ALL') {
      return false; // Já foi verificado acima, mas se não é ADMIN, retorna false
    }
    
    // Verifica se o role do usuário está na lista de roles permitidos (case-insensitive)
    const normalizedRoles = item.roles.map(r => String(r).toUpperCase().trim());
    return normalizedRoles.includes(userRole);
  }

  // Reativo para debug
  $: if (user) {
    console.log('Sidebar: User reactive update', { 
      user, 
      role: user?.role, 
      hasRole: !!user?.role,
      isAdmin: isAdmin(user?.role?.toUpperCase())
    });
  }
  
  // Debug: mostra quais itens estão visíveis
  $: if (user) {
    const visibleItems = menuItems.filter(item => isItemVisible(item));
    console.log('Sidebar: Visible items', visibleItems.map(i => i.label));
  }

  // Função para verificar se um item está ativo
  function isActive(href) {
    // Para dashboard, apenas exata match
    if (href === '/dashboard') {
      return currentPath === '/dashboard';
    }
    // Para outras rotas, verifica se começa com o href
    return currentPath.startsWith(href);
  }
  
  // Criar um mapa reativo de estados ativos para cada item do menu
  // Isso força o Svelte a recalcular quando currentPath mudar
  $: activeStates = menuItems.reduce((acc, item) => {
    if (item.href === '/dashboard') {
      acc[item.href] = currentPath === '/dashboard';
    } else {
      acc[item.href] = currentPath.startsWith(item.href);
    }
    return acc;
  }, {});

  function handleLogout() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
</script>

{#if sidebarOpen}
  <div class="sidebar-overlay" on:click={closeSidebar} on:keydown={(e) => e.key === 'Escape' && closeSidebar()}></div>
{/if}

<aside class="sidebar {sidebarOpen ? 'open' : ''}">
  <div class="sidebar-header">
    <div class="logo-container">
      <Factory size={28} />
      <span class="logo-text">INDUSKEEP</span>
    </div>
    <button class="close-sidebar-btn" on:click={closeSidebar} aria-label="Fechar menu">
      <X size={18} />
    </button>
  </div>

  <nav class="sidebar-nav">
    {#if !user}
      <div class="sidebar-loading">
        <p>Carregando...</p>
      </div>
    {:else}
      <ul class="menu-list">
        {#each menuItems as item}
          {#if isItemVisible(item)}
            <li class="menu-item">
              <a 
                href={item.href} 
                class="menu-link {activeStates[item.href] ? 'active' : ''}"
                data-sveltekit-preload-data="hover"
                on:click={closeSidebar}
              >
                <svelte:component this={item.icon} size={20} />
                <span>{item.label}</span>
              </a>
            </li>
          {/if}
        {/each}
      </ul>
    {/if}
  </nav>

  <div class="sidebar-footer">
    <div class="user-section">
      <div class="user-avatar">
        <UserCircle size={24} />
      </div>
      <div class="user-details">
        <div class="user-name">{user?.name || 'Usuário'}</div>
        <div class="user-role">{user?.role || 'N/A'}</div>
      </div>
    </div>
    <button class="logout-btn" on:click={handleLogout}>
      <LogOut size={18} />
      <span>Sair</span>
    </button>
  </div>
</aside>

<style>
  /* ===========================
     SIDEBAR MODERNO
  =========================== */
  .sidebar {
    width: 260px;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    z-index: 100;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }

  /* Header */
  .sidebar-header {
    padding: 1.5rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #ffffff;
    flex: 1;
  }

  .logo-container :global(svg) {
    width: 28px;
    height: 28px;
    color: #3b82f6;
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .close-sidebar-btn {
    display: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
    align-items: center;
    justify-content: center;
  }

  .close-sidebar-btn :global(svg) {
    width: 18px;
    height: 18px;
    color: rgba(255, 255, 255, 0.7);
  }

  .close-sidebar-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }

  /* Navigation */
  .sidebar-nav {
    flex: 1;
    padding: 1rem 0.75rem;
    overflow-y: auto;
  }

  .sidebar-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
  }

  .menu-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .menu-item {
    margin: 0;
  }

  .menu-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    border-radius: 10px;
    transition: all 0.2s ease;
    font-weight: 500;
    font-size: 0.95rem;
    position: relative;
  }

  .menu-link :global(svg) {
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.6);
    transition: color 0.2s ease;
    flex-shrink: 0;
  }

  .menu-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateX(4px);
  }

  .menu-link:hover :global(svg) {
    color: #60a5fa;
  }

  .menu-link.active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .menu-link.active :global(svg) {
    color: #ffffff;
  }

  .menu-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: #ffffff;
    border-radius: 0 2px 2px 0;
  }

  /* Footer */
  .sidebar-footer {
    padding: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    flex-shrink: 0;
  }

  .user-avatar :global(svg) {
    width: 24px;
    height: 24px;
    color: #ffffff;
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-weight: 600;
    color: #ffffff;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: capitalize;
    margin-top: 0.125rem;
  }

  .logout-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    color: #fca5a5;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    color: #ffffff;
    transform: translateY(-1px);
  }

  .logout-btn :global(svg) {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  /* Scrollbar */
  .sidebar::-webkit-scrollbar,
  .sidebar-nav::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar::-webkit-scrollbar-track,
  .sidebar-nav::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  .sidebar::-webkit-scrollbar-thumb,
  .sidebar-nav::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .sidebar::-webkit-scrollbar-thumb:hover,
  .sidebar-nav::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Overlay para mobile */
  .sidebar-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
    backdrop-filter: blur(2px);
  }

  /* Responsive */
  @media (max-width: 920px) {
    .sidebar-overlay {
      display: block;
    }

    .sidebar {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
      z-index: 100;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .close-sidebar-btn {
      display: flex;
    }
  }
</style>
