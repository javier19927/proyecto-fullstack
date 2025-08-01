'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface ReviewerStats {
  proyectos_pendientes_revision: number;
  proyectos_aprobados: number;
  proyectos_rechazados: number;
  presupuesto_total_pendiente: number;
  presupuesto_total_aprobado: number;
  tiempo_promedio_revision: number;
}

/**
 * Dashboard específico para el Revisor Institucional
 * 
 * Funciones principales:
 * - Evaluar y decidir sobre la validez de los proyectos de inversión
 * - Revisar proyectos enviados por técnicos
 * - Aprobar o rechazar proyectos
 * - Consultar y filtrar reportes de proyectos
 * - Exportar reportes de forma limitada
 * 
 * Módulos que usa:
 * - Módulo 3: Proyectos de Inversión
 * - Módulo 4: Reportes
 */
export default function ReviewerDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<ReviewerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.roles?.includes('REVISOR')) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const response = await fetch(
        buildApiUrl('/api/dashboard/stats'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.estadisticas_revisor || {
          proyectos_pendientes_revision: 0,
          proyectos_aprobados: 0,
          proyectos_rechazados: 0,
          presupuesto_total_pendiente: 0,
          presupuesto_total_aprobado: 0,
          tiempo_promedio_revision: 0,
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(monto);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas principales del Revisor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendientes Revisión
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(stats?.proyectos_pendientes_revision || 0) === 0 ? (
                      <span className="text-sm text-green-700 font-medium">No hay proyectos pendientes de revisión</span>
                    ) : (
                      stats?.proyectos_pendientes_revision || 0
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Proyectos Aprobados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.proyectos_aprobados || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Proyectos Rechazados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.proyectos_rechazados || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Presupuesto Pendiente
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatearMonto(stats?.presupuesto_total_pendiente || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones principales del Revisor Institucional */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            🧑‍⚖ Revisión Institucional - Acciones Principales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Revisar Proyectos */}
            <a href="/proyectos-revision" className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Revisar Proyectos</h4>
                  <p className="text-sm text-gray-500">Aprobar o rechazar proyectos de inversión</p>
                </div>
              </div>
            </a>

            {/* Validar Presupuestos */}
            <a href="/validacion-presupuestos" className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Validar Presupuestos</h4>
                  <p className="text-sm text-gray-500">Revisión de presupuestos asignados</p>
                </div>
              </div>
            </a>

            {/* Consultar Actividades POA */}
            <a href="/actividades-poa?modo=revision" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Actividades POA</h4>
                  <p className="text-sm text-gray-500">Ver detalle de actividades operativas</p>
                </div>
              </div>
            </a>

            {/* Reportes Institucionales */}
            <a href="/reportes?tipo=institucional" className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Reportes Institucionales</h4>
                  <p className="text-sm text-gray-500">Consultar y filtrar reportes</p>
                </div>
              </div>
            </a>

            {/* Historial de Decisiones */}
            <a href="/historial-decisiones" className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Historial de Decisiones</h4>
                  <p className="text-sm text-gray-500">Ver proyectos ya revisados</p>
                </div>
              </div>
            </a>

            {/* Exportar Reportes */}
            <a href="/exportaciones?tipo=limitada" className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Exportar Reportes</h4>
                  <p className="text-sm text-gray-500">Exportación limitada de datos</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Panel de revisión en tiempo real */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            📊 Panel de Revisión en Tiempo Real
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Métricas de Productividad */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Productividad de Revisión</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tiempo promedio por proyecto</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.tiempo_promedio_revision || 0} días</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasa de aprobación</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats && (stats.proyectos_aprobados + stats.proyectos_rechazados) > 0 
                      ? Math.round((stats.proyectos_aprobados / (stats.proyectos_aprobados + stats.proyectos_rechazados)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Presupuesto aprobado</span>
                  <span className="text-sm font-medium text-gray-900">{formatearMonto(stats?.presupuesto_total_aprobado || 0)}</span>
                </div>
              </div>
            </div>

            {/* Alertas y Notificaciones */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Alertas de Revisión</h4>
              <div className="space-y-3">
                <div className="flex items-center text-yellow-600">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">
                    {(stats?.proyectos_pendientes_revision || 0) === 0 
                      ? "No hay proyectos pendientes de revisión"
                      : `${stats?.proyectos_pendientes_revision || 0} proyectos requieren revisión inmediata`
                    }
                  </span>
                </div>
                
                {stats && stats.presupuesto_total_pendiente > 1000000 && (
                  <div className="flex items-center text-red-600">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Alto presupuesto pendiente de revisión</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del rol */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              🧑‍⚖
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Revisor Institucional - Funciones Específicas
            </h3>
            <div className="text-sm text-gray-700">
              <p className="mb-2"><strong>🎯 Propósito:</strong> Evaluar y decidir sobre la validez de los proyectos de inversión</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Acciones Autorizadas:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>• Revisar proyectos enviados por técnicos</li>
                    <li>• Aprobar o rechazar proyectos</li>
                    <li>• Validar presupuestos asignados</li>
                    <li>• Consultar actividades POA</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Accesos del Sistema:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>• Módulo 3: Proyectos de Inversión</li>
                    <li>• Módulo 4: Reportes (limitado)</li>
                    <li>• Exportación limitada de reportes</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm"><strong>⚠️ Restricciones:</strong></p>
                <p className="text-sm">• No puede crear ni editar proyectos</p>
                <p className="text-sm">• No accede a objetivos, usuarios ni instituciones</p>
                <p className="text-sm">• Exportaciones con limitaciones institucionales</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
