/**
 * Utilidades para manejo de permisos por rol
 * 
 * Implementa la matriz de roles y permisos específicos según:
 * - 👨‍💼 ADMIN: Administrador del Sistema
 * - 🧑‍💼 PLANIF: Técnico Planificador  
 * - 🧑‍⚖ REVISOR: Revisor Institucional
 * - 🧑‍⚖ VALID: Autoridad Validadora
 * - 🕵 AUDITOR: Auditor del Sistema
 */

interface User {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  permisos?: string[];
}

interface ModulePermissions {
  canView: boolean;
  canEdit?: boolean;
  canApprove?: boolean;
  canExport?: boolean;
  canSendToValidation?: boolean;
  canSendToReview?: boolean;
  canManageUsers?: boolean;
  canManageInstitutions?: boolean;
  canManageRoles?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  canExportComplete?: boolean;
  canExportLimited?: boolean;
  canViewAllReports?: boolean;
  canViewProjectReports?: boolean;
  canViewObjectiveReports?: boolean;
  canViewAuditReports?: boolean;
  canAuditSystem?: boolean;
  canViewSystemUsage?: boolean;
  canValidateCompliance?: boolean;
  canExportAuditReports?: boolean;
}

/**
 * Verifica si un usuario tiene acceso a un módulo específico
 */
export const hasModuleAccess = (user: User | null, module: string): boolean => {
  if (!user) return false;
  
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  
  switch (module) {
    case 'configuracion':
      // ✅ ADMIN: Configuración Institucional completa
      // ✅ PLANIF: Solo consulta limitada
      return userRoles.includes('ADMIN') || userRoles.includes('PLANIF');
      
    case 'objetivos':
      // ✅ ADMIN: Registrar, editar y consultar objetivos estratégicos
      // ✅ PLANIF: Registrar, editar objetivos/metas/indicadores y alinear al PND/ODS
      // ✅ VALID: Solo revisar y aprobar/rechazar objetivos enviados por técnicos
      // ❌ REVISOR: SIN ACCESO a objetivos (solo proyectos)
      // ❌ AUDITOR: Solo lectura para auditoría (no gestión)
      return userRoles.includes('ADMIN') || 
             userRoles.includes('PLANIF') || 
             userRoles.includes('VALID');
             
    case 'proyectos':
      // ✅ ADMIN: Registrar, editar y consultar proyectos de inversión
      // ✅ PLANIF: Crear/editar proyectos, actividades, presupuestos y enviar a revisión
      // ✅ REVISOR: Solo revisar y aprobar/rechazar proyectos enviados por técnicos
      // ❌ VALID: SIN ACCESO a proyectos (solo objetivos)
      // ❌ AUDITOR: Solo lectura para auditoría (no gestión)
      return userRoles.includes('ADMIN') || 
             userRoles.includes('PLANIF') || 
             userRoles.includes('REVISOR');
             
    case 'reportes':
      // ✅ Todos los roles tienen acceso con diferentes niveles
      return userRoles.includes('ADMIN') || 
             userRoles.includes('PLANIF') || 
             userRoles.includes('REVISOR') || 
             userRoles.includes('VALID') ||
             userRoles.includes('AUDITOR');
             
    case 'usuarios':
      // ✅ ADMIN: Crear y administrar usuarios y roles (exclusivo)
      return userRoles.includes('ADMIN');
      
    case 'auditoria':
      // ✅ AUDITOR: Supervisar uso del sistema, auditar actividades por rol (exclusivo)
      return userRoles.includes('AUDITOR');
      
    default:
      return false;
  }
};

/**
 * Obtiene los permisos específicos de un usuario para un módulo
 */
