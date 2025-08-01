'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuditorOnly } from '../components/PermissionGate';

interface AuditEvent {
  id: number;
  usuario_nombre: string;
  rol: string;
  accion: string;
  modulo: string;
  detalles: string;
  fecha_accion: string;
  ip_address?: string;
}

interface SystemMetrics {
  total_usuarios_activos: number;
  total_sesiones_hoy: number;
  total_acciones_hoy: number;
  modulos_mas_usados: Array<{ modulo: string; count: number }>;
  usuarios_por_rol: Array<{ rol: string; count: number }>;
  tendencia_uso: Array<{ fecha: string; acciones: number }>;
}

interface ComplianceReport {
  objetivos_sin_alineacion: number;
  proyectos_sin_presupuesto: number;
  usuarios_inactivos: number;
  instituciones_sin_objetivos: number;
  discrepancias_presupuestarias: number;
}

export default function AuditoriaAvanzadaPage() {
  const { user, token } = useAuth();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'eventos' | 'metricas' | 'cumplimiento' | 'trazabilidad'>('eventos');
  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    usuario: '',
    modulo: '',
    rol: ''
  });

  useEffect(() => {
    if (token && user) {
      loadAuditData();
    }
  }, [token, user, filters]);

  const loadAuditData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [eventsRes, metricsRes, complianceRes] = await Promise.all([
        fetch(buildApiUrl('/api/auditoria/eventos?' + new URLSearchParams(filters)), {
          headers: buildHeaders(token)
        }),
        fetch(buildApiUrl('/api/auditoria/metricas-sistema'), {
          headers: buildHeaders(token)
        }),
        fetch(buildApiUrl('/api/auditoria/cumplimiento'), {
          headers: buildHeaders(token)
        })
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setAuditEvents(eventsData.data || []);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setSystemMetrics(metricsData.data);
      }

      if (complianceRes.ok) {
        const complianceData = await complianceRes.json();
        setComplianceReport(complianceData.data);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar datos de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const exportAuditReport = async (type: 'completo' | 'eventos' | 'cumplimiento') => {
    if (!token) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/auditoria/exportar/${type}`),
        { 
          headers: buildHeaders(token),
          method: 'POST',
          body: JSON.stringify(filters)
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `auditoria_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const getAccionColor = (accion: string) => {
    const colors = {
      'LOGIN': 'bg-green-100 text-green-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'CREATE': 'bg-blue-100 text-blue-800',
      'UPDATE': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800',
      'APPROVE': 'bg-emerald-100 text-emerald-800',
      'REJECT': 'bg-red-100 text-red-800'
    };
    return colors[accion as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando herramientas de auditoría...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AuditorOnly>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    🕵️ Herramientas de Auditoría Avanzada
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Supervisar el uso del sistema, revisar actividades institucionales y validar el cumplimiento del plan
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                  <p className="text-sm text-red-600">Auditor del Sistema</p>
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

            {/* Navigation Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'eventos', label: 'Eventos de Auditoría', icon: '📋' },
                    { id: 'metricas', label: 'Métricas del Sistema', icon: '📊' },
                    { id: 'cumplimiento', label: 'Validación de Cumplimiento', icon: '✅' },
                    { id: 'trazabilidad', label: 'Trazabilidad', icon: '🔗' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-red-500 text-red-600'
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
            {activeTab === 'eventos' && (
              <div className="space-y-6">
                {/* Filtros */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros de Auditoría</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Desde</label>
                      <input
                        type="date"
                        value={filters.fecha_desde}
                        onChange={(e) => setFilters({...filters, fecha_desde: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hasta</label>
                      <input
                        type="date"
                        value={filters.fecha_hasta}
                        onChange={(e) => setFilters({...filters, fecha_hasta: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Usuario</label>
                      <input
                        type="text"
                        value={filters.usuario}
                        onChange={(e) => setFilters({...filters, usuario: e.target.value})}
                        placeholder="Filtrar por usuario"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Módulo</label>
                      <select
                        value={filters.modulo}
                        onChange={(e) => setFilters({...filters, modulo: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Todos los módulos</option>
                        <option value="OBJETIVOS">Objetivos</option>
                        <option value="PROYECTOS">Proyectos</option>
                        <option value="USUARIOS">Usuarios</option>
                        <option value="INSTITUCIONES">Instituciones</option>
                        <option value="REPORTES">Reportes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rol</label>
                      <select
                        value={filters.rol}
                        onChange={(e) => setFilters({...filters, rol: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Todos los roles</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="PLANIF">Planificador</option>
                        <option value="REVISOR">Revisor</option>
                        <option value="VALID">Validador</option>
                        <option value="AUDITOR">Auditor</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => exportAuditReport('eventos')}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      📄 Exportar Eventos
                    </button>
                    <button
                      onClick={() => exportAuditReport('completo')}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      📊 Reporte Completo
                    </button>
                  </div>
                </div>

                {/* Eventos de Auditoría */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Eventos de Auditoría Recientes</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Módulo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Detalles
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {auditEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {event.usuario_nombre}
                              </div>
                              {event.ip_address && (
                                <div className="text-xs text-gray-500">
                                  IP: {event.ip_address}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {event.rol}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccionColor(event.accion)}`}>
                                {event.accion}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {event.modulo}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {event.detalles}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(event.fecha_accion).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'metricas' && systemMetrics && (
              <div className="space-y-6">
                {/* Métricas Generales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-full">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {systemMetrics.total_usuarios_activos}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <span className="text-2xl">🔗</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Sesiones Hoy</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {systemMetrics.total_sesiones_hoy}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Acciones Hoy</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {systemMetrics.total_acciones_hoy}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 rounded-full">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Módulos Activos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {systemMetrics.modulos_mas_usados.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distribución por Roles */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Usuarios por Rol</h3>
                    <div className="space-y-3">
                      {systemMetrics.usuarios_por_rol.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{item.rol}</span>
                          <span className="text-sm text-gray-900">{item.count} usuarios</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Módulos Más Usados</h3>
                    <div className="space-y-3">
                      {systemMetrics.modulos_mas_usados.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{item.modulo}</span>
                          <span className="text-sm text-gray-900">{item.count} acciones</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cumplimiento' && complianceReport && (
              <div className="space-y-6">
                {/* Métricas de Cumplimiento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Objetivos sin Alineación</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {complianceReport.objetivos_sin_alineacion}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 rounded-full">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Proyectos sin Presupuesto</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {complianceReport.proyectos_sin_presupuesto}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-orange-100 rounded-full">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Usuarios Inactivos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {complianceReport.usuarios_inactivos}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Reporte de Cumplimiento</h3>
                    <button
                      onClick={() => exportAuditReport('cumplimiento')}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      📄 Exportar Reporte
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Análisis de Objetivos</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Objetivos sin alineación PND/ODS: {complianceReport.objetivos_sin_alineacion}</li>
                        <li>• Instituciones sin objetivos: {complianceReport.instituciones_sin_objetivos}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Análisis Presupuestario</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Proyectos sin presupuesto definido: {complianceReport.proyectos_sin_presupuesto}</li>
                        <li>• Discrepancias presupuestarias: {complianceReport.discrepancias_presupuestarias}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trazabilidad' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🔗 Trazabilidad del Sistema</h3>
                <div className="text-center py-8">
                  <span className="text-6xl">🚧</span>
                  <h4 className="mt-4 text-lg font-medium text-gray-900">Módulo en Desarrollo</h4>
                  <p className="mt-2 text-gray-500">
                    El módulo de trazabilidad completa estará disponible en futuras versiones.
                    Actualmente puedes utilizar los eventos de auditoría para rastrear actividades.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </AuditorOnly>
    </ProtectedRoute>
  );
}
