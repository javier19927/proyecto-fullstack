'use client';

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleAccessGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  requiredModule?: string;
  blockRestrictedAccess?: boolean;
}

export default function RoleAccessGuard({ 
  children, 
  allowedRoles, 
  requiredModule, 
  blockRestrictedAccess = false 
}: RoleAccessGuardProps) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.roles)) {
      router.push('/login');
      return;
    }

    if (!loading && user && user.roles) {
      const hasAllowedRole = user.roles.some((role: string) => allowedRoles.includes(role));
      
      if (!hasAllowedRole && blockRestrictedAccess) {
        router.push('/dashboard');
        return;
      }

      // Check module permissions if specified
      if (requiredModule && permissions) {
        let hasModuleAccess = false;
        
        // Map module names to permission keys
        const moduleMap: { [key: string]: string } = {
          'objetivos': 'gestionObjetivos',
          'proyectos': 'proyectosInversion',
          'configuracion': 'configuracionInstitucional',
          'reportes': 'reportes',
          'auditoria': 'auditoria'
        };
        
        const permissionKey = moduleMap[requiredModule] || requiredModule;
        
        if (permissions[permissionKey as keyof typeof permissions]) {
          const modulePermissions = permissions[permissionKey as keyof typeof permissions];
          hasModuleAccess = modulePermissions.canConsult() || 
                           modulePermissions.canRegisterEdit() || 
                           modulePermissions.canValidate();
        }
        
        if (!hasModuleAccess && blockRestrictedAccess) {
          router.push('/dashboard');
          return;
        }
      }
    }
  }, [user, loading, permissions, router, allowedRoles, requiredModule, blockRestrictedAccess]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !user.roles) {
    return null;
  }

  const hasAllowedRole = user.roles.some((role: string) => allowedRoles.includes(role));
  
  if (!hasAllowedRole) {
    if (blockRestrictedAccess) {
      return null;
    }
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta sección.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check module permissions if specified
  if (requiredModule && permissions) {
    let hasModuleAccess = false;
    
    // Map module names to permission keys
    const moduleMap: { [key: string]: string } = {
      'objetivos': 'gestionObjetivos',
      'proyectos': 'proyectosInversion',
      'configuracion': 'configuracionInstitucional',
      'reportes': 'reportes',
      'auditoria': 'auditoria'
    };
    
    const permissionKey = moduleMap[requiredModule] || requiredModule;
    
    if (permissions[permissionKey as keyof typeof permissions]) {
      const modulePermissions = permissions[permissionKey as keyof typeof permissions];
      hasModuleAccess = modulePermissions.canConsult() || 
                       modulePermissions.canRegisterEdit() || 
                       modulePermissions.canValidate();
    }
    
    if (!hasModuleAccess) {
      if (blockRestrictedAccess) {
        return null;
      }
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sin Permisos de Módulo</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder al módulo {requiredModule}.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
