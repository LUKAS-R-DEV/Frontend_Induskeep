// Sistema de Permissões baseado em Roles
// Alinhado com o backend RolePolicy

export const RolePolicy = {
  TECHNICIAN: [
    "VIEW_MACHINES",
    "VIEW_ORDERS",
    "VIEW_PIECES",
    "CREATE_HISTORY",
    "VIEW_NOTIFICATIONS",
    "VIEW_HISTORY",
  ],
  SUPERVISOR: [
    "VIEW_MACHINES",
    "CREATE_ORDER",
    "UPDATE_ORDER",
    "VIEW_REPORTS",
    "VIEW_PIECES",
    "CREATE_SCHEDULE",
    "VIEW_ORDERS",
    "VIEW_NOTIFICATIONS",
    "VIEW_HISTORY",
  ],
  ADMIN: [
    "ALL", // acesso total
  ],
};

// Mapeamento de rotas para permissões necessárias
export const RoutePermissions = {
  "/dashboard": ["VIEW_MACHINES", "VIEW_ORDERS"], // Todos podem ver
  "/ordens": ["VIEW_ORDERS"],
  "/ordens/cadastro": ["CREATE_ORDER"],
  "/ordens/[id]/editar": ["UPDATE_ORDER"],
  "/usuarios": ["ALL"], // Apenas ADMIN
  "/usuarios/cadastro": ["ALL"],
  "/usuarios/[id]/editar": ["ALL"],
  "/equipamentos": ["VIEW_MACHINES"],
  "/equipamentos/cadastro": ["ALL"], // Apenas ADMIN
  "/equipamentos/[id]/editar": ["ALL"], // Apenas ADMIN
  "/estoque": ["VIEW_PIECES"],
  "/estoque/cadastro": ["ALL"], // Apenas ADMIN
  "/estoque/movimentacoes": ["ALL"], // Apenas ADMIN/SUPERVISOR
  "/estoque/movimentacoes/nova": ["ALL"], // Apenas ADMIN/SUPERVISOR
  "/relatorios": ["VIEW_REPORTS"],
  "/historico": ["VIEW_HISTORY"],
  "/notificacoes": ["VIEW_NOTIFICATIONS"],
  "/agendamentos": ["CREATE_SCHEDULE", "VIEW_MACHINES"], // Supervisor ou Admin
  "/agendamentos/nova": ["CREATE_SCHEDULE"],
  "/configuracoes": ["ALL"], // Apenas ADMIN
};

/**
 * Verifica se o usuário tem uma permissão específica
 */
export function hasPermission(userRole, permission) {
  if (!userRole) {
    console.log('❌ hasPermission: sem userRole', { userRole, permission });
    return false;
  }
  
  // Normaliza o role para garantir comparação correta (case-insensitive)
  const normalizedRole = String(userRole).toUpperCase().trim();
  
  const permissions = RolePolicy[normalizedRole] || [];
  
  console.log('🔍 hasPermission:', { 
    userRole, 
    normalizedRole, 
    permission, 
    permissions, 
    hasAll: permissions.includes("ALL"),
    hasPermission: permissions.includes(permission)
  });
  
  // ADMIN tem acesso total
  if (permissions.includes("ALL")) {
    return true;
  }
  
  return permissions.includes(permission);
}

/**
 * Verifica se o usuário pode acessar uma rota
 */
export function canAccessRoute(userRole, route) {
  if (!userRole) return false;
  
  // Normaliza a rota (remove parâmetros dinâmicos)
  const normalizedRoute = route.replace(/\/\[.*?\]/g, "[id]");
  
  const requiredPermissions = RoutePermissions[normalizedRoute] || RoutePermissions[route] || [];
  
  // Se não há permissões definidas, permite acesso
  if (requiredPermissions.length === 0) {
    return true;
  }
  
  // Verifica se tem pelo menos uma das permissões necessárias
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Retorna todas as permissões do usuário
 */
export function getUserPermissions(userRole) {
  if (!userRole) return [];
  return RolePolicy[userRole] || [];
}

/**
 * Verifica se o usuário é ADMIN
 */
export function isAdmin(userRole) {
  if (!userRole) return false;
  return String(userRole).toUpperCase().trim() === "ADMIN";
}

/**
 * Verifica se o usuário é SUPERVISOR ou ADMIN
 */
export function isSupervisorOrAdmin(userRole) {
  if (!userRole) return false;
  const normalizedRole = String(userRole).toUpperCase().trim();
  return normalizedRole === "SUPERVISOR" || normalizedRole === "ADMIN";
}

