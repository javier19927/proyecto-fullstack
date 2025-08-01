'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import ProtectedRoute from '../components/ProtectedRoute';
import { AdminOnly } from '../components/PermissionGate';

interface SystemOverview {
  total_instituciones: number;
  total_usuarios: number;
  total_objetivos: number;
  total_proyectos: number;
  usuarios_por_rol: Array<{ rol: string; count: number; porcentaje: number }>;
  instituciones_con_objetivos: number;
  instituciones_con_proyectos: number;
  estructura_organizativa: {
    instituciones_activas: number;
    objetivos_por_institucion: number;
    proyectos_por_institucion: number;
    cobertura_planificacion: number;
  };
  salud_sistema: {
    status: 'healthy' | 'warning' | 'critical';
    usuarios_activos_hoy: number;
    acciones_realizadas_hoy: number;
    tiempo_respuesta_promedio: number;
  };
}

export default function SupervisionSistemaPage() {
  const { user, token } = useAuth();
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'usuarios' | 'instituciones' | 'salud'>('general');

  useEffect(() => {
    if (token && user) {
      loadSystemOverview();
    }
  }, [token, user]);

  const loadSystemOverview = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        buildApiUrl('/api/admin/sistema-overview'),
        { headers: buildHeaders(token) }
      );

      if (response.ok) {
        const data = await response.json();
        setOverview(data.data);
      } else {
        setError('Error al cargar información del sistema');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const exportSystemReport = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        buildApiUrl('/api/admin/export-system-report'),
        { 
          headers: buildHeaders(token),
          method: 'POST'
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `reporte_sistema_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Error al exportar reporte');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al exportar reporte');
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🚨';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando supervisión del sistema...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminOnly>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    👁️ Supervisión del Sistema
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Supervisar estructura organizativa general del sistema
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={exportSystemReport}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    📊 Exportar Reporte Ejecutivo
                  </button>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                    <p className="text-sm text-blue-600">Administrador del Sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="text-red-400">⚠️</div>
                  <div className="ml-3">
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {overview && (
              <>
                {/* Métricas Generales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <span className="text-2xl">🏛️</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Instituciones</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {overview.total_instituciones}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-full">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Usuarios</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {overview.total_usuarios}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Objetivos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {overview.total_objetivos}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-indigo-100 rounded-full">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Proyectos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {overview.total_proyectos}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      {[
                        { id: 'general', label: 'Vista General', icon: '📊' },
                        { id: 'usuarios', label: 'Gestión de Usuarios', icon: '👥' },
                        { id: 'instituciones', label: 'Estructura Institucional', icon: '🏛️' },
                        { id: 'salud', label: 'Salud del Sistema', icon: '💊' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'general' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Distribución por Roles */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Distribución de Usuarios por Rol
                      </h3>
                      <div className="space-y-4">
                        {overview.usuarios_por_rol.map((rol, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">{rol.rol}</span>
                              <span className="text-sm text-gray-500">
                                {rol.count} usuarios ({rol.porcentaje.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${rol.porcentaje}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cobertura de Planificación */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Cobertura de Planificación
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-green-500 text-xl mr-3">🎯</span>
                            <span className="text-sm font-medium text-gray-700">
                              Instituciones con Objetivos
                            </span>
                          </div>
                          <span className="text-green-700 font-bold">
                            {overview.instituciones_con_objetivos}/{overview.total_instituciones}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-blue-500 text-xl mr-3">📋</span>
                            <span className="text-sm font-medium text-gray-700">
                              Instituciones con Proyectos
                            </span>
                          </div>
                          <span className="text-blue-700 font-bold">
                            {overview.instituciones_con_proyectos}/{overview.total_instituciones}
                          </span>
                        </div>

                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Cobertura General de Planificación</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                              {overview.estructura_organizativa.cobertura_planificacion.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'usuarios' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">
                        Gestión Avanzada de Usuarios
                      </h3>
                      <div className="flex space-x-3">
                        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                          👤 Crear Usuario
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                          🔄 Gestionar Roles
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {overview.usuarios_por_rol.map((rol, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="text-center">
                            <h4 className="font-medium text-gray-900">{rol.rol}</h4>
                            <p className="text-2xl font-bold text-blue-600 mt-2">{rol.count}</p>
                            <p className="text-sm text-gray-500">usuarios activos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex">
                        <div className="text-yellow-400">💡</div>
                        <div className="ml-3">
                          <p className="text-yellow-800 text-sm">
                            <strong>Recomendación:</strong> Mantén un equilibrio en la distribución de roles. 
                            Considera asignar más técnicos planificadores si hay muchas instituciones sin objetivos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'instituciones' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">
                      Estructura Organizativa General
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Instituciones Activas</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {overview.estructura_organizativa.instituciones_activas}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Objetivos por Institución</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {overview.estructura_organizativa.objetivos_por_institucion.toFixed(1)}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Proyectos por Institución</p>
                        <p className="text-2xl font-bold text-green-600">
                          {overview.estructura_organizativa.proyectos_por_institucion.toFixed(1)}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-gray-600">Cobertura de Planificación</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {overview.estructura_organizativa.cobertura_planificacion.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-medium text-gray-900 mb-4">Acciones de Supervisión</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <span className="text-2xl mr-3">🏛️</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Gestionar Instituciones</p>
                            <p className="text-sm text-gray-500">Crear, editar y organizar instituciones</p>
                          </div>
                        </button>
                        
                        <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                          <span className="text-2xl mr-3">📊</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Reportes Institucionales</p>
                            <p className="text-sm text-gray-500">Ver rendimiento por institución</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'salud' && (
                  <div className="space-y-6">
                    {/* Estado General del Sistema */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Estado del Sistema</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(overview.salud_sistema.status)}`}>
                          {getHealthStatusIcon(overview.salud_sistema.status)} {overview.salud_sistema.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Usuarios Activos Hoy</p>
                          <p className="text-2xl font-bold text-green-600">
                            {overview.salud_sistema.usuarios_activos_hoy}
                          </p>
                        </div>
                        
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Acciones Realizadas</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {overview.salud_sistema.acciones_realizadas_hoy}
                          </p>
                        </div>
                        
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">Tiempo de Respuesta</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {overview.salud_sistema.tiempo_respuesta_promedio}ms
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Acciones de Mantenimiento */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Herramientas de Mantenimiento
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <div className="text-center">
                            <span className="text-3xl block mb-2">🔧</span>
                            <p className="font-medium text-gray-900">Configuración</p>
                            <p className="text-xs text-gray-500">Ajustes del sistema</p>
                          </div>
                        </button>
                        
                        <button className="p-4 border border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors">
                          <div className="text-center">
                            <span className="text-3xl block mb-2">🔄</span>
                            <p className="font-medium text-gray-900">Backup</p>
                            <p className="text-xs text-gray-500">Respaldo de datos</p>
                          </div>
                        </button>
                        
                        <button className="p-4 border border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors">
                          <div className="text-center">
                            <span className="text-3xl block mb-2">🗑️</span>
                            <p className="font-medium text-gray-900">Limpieza</p>
                            <p className="text-xs text-gray-500">Datos obsoletos</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </AdminOnly>
    </ProtectedRoute>
  );
}
