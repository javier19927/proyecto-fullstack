/**
 * Componente para verificar permisos específicos
 * 
 * Este componente permite controlar el acceso a diferentes partes de la UI
 * basándose en los roles y permisos específicos del usuario.
 */

'use client';

import { useAuth } from '../hooks/useAuth';
import { hasModuleAccess, getModulePermissions, hasAnyRole, hasAllRoles } from '../utils/rolePermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  
  // Verificación por módulo
  module?: string;
  
  // Verificación por roles
  roles?: string[];
  requireAllRoles?: boolean; // Si es true, requiere todos los roles. Si es false, requiere al menos uno
  
  // Verificación por permisos específicos
  permission?: string;
  permissions?: string[];
  requireAllPermissions?: boolean;
  
  // Función personalizada de verificación
  customCheck?: (user: any) => boolean;
}

export default function PermissionGate({
  children,
  fallback = null,
  module,
  roles,
  requireAllRoles = false,
  permission,
  permissions,
  requireAllPermissions = false,
  customCheck
}: PermissionGateProps) {
  const { user, isAuthenticated } = useAuth();

  // Si no está autenticado, no mostrar nada
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Verificación personalizada
  if (customCheck) {
    const hasAccess = customCheck(user);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Verificación por módulo
  if (module) {
    const hasAccess = hasModuleAccess(user, module);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Verificación por roles
  if (roles && roles.length > 0) {
    const hasAccess = requireAllRoles 
      ? hasAllRoles(user, roles)
      : hasAnyRole(user, roles);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Verificación por permisos específicos
  if (permission) {
    const userPermissions = user.permisos || [];
    const hasAccess = userPermissions.includes(permission);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const userPermissions = user.permisos || [];
    const hasAccess = requireAllPermissions
      ? permissions.every(perm => userPermissions.includes(perm))
      : permissions.some(perm => userPermissions.includes(perm));
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Si no se especifica ninguna verificación, mostrar el contenido
  return <>{children}</>;
}

// Hook personalizado para usar en componentes funcionales
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  return {
    // Verificación básica
    isAuthenticated,
    user,
    
    // Verificación por módulo
    hasModuleAccess: (module: string) => hasModuleAccess(user, module),
    
    // Verificación por roles
    hasRole: (role: string) => hasAnyRole(user, [role]),
    hasAnyRole: (roles: string[]) => hasAnyRole(user, roles),
    hasAllRoles: (roles: string[]) => hasAllRoles(user, roles),
    
    // Verificación por permisos
    hasPermission: (permission: string) => {
      const userPermissions = user?.permisos || [];
      return userPermissions.includes(permission);
    },
    
    hasAnyPermission: (permissions: string[]) => {
      const userPermissions = user?.permisos || [];
      return permissions.some(perm => userPermissions.includes(perm));
    },
    
    hasAllPermissions: (permissions: string[]) => {
      const userPermissions = user?.permisos || [];
      return permissions.every(perm => userPermissions.includes(perm));
    },
    
    // Obtener permisos específicos del módulo
    getModulePermissions: (module: string) => getModulePermissions(user, module),
    
    // Verificaciones específicas por rol para los diferentes módulos
    canEditConfiguration: () => {
      const perms = getModulePermissions(user, 'configuracion');
      return perms.canEdit;
    },
    
    canManageUsers: () => {
      const perms = getModulePermissions(user, 'usuarios');
      return perms.canCreate && perms.canEdit && perms.canDelete;
    },
    
    canEditObjectives: () => {
      const perms = getModulePermissions(user, 'objetivos');
      return perms.canEdit;
    },
    
    canApproveObjectives: () => {
      const perms = getModulePermissions(user, 'objetivos');
      return perms.canApprove;
    },
    
    canEditProjects: () => {
      const perms = getModulePermissions(user, 'proyectos');
      return perms.canEdit;
    },
    
    canApproveProjects: () => {
      const perms = getModulePermissions(user, 'proyectos');
      return perms.canApprove;
    },
    
    canExportReports: () => {
      const perms = getModulePermissions(user, 'reportes');
      return perms.canExportComplete || perms.canExportLimited;
    },
    
    canAuditSystem: () => {
      const perms = getModulePermissions(user, 'auditoria');
      return perms.canAuditSystem;
    }
  };
}

// Componentes específicos para casos comunes
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate roles={['ADMIN']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function PlanifierOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate roles={['PLANIF']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function ReviewerOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate roles={['REVISOR']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function ValidatorOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate roles={['VALID']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function AuditorOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate roles={['AUDITOR']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

// Componente para mostrar botones de acción según el rol
interface ActionButtonsProps {
  module: 'objetivos' | 'proyectos';
  itemId?: string | number;
  status?: string;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onSendToValidation?: () => void;
  onSendToReview?: () => void;
}

export function RoleBasedActionButtons({
  module,
  itemId,
  status,
  onEdit,
  onApprove,
  onReject,
  onSendToValidation,
  onSendToReview
}: ActionButtonsProps) {
  const { getModulePermissions } = usePermissions();
  const perms = getModulePermissions(module);

  return (
    <div className="flex space-x-2">
      {/* Botón Editar - Solo ADMIN y PLANIF */}
      {perms.canEdit && onEdit && (
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          Editar
        </button>
      )}

      {/* Botón Enviar a Validación/Revisión - Solo PLANIF */}
      {module === 'objetivos' && perms.canSendToValidation && onSendToValidation && status === 'BORRADOR' && (
        <button
          onClick={onSendToValidation}
          className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
        >
          Enviar a Validación
        </button>
      )}

      {module === 'proyectos' && perms.canSendToReview && onSendToReview && status === 'BORRADOR' && (
        <button
          onClick={onSendToReview}
          className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
        >
          Enviar a Revisión
        </button>
      )}

      {/* Botones Aprobar/Rechazar - VALID para objetivos, REVISOR para proyectos */}
      {perms.canApprove && status === 'EN_REVISION' && (
        <>
          {onApprove && (
            <button
              onClick={onApprove}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              Aprobar
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Rechazar
            </button>
          )}
        </>
      )}
    </div>
  );
}
