'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface OrganizationalStructure {
  id: number;
  institucion_id: number;
  institucion_nombre: string;
  nivel_jerarquico: number;
  institucion_padre?: number;
  nombre_padre?: string;
  usuarios_asignados: number;
  objetivos_activos: number;
  proyectos_activos: number;
  presupuesto_total: number;
  presupuesto_ejecutado: number;
  estado: 'ACTIVA' | 'INACTIVA';
  sub_instituciones: OrganizationalStructure[];
}

interface UserRoleDistribution {
  rol_codigo: string;
  rol_nombre: string;
  cantidad_usuarios: number;
  instituciones_asignadas: string[];
}

interface SystemHealthMetrics {
  usuarios_totales: number;
  usuarios_activos: number;
  instituciones_activas: number;
  objetivos_en_progreso: number;
  proyectos_en_progreso: number;
  alertas_sistema: Array<{
    tipo: 'WARNING' | 'ERROR' | 'INFO';
    mensaje: string;
    modulo: string;
    fecha: string;
  }>;
}

interface AdminSystemSupervisionProps {
  className?: string;
}

/**
 * Panel de supervisión de estructura organizativa general
 * Específico para el rol de ADMINISTRADOR DEL SISTEMA
 * 
 * Funcionalidades implementadas según especificaciones:
 * - Configurar el sistema institucionalmente
 * - Gestionar usuarios y roles
 * - Supervisar la planificación general  
 * - Acceder a todos los reportes y exportaciones
 * - Supervisar estructura organizativa general del sistema
 * 
 * Módulos que usa:
 * - Módulo 1: Configuración Institucional
 * - Módulo 2: Objetivos Estratégicos  
 * - Módulo 3: Proyectos de Inversión
 * - Módulo 4: Reportes (acceso completo)
 */
