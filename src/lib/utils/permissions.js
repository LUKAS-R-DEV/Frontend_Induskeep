// Sistema de Permissões baseado em Roles
// Alinhado com o backend RolePolicy

export const RolePolicy = {
  TECHNICIAN: [
    "VIEW_MACHINES",
    "VIEW_ORDERS",
    "VIEW_PIECES",
    "CREATE_HISTORY",
    "VIEW_NOTIFICATIONS",
    "VIEW_HISTORY", // Técnicos podem ver apenas suas próprias ordens concluídas
    "UPDATE_ORDER",
    "CREATE_STOCK_EXIT",
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
    "CREATE_MACHINE",
    "UPDATE_MACHINE",
    "DELETE_MACHINE",
    "CREATE_PIECE",
    "UPDATE_PIECE",
    "DELETE_PIECE",
    "CREATE_STOCK_MOVEMENT",
    "UPDATE_STOCK_MOVEMENT",
    "DELETE_STOCK_MOVEMENT",
    "MANAGE_SETTINGS",
    "DELETE_ORDER",
    // Não inclui permissões de usuários e logs (mantém apenas ADMIN)
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
  "/equipamentos/cadastro": ["CREATE_MACHINE", "ALL"], // Supervisor e Admin
  "/equipamentos/[id]/editar": ["UPDATE_MACHINE", "ALL"], // Supervisor e Admin
  "/estoque": ["VIEW_PIECES"],
  "/estoque/cadastro": ["CREATE_PIECE", "ALL"], // Supervisor e Admin
  "/estoque/movimentacoes": ["CREATE_STOCK_EXIT", "ALL"], // Técnicos, Supervisores e Admin
  "/estoque/movimentacoes/nova": ["CREATE_STOCK_EXIT", "ALL"], // Técnicos, Supervisores e Admin
  "/relatorios": ["VIEW_REPORTS"],
  "/historico": ["VIEW_HISTORY"], // Supervisor, admin e técnicos (técnicos veem apenas suas ordens)
  "/notificacoes": ["VIEW_NOTIFICATIONS"],
  "/agendamentos": ["CREATE_SCHEDULE", "VIEW_MACHINES"], // Supervisor ou Admin
  "/agendamentos/nova": ["CREATE_SCHEDULE"],
  "/configuracoes": ["MANAGE_SETTINGS", "ALL"], // Supervisor e Admin
};

/**
 * Verifica se o usuário tem uma permissão específica
 */
export function hasPermission(userRole, permission) {
  if (!userRole) {
    return false;
  }
  
  // Normaliza o role para garantir comparação correta (case-insensitive)
  const normalizedRole = String(userRole).toUpperCase().trim();
  
  const permissions = RolePolicy[normalizedRole] || [];
  
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

/**
 * Verifica se o usuário é TECHNICIAN
 */
export function isTechnician(userRole) {
  if (!userRole) return false;
  const normalizedRole = String(userRole).toUpperCase().trim();
  return normalizedRole === "TECHNICIAN";
}

