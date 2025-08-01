'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import MetasIndicadoresManager from '../components/MetasIndicadoresManager';

/**
 * Página de gestión de metas e indicadores
 * Accesible para ADMIN y PLANIF con funcionalidades completas
 * Accesible para VALID con modo consulta para validación
 */
export default function MetasIndicadoresPage() {
  const { user } = useAuth();

  const tieneAcceso = user?.roles?.some(role => ['ADMIN', 'PLANIF', 'VALID'].includes(role));

  if (!tieneAcceso) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
            <p className="text-gray-600">
              Solo administradores, planificadores y validadores pueden acceder a la gestión de metas e indicadores.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Gestión de Metas e Indicadores
          </h1>
          <p className="text-gray-600">
            {user?.roles?.includes('VALID') 
              ? 'Consulta detallada de metas e indicadores para validación de objetivos estratégicos'
              : 'Registro y seguimiento de metas e indicadores asociados a objetivos estratégicos'
            }
          </p>
        </div>

        {/* Información específica por rol */}
        <div className="mb-6">
          {user?.roles?.includes('ADMIN') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    👨‍💼
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Administrador del Sistema</h4>
                  <p className="text-sm text-blue-700">
                    Acceso completo a gestión de metas e indicadores, supervisión y configuración avanzada
                  </p>
                </div>
              </div>
            </div>
          )}

          {user?.roles?.includes('PLANIF') && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    🧑‍💼
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-900">Técnico Planificador</h4>
                  <p className="text-sm text-green-700">
                    Registro y edición completa de metas e indicadores para objetivos estratégicos
                  </p>
                </div>
              </div>
            </div>
          )}

          {user?.roles?.includes('VALID') && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    🧑‍⚖
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-orange-900">Autoridad Validadora</h4>
                  <p className="text-sm text-orange-700">
                    Visualización detallada de metas e indicadores para validación de objetivos estratégicos
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <MetasIndicadoresManager />
      </div>
    </ProtectedRoute>
  );
}