export default function AdminSystemSupervision({ className = "" }: AdminSystemSupervisionProps) {
  const { user, token } = useAuth();
  const [organizationalData, setOrganizationalData] = useState<OrganizationalStructure[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<UserRoleDistribution[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics>({
    usuarios_totales: 0,
    usuarios_activos: 0,
    instituciones_activas: 0,
    objetivos_en_progreso: 0,
    proyectos_en_progreso: 0,
    alertas_sistema: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'structure' | 'users' | 'health'>('structure');

  useEffect(() => {
    if (user?.roles?.includes('ADMIN') && token) {
      loadSystemData();
    }
  }, [user, token, selectedView]);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      switch (selectedView) {
        case 'structure':
          await loadOrganizationalStructure();
          break;
        case 'users':
          await loadUserDistribution();
          break;
        case 'health':
          await loadSystemHealth();
          break;
      }
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationalStructure = async () => {
    if (!token) return;

    const response = await fetch(buildApiUrl('/api/admin/estructura-organizativa'), {
      headers: buildHeaders(token)
    });

    if (response.ok) {
      const data = await response.json();
      setOrganizationalData(data.data || []);
    }
  };

  const loadUserDistribution = async () => {
    if (!token) return;

    const response = await fetch(buildApiUrl('/api/admin/distribucion-roles'), {
      headers: buildHeaders(token)
    });

    if (response.ok) {
      const data = await response.json();
      setRoleDistribution(data.data || []);
    }
  };

  const loadSystemHealth = async () => {
    if (!token) return;

    const response = await fetch(buildApiUrl('/api/admin/salud-sistema'), {
      headers: buildHeaders(token)
    });

    if (response.ok) {
      const data = await response.json();
      setSystemHealth(data.data || systemHealth);
    }
  };

  const exportSystemReport = async (type: 'structure' | 'users' | 'complete') => {
    if (!token) return;

    try {
      const response = await fetch(buildApiUrl(`/api/admin/exportar-reporte/${type}`), {
        method: 'POST',
        headers: buildHeaders(token)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-sistema-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting system report:', error);
    }
  };

  const renderOrganizationalTree = (institutions: OrganizationalStructure[], level = 0) => {
    return institutions.map((inst) => (
      <div key={inst.id} className={`ml-${level * 4}`}>
        <div className="bg-white border rounded-lg p-4 mb-2 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {level === 0 ? '🏛️' : level === 1 ? '🏢' : '📋'}
                </span>
                <h3 className="font-semibold text-gray-900">{inst.institucion_nombre}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  inst.estado === 'ACTIVA' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {inst.estado}
                </span>
              </div>
              
              <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Usuarios:</span>
                  <span className="ml-2 font-medium">{inst.usuarios_asignados}</span>
                </div>
                <div>
                  <span className="text-gray-500">Objetivos:</span>
                  <span className="ml-2 font-medium">{inst.objetivos_activos}</span>
                </div>
                <div>
                  <span className="text-gray-500">Proyectos:</span>
                  <span className="ml-2 font-medium">{inst.proyectos_activos}</span>
                </div>
                <div>
                  <span className="text-gray-500">Presupuesto:</span>
                  <span className="ml-2 font-medium">
                    ${inst.presupuesto_total.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ejecutado:</span>
                  <span className="ml-2 font-medium">
                    {inst.presupuesto_total > 0 
                      ? Math.round((inst.presupuesto_ejecutado / inst.presupuesto_total) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {inst.sub_instituciones && inst.sub_instituciones.length > 0 && (
          <div className="ml-6">
            {renderOrganizationalTree(inst.sub_instituciones, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'INFO':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'ERROR':
        return '🚨';
      case 'WARNING':
        return '⚠️';
      case 'INFO':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              👨‍💼
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-blue-900">
                Supervisión de Estructura Organizativa
              </h1>
              <p className="text-blue-700 mt-1">
                Administración y supervisión general del sistema institucional
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => exportSystemReport('complete')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              📊 Reporte Ejecutivo
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              👥
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Usuarios del Sistema</p>
              <p className="text-2xl font-semibold text-blue-600">
                {systemHealth.usuarios_totales}
              </p>
              <p className="text-xs text-green-600">
                {systemHealth.usuarios_activos} activos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              🏛️
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Instituciones</p>
              <p className="text-2xl font-semibold text-green-600">
                {systemHealth.instituciones_activas}
              </p>
              <p className="text-xs text-green-600">activas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              🎯
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Objetivos</p>
              <p className="text-2xl font-semibold text-purple-600">
                {systemHealth.objetivos_en_progreso}
              </p>
              <p className="text-xs text-purple-600">en progreso</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              🏗️
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Proyectos</p>
              <p className="text-2xl font-semibold text-orange-600">
                {systemHealth.proyectos_en_progreso}
              </p>
              <p className="text-xs text-orange-600">en progreso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'structure', label: 'Estructura Organizativa', icon: '🏛️' },
              { id: 'users', label: 'Distribución de Usuarios', icon: '👥' },
              { id: 'health', label: 'Salud del Sistema', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Cargando datos del sistema...</span>
            </div>
          ) : (
            <>
              {/* Organizational Structure Tab */}
              {selectedView === 'structure' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Jerarquía Institucional
                    </h3>
                    <button
                      onClick={() => exportSystemReport('structure')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      📄 Exportar Estructura
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {organizationalData.length > 0 ? (
                      renderOrganizationalTree(organizationalData)
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">🏛️</div>
                        <p>No hay estructura organizativa configurada</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Distribution Tab */}
              {selectedView === 'users' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Distribución de Usuarios por Rol
                    </h3>
                    <button
                      onClick={() => exportSystemReport('users')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      📄 Exportar Usuarios
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roleDistribution.map((role) => (
                      <div key={role.rol_codigo} className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{role.rol_nombre}</h4>
                          <span className="text-2xl font-bold text-blue-600">
                            {role.cantidad_usuarios}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">Instituciones asignadas:</p>
                          <div className="space-y-1">
                            {role.instituciones_asignadas.slice(0, 3).map((inst, idx) => (
                              <div key={idx} className="text-xs bg-gray-50 px-2 py-1 rounded">
                                {inst}
                              </div>
                            ))}
                            {role.instituciones_asignadas.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{role.instituciones_asignadas.length - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Health Tab */}
              {selectedView === 'health' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Estado General del Sistema
                  </h3>

                  {/* System Alerts */}
                  {systemHealth.alertas_sistema.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Alertas del Sistema</h4>
                      {systemHealth.alertas_sistema.map((alerta, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${getAlertColor(alerta.tipo)}`}>
                          <div className="flex items-start">
                            <span className="text-2xl mr-3">{getAlertIcon(alerta.tipo)}</span>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{alerta.mensaje}</p>
                                  <p className="text-sm opacity-75">Módulo: {alerta.modulo}</p>
                                </div>
                                <span className="text-xs opacity-75">
                                  {new Date(alerta.fecha).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Health Metrics Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Resumen de Métricas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Actividad de Usuarios</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total registrados:</span>
                            <span className="text-sm font-medium">{systemHealth.usuarios_totales}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Activos:</span>
                            <span className="text-sm font-medium text-green-600">
                              {systemHealth.usuarios_activos}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tasa de actividad:</span>
                            <span className="text-sm font-medium">
                              {systemHealth.usuarios_totales > 0 
                                ? Math.round((systemHealth.usuarios_activos / systemHealth.usuarios_totales) * 100)
                                : 0
                              }%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Contenido del Sistema</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Instituciones activas:</span>
                            <span className="text-sm font-medium">{systemHealth.instituciones_activas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Objetivos en progreso:</span>
                            <span className="text-sm font-medium">{systemHealth.objetivos_en_progreso}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Proyectos en progreso:</span>
                            <span className="text-sm font-medium">{systemHealth.proyectos_en_progreso}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
