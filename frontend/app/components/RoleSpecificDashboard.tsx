'use client';

import { useAuth } from '../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import PlanifierDashboard from './PlanifierDashboard';
import ReviewerDashboard from './ReviewerDashboard';
import ValidatorDashboard from './ValidatorDashboard';
import AuditorDashboard from './AuditorDashboard';
import { getRoleDescription } from '../utils/rolePermissions';

/**
 * Componente que renderiza el dashboard específico según el rol del usuario
 * Implementa la especificación de roles:
 * - 👨‍💼 ADMIN: Administrador del Sistema
 * - 🧑‍💼 PLANIF: Técnico Planificador  
 * - 🧑‍⚖ REVISOR: Revisor Institucional
 * - 🧑‍⚖ VALID: Autoridad Validadora
 * - 🕵 AUDITOR: Auditor del Sistema
 */
export default function RoleSpecificDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del usuario...</p>
        </div>
      </div>
    );
  }

  const primaryRole = user.roles[0]; // Tomar el primer rol como principal
  const roleDescription = getRoleDescription(primaryRole);

  // Renderizar dashboard específico según el rol
  const renderRoleSpecificDashboard = () => {
    switch (primaryRole) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'PLANIF':
        return <PlanifierDashboard />;
      case 'REVISOR':
        return <ReviewerDashboard />;
      case 'VALID':
        return <ValidatorDashboard />;
      case 'AUDITOR':
        return <AuditorDashboard />;
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Rol no reconocido
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>El rol "{primaryRole}" no tiene un dashboard específico configurado.</p>
                  <p>Contacta al administrador del sistema.</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del rol */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenido, {user.nombre}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {roleDescription}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {primaryRole}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard específico del rol */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderRoleSpecificDashboard()}
      </div>
    </div>
  );
}
