'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import DashboardStats from '../components/DashboardStats';
import RoleDashboard from '../components/RoleDashboard';
import RoleWorkflowManager from '../components/RoleWorkflowManager';
import ValidatorWorkflow from '../components/ValidatorWorkflow';
import ReviewerWorkflow from '../components/ReviewerWorkflow';
import AuditorComplianceTools from '../components/AuditorComplianceTools';
import NotificationSystem from '../components/NotificationSystem';
import RoleSpecificNavigation from '../components/RoleSpecificNavigation';
import AdminSystemSupervision from '../components/AdminSystemSupervision';
import PlannerTrackingPanel from '../components/PlannerTrackingPanel';
import DecisionHistoryPanel from '../components/DecisionHistoryPanel';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';interface DashboardData {
  tipo_dashboard: string;
  titulo: string;
  descripcion: string;
  estadisticas_generales?: any;
  estadisticas_admin?: any;
  estadisticas_planificador?: any;
  estadisticas_validador?: any;
  estadisticas_revisor?: any;
  estadisticas_auditor?: any;
  accesos: Array<{
    modulo: string;
    descripcion: string;
    permisos: string[];
  }>;
  menu_disponible: string[];
  restricciones?: string[];
  alertas?: any;
}

export default function DashboardPage() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    cargarDashboard();
  }, [user, authLoading, token]);

  const cargarDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/api/dashboard/stats'), {
        headers: buildHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else {
        console.error('Error en respuesta del dashboard:', response.status, response.statusText);
        setError('Error al cargar el dashboard');
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={cargarDashboard}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user || !dashboardData) {
    return null;
  }

  const userRole = user.roles[0] || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Dashboard */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {dashboardData.titulo}
              </h1>
              <p className="text-gray-600 mt-1">
                {dashboardData.descripcion}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationSystem />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                <p className="text-sm text-gray-500">{userRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Generales */}
        <div className="mb-8">
          <RoleDashboard 
            role={userRole} 
          />
        </div>        {/* Alertas del Sistema */}
        {dashboardData.alertas && (
          <div className="mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">⚠️</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Notificaciones Pendientes
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {dashboardData.alertas.mensaje || 'Tienes elementos pendientes de atención'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Específico por Rol */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel Principal */}
          <div className="lg:col-span-2">
            <RoleWorkflowManager className="mb-6" />
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Accesos Rápidos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Accesos Rápidos
              </h3>
              <div className="space-y-3">
                {dashboardData.accesos.map((acceso, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 text-sm">📋</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {acceso.modulo}
                      </p>
                      <p className="text-xs text-gray-600">
                        {acceso.descripcion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restricciones del Rol */}
            {dashboardData.restricciones && dashboardData.restricciones.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Restricciones de Acceso
                </h3>
                <div className="space-y-2">
                  {dashboardData.restricciones.map((restriccion, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-red-500 text-sm mr-2">❌</span>
                      <p className="text-sm text-gray-600">{restriccion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actividad Reciente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>No hay actividad reciente para mostrar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