export const getModulePermissions = (user: User | null, module: string): ModulePermissions => {
  if (!user) {
    return { canView: false, canEdit: false, canApprove: false, canExport: false };
  }
  
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  
  switch (module) {
    case 'configuracion':
      return {
        canView: userRoles.includes('ADMIN') || userRoles.includes('PLANIF'),
        canEdit: userRoles.includes('ADMIN'), // Solo ADMIN puede editar
        canManageUsers: userRoles.includes('ADMIN'), // Solo ADMIN puede gestionar usuarios
        canManageInstitutions: userRoles.includes('ADMIN'), // Solo ADMIN puede gestionar instituciones
        canManageRoles: userRoles.includes('ADMIN') // Solo ADMIN puede gestionar roles
      };
      
    case 'objetivos':
      return {
        canView: userRoles.includes('ADMIN') || userRoles.includes('PLANIF') || userRoles.includes('VALID'),
        canEdit: userRoles.includes('ADMIN') || userRoles.includes('PLANIF'), // ADMIN y PLANIF pueden crear/editar
        canApprove: userRoles.includes('VALID'), // Solo VALID puede aprobar/rechazar
        canSendToValidation: userRoles.includes('PLANIF'), // Solo PLANIF puede enviar a validación
        canExport: userRoles.includes('ADMIN') || userRoles.includes('PLANIF') || userRoles.includes('VALID')
      };
      
    case 'proyectos':
      return {
        canView: userRoles.includes('ADMIN') || userRoles.includes('PLANIF') || userRoles.includes('REVISOR'),
        canEdit: userRoles.includes('ADMIN') || userRoles.includes('PLANIF'), // ADMIN y PLANIF pueden crear/editar
        canApprove: userRoles.includes('REVISOR'), // Solo REVISOR puede aprobar/rechazar
        canSendToReview: userRoles.includes('PLANIF'), // Solo PLANIF puede enviar a revisión
        canExport: userRoles.includes('ADMIN') || userRoles.includes('PLANIF') || userRoles.includes('REVISOR')
      };
      
    case 'reportes':
      return {
        canView: true, // Todos los roles autenticados pueden ver reportes
        canExportComplete: userRoles.includes('ADMIN') || userRoles.includes('PLANIF') || userRoles.includes('AUDITOR'),
        canExportLimited: userRoles.includes('REVISOR') || userRoles.includes('VALID'),
        canViewAllReports: userRoles.includes('ADMIN') || userRoles.includes('PLANIF') || userRoles.includes('AUDITOR'),
        canViewProjectReports: userRoles.includes('ADMIN') || userRoles.includes('PLANIF') || userRoles.includes('REVISOR') || userRoles.includes('AUDITOR'),
        canViewObjectiveReports: userRoles.includes('ADMIN') || userRoles.includes('PLANIF') || userRoles.includes('VALID') || userRoles.includes('AUDITOR'),
        canViewAuditReports: userRoles.includes('AUDITOR')
      };
      
    case 'usuarios':
      return {
        canView: userRoles.includes('ADMIN'),
        canEdit: userRoles.includes('ADMIN'),
        canCreate: userRoles.includes('ADMIN'),
        canDelete: userRoles.includes('ADMIN'),
        canManageRoles: userRoles.includes('ADMIN')
      };
      
    case 'auditoria':
      return {
        canView: userRoles.includes('AUDITOR'),
        canAuditSystem: userRoles.includes('AUDITOR'),
        canViewSystemUsage: userRoles.includes('AUDITOR'),
        canValidateCompliance: userRoles.includes('AUDITOR'),
        canExportAuditReports: userRoles.includes('AUDITOR')
      };
      
    default:
      return { canView: false, canEdit: false, canApprove: false, canExport: false };
  }
};

/**
 * Obtiene la descripción del rol para mostrar en la UI
 */
export const getRoleDescription = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return '👨‍💼 Administrador del Sistema';
    case 'PLANIF':
      return '🧑‍💼 Técnico Planificador';
    case 'REVISOR':
      return '🧑‍⚖ Revisor Institucional';
    case 'VALID':
      return '🧑‍⚖ Autoridad Validadora';
    case 'AUDITOR':
      return '🕵 Auditor';
    default:
      return '👤 Usuario del Sistema';
  }
};

/**
 * Obtiene la descripción corta del rol para badges/pills
 */
export const getRoleShortDescription = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return '👨‍💼 Admin';
    case 'PLANIF':
      return '🧑‍💼 Técnico';
    case 'REVISOR':
      return '🧑‍⚖ Revisor';
    case 'VALID':
      return '🧑‍⚖ Validador';
    case 'AUDITOR':
      return '🕵 Auditor';
    default:
      return role;
  }
};

/**
 * Obtiene los colores CSS para el rol
 */
export const getRoleColors = (role: string): { bg: string; text: string; border: string } => {
  switch (role) {
    case 'ADMIN':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-200'
      };
    case 'PLANIF':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200'
      };
    case 'REVISOR':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200'
      };
    case 'VALID':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200'
      };
    case 'AUDITOR':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200'
      };
  }
};

/**
 * Verifica si un usuario tiene al menos uno de los roles especificados
 */
export const hasAnyRole = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  return roles.some(role => userRoles.includes(role));
};

/**
 * Verifica si un usuario tiene todos los roles especificados
 */
export const hasAllRoles = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  return roles.every(role => userRoles.includes(role));
};

/**
 * Obtiene los módulos disponibles para un usuario
 */
export const getAvailableModules = (user: User | null): string[] => {
  if (!user) return [];
  
  const modules = ['configuracion', 'objetivos', 'proyectos', 'reportes', 'usuarios', 'auditoria'];
  return modules.filter(module => hasModuleAccess(user, module));
};
