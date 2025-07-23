'use client';

import { useAuth } from '../hooks/useAuth';

interface PermissionIndicatorProps {
  module: 'configuracionInstitucional' | 'gestionObjetivos' | 'proyectosInversion';
  className?: string;
}

export default function PermissionIndicator({ module, className = '' }: PermissionIndicatorProps) {
  const { user, permissions } = useAuth();

  if (!user) return null;

  const canRegisterEdit = permissions[module].canRegisterEdit();
  const canValidate = permissions[module].canValidate();
  const canConsult = permissions[module].canConsult();

  const getPermissionText = () => {
    if (canRegisterEdit) return '✅ Registrar/Editar';
    if (canValidate) return '🔍 Validar';
    if (canConsult) return ' Solo Consulta';
    return '🚫 Sin Acceso';
  };

  const getPermissionColor = () => {
    if (canRegisterEdit) return 'bg-green-100 text-green-800';
    if (canValidate) return 'bg-blue-100 text-blue-800';
    if (canConsult) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRoleText = () => {
    if (user.roles?.includes('ADMIN')) return ' Administrador';
    if (user.roles?.includes('PLANIF')) return ' Planificador';
    if (user.roles?.includes('VALID')) return ' Validador';
    if (user.roles?.includes('REVISOR')) return ' Revisor';
    if (user.roles?.includes('CONSUL')) return 'Consultor';
    return '👤 Usuario';
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-sm text-gray-600">{getRoleText()}</span>
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor()}`}>
        {getPermissionText()}
      </span>
    </div>
  );
}
