'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import Link from 'next/link';

interface AuditorStats {
  eventos_auditoria_hoy: number;
  usuarios_activos: number;
  modulos_auditados: number;
  reportes_generados: number;
  acciones_criticas: number;
  cumplimiento_sistema: number;
}

/**
 * Dashboard específico para el Auditor del Sistema
 * 
 * Funciones principales:
 * - Supervisar el uso del sistema
 * - Revisar actividades institucionales
 * - Validar el cumplimiento del plan
 * - Generar reportes técnicos completos
 * - Comparar y validar avances presupuestarios y de planificación
 * - Exportar reportes completos
 * - Auditar uso del sistema y acciones por rol
 */
export default function AuditorDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AuditorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      cargarEstadisticas();
    }
  }, [token]);

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(
        buildApiUrl('/api/dashboard/role-specific'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        // Datos de ejemplo mientras se implementa el endpoint
        setStats({
          eventos_auditoria_hoy: 24,
          usuarios_activos: 12,
          modulos_auditados: 5,
          reportes_generados: 8,
          acciones_criticas: 3,
          cumplimiento_sistema: 95
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      // Datos de ejemplo en caso de error
      setStats({
        eventos_auditoria_hoy: 24,
        usuarios_activos: 12,
        modulos_auditados: 5,
        reportes_generados: 8,
        acciones_criticas: 3,
        cumplimiento_sistema: 95
      });
    } finally {
      setLoading(false);
    }
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
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Eventos Hoy
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.eventos_auditoria_hoy || 0}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Usuarios Activos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.usuarios_activos || 0}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Reportes Generados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.reportes_generados || 0}
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
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Cumplimiento
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.cumplimiento_sistema || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones principales del Auditor */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            🕵 Auditoría del Sistema - Acciones Principales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Auditoría Principal */}
            <Link href="/auditoria" className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Supervisar Sistema</h4>
                  <p className="text-sm text-gray-500">Auditar uso y acciones por rol</p>
                </div>
              </div>
            </Link>

            {/* Auditoría Avanzada */}
            <Link href="/auditoria-avanzada" className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Herramientas Avanzadas</h4>
                  <p className="text-sm text-gray-500">Análisis profundo y trazabilidad</p>
                </div>
              </div>
            </Link>

            {/* Reportes Completos */}
            <Link href="/reportes?modo=completo" className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Reportes Completos</h4>
                  <p className="text-sm text-gray-500">Acceso total y exportación completa</p>
                </div>
              </div>
            </Link>

            {/* Consulta de Objetivos */}
            <Link href="/gestion-objetivos?modo=auditoria" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Consultar Objetivos</h4>
                  <p className="text-sm text-gray-500">Solo lectura para auditoría</p>
                </div>
              </div>
            </Link>

            {/* Consulta de Proyectos */}
            <Link href="/gestion-proyectos?modo=auditoria" className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Consultar Proyectos</h4>
                  <p className="text-sm text-gray-500">Solo lectura para auditoría</p>
                </div>
              </div>
            </Link>

            {/* Diagnósticos */}
            <Link href="/diagnostico" className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Diagnósticos</h4>
                  <p className="text-sm text-gray-500">Validar cumplimiento del plan</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Panel de supervisión en tiempo real */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            📊 Supervisión en Tiempo Real
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Actividad del Sistema */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Actividad del Sistema</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Eventos registrados hoy</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.eventos_auditoria_hoy}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Usuarios activos</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.usuarios_activos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Módulos monitoreados</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.modulos_auditados}</span>
                </div>
              </div>
            </div>

            {/* Indicadores de Cumplimiento */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Indicadores de Cumplimiento</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Cumplimiento General</span>
                    <span className="text-sm font-medium text-gray-900">{stats?.cumplimiento_sistema}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                      style={{ width: `${stats?.cumplimiento_sistema}%` }}
                    ></div>
                  </div>
                </div>
                
                {stats?.acciones_criticas && stats.acciones_criticas > 0 && (
                  <div className="flex items-center text-yellow-600">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{stats.acciones_criticas} acciones críticas detectadas</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Herramientas del Auditor */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            🛠️ Herramientas de Auditoría
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900">Capacidades de Supervisión</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Monitoreo de actividades por usuario</li>
                <li>• Trazabilidad completa de cambios</li>
                <li>• Análisis de patrones de uso</li>
                <li>• Detección de anomalías</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900">Reportes y Análisis</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Exportación completa sin restricciones</li>
                <li>• Reportes comparativos avanzados</li>
                <li>• Análisis de cumplimiento presupuestario</li>
                <li>• Validación de avances de planificación</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Información del rol */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg shadow p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">🕵 Su Rol como Auditor del Sistema</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p className="mb-2">
                Como Auditor del Sistema, su función es <strong>supervisar el uso del sistema y validar el cumplimiento</strong> 
                de los planes estratégicos institucionales.
              </p>
              <div className="space-y-1">
                <p>• <strong>Módulos que usa:</strong> Todos los módulos (solo lectura) + Módulo de Auditoría</p>
                <p>• <strong>Alcance:</strong> Supervisión completa del sistema</p>
                <p>• <strong>Exportaciones:</strong> Reportes completos sin restricciones</p>
                <p>• <strong>Capacidades:</strong> Trazabilidad, análisis comparativo, validación de cumplimiento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
