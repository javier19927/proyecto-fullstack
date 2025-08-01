'use client';

import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getModulePermissions, hasModuleAccess } from '../utils/rolePermissions';

interface RoleBasedPermissionsProps {
  module: string;
  permission?: keyof ReturnType<typeof getModulePermissions>;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente para mostrar contenido basado en permisos específicos de rol
 * 
 * Uso:
 * <RoleBasedPermissions module="objetivos" permission="canEdit">
 *   <button>Editar Objetivo</button>
 * </RoleBasedPermissions>
 * 
 * <RoleBasedPermissions module="proyectos" permission="canApprove" fallback={<p>Sin permisos</p>}>
 *   <button>Aprobar Proyecto</button>
 * </RoleBasedPermissions>
 */
export default function RoleBasedPermissions({
  module,
  permission,
  children,
  fallback = null
}: RoleBasedPermissionsProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Si no se especifica un permiso específico, verificar solo acceso al módulo
  if (!permission) {
    const hasAccess = hasModuleAccess(user, module);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Verificar permiso específico
  const permissions = getModulePermissions(user, module);
  const hasPermission = permissions[permission];

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook para verificar permisos desde cualquier componente
 */
export const useRolePermissions = (module: string) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return {
      hasAccess: false,
      permissions: { canView: false, canEdit: false, canApprove: false, canExport: false }
    };
  }

  return {
    hasAccess: hasModuleAccess(user, module),
    permissions: getModulePermissions(user, module)
  };
};

/**
 * Componente para mostrar botones de acción basados en permisos
 */
interface ActionButtonProps {
  module: string;
  action: 'edit' | 'approve' | 'sendToValidation' | 'sendToReview' | 'export' | 'delete';
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function RoleBasedActionButton({
  module,
  action,
  onClick,
  children,
  disabled = false,
  className = ''
}: ActionButtonProps) {
  const { permissions } = useRolePermissions(module);
  
  const permissionMap = {
    edit: permissions.canEdit,
    approve: permissions.canApprove,
    sendToValidation: permissions.canSendToValidation,
    sendToReview: permissions.canSendToReview,
    export: permissions.canExport || permissions.canExportComplete || permissions.canExportLimited,
    delete: permissions.canDelete
  };

  const hasPermission = permissionMap[action];

  if (!hasPermission) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

/**
 * Componente para mostrar información de rol del usuario actual
 */
export function CurrentUserRoleInfo() {
  const { user } = useAuth();
  
  if (!user) return null;

  const modules = ['configuracion', 'objetivos', 'proyectos', 'reportes', 'usuarios', 'auditoria'];
  const accessibleModules = modules.filter(module => hasModuleAccess(user, module));

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-blue-900 mb-2">Información de Acceso</h3>
      <div className="text-xs text-blue-700">
        <p className="mb-1"><strong>Rol(es):</strong> {user.roles.join(', ')}</p>
        <p><strong>Módulos disponibles:</strong></p>
        <ul className="list-disc list-inside ml-2 mt-1">
          {accessibleModules.map(module => (
            <li key={module} className="capitalize">{module}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
