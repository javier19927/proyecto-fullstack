'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface ValidatorStats {
  objetivos_pendientes_validacion: number;
  objetivos_validados: number;
  objetivos_rechazados: number;
  validaciones_pendientes: number;
  tiempo_promedio_validacion: number;
}

export default function ValidatorDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<ValidatorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.roles?.includes('VALID')) {
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
        setStats(data.data.estadisticas_validador || {
          objetivos_pendientes_validacion: 0,
          objetivos_validados: 0,
          objetivos_rechazados: 0,
          validaciones_pendientes: 0,
          tiempo_promedio_validacion: 0,
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
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
      {/* Estadísticas principales del Validador */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendientes Validación
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(stats?.objetivos_pendientes_validacion || 0) === 0 ? (
                      <span className="text-sm text-green-700 font-medium">No hay objetivos pendientes</span>
                    ) : (
                      stats?.objetivos_pendientes_validacion || 0
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
                    Objetivos Validados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.objetivos_validados || 0}
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
                    Objetivos Rechazados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.objetivos_rechazados || 0}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Validaciones Pendientes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(stats?.validaciones_pendientes || 0) === 0 ? (
                      <span className="text-sm text-green-700 font-medium">Sin validaciones pendientes</span>
                    ) : (
                      stats?.validaciones_pendientes || 0
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones principales de la Autoridad Validadora */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            🧑‍⚖ Autoridad Validadora - Acciones Principales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Validar Objetivos */}
            <a href="/objetivos-validacion" className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Validar Objetivos</h4>
                  <p className="text-sm text-gray-500">Aprobar o rechazar objetivos estratégicos</p>
                </div>
              </div>
            </a>

            {/* Revisar Alineación PND/ODS */}
            <a href="/alineacion-pnd-ods?modo=validacion" className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Alineación PND/ODS</h4>
                  <p className="text-sm text-gray-500">Verificar alineación estratégica</p>
                </div>
              </div>
            </a>

            {/* Visualización Detallada */}
            <a href="/metas-indicadores?modo=validacion" className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Metas e Indicadores</h4>
                  <p className="text-sm text-gray-500">Ver detalles de metas y alineación</p>
                </div>
              </div>
            </a>

            {/* Configuración Institucional (Solo consulta para validación) */}
            <a href="/configuracion-institucional?modo=consulta" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Consultar Configuración</h4>
                  <p className="text-sm text-gray-500">Ver información institucional para validación</p>
                </div>
              </div>
            </a>

            {/* Reportes de Planificación */}
            <a href="/reportes?tipo=planificacion" className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Reportes de Planificación</h4>
                  <p className="text-sm text-gray-500">Consultar reportes de objetivos</p>
                </div>
              </div>
            </a>

            {/* Historial de Validaciones */}
            <a href="/historial-validaciones" className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Historial de Validaciones</h4>
                  <p className="text-sm text-gray-500">Ver objetivos ya validados</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Panel de validación en tiempo real */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            📊 Panel de Validación en Tiempo Real
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Métricas de Validación */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Métricas de Validación</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tiempo promedio por objetivo</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.tiempo_promedio_validacion || 0} días</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasa de aprobación</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats && (stats.objetivos_validados + stats.objetivos_rechazados) > 0 
                      ? Math.round((stats.objetivos_validados / (stats.objetivos_validados + stats.objetivos_rechazados)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Objetivos con alineación ODS</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.objetivos_validados || 0}</span>
                </div>
              </div>
            </div>

            {/* Alertas de Validación */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Alertas de Validación</h4>
              <div className="space-y-3">
                <div className="flex items-center text-orange-600">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">
                    {(stats?.objetivos_pendientes_validacion || 0) === 0 
                      ? "No hay objetivos pendientes de validación"
                      : `${stats?.objetivos_pendientes_validacion || 0} objetivos requieren validación inmediata`
                    }
                  </span>
                </div>
                
                {stats && stats.validaciones_pendientes > 5 && (
                  <div className="flex items-center text-red-600">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Acumulación de validaciones pendientes</span>
                  </div>
                )}

                <div className="flex items-center text-blue-600">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Verificar alineación PND/ODS en nuevos objetivos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flujo de trabajo recomendado */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            🔄 Flujo de Trabajo de Validación
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold">1</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Revisar Objetivos</h4>
              <p className="text-xs text-gray-600">Evaluar objetivos enviados por técnicos</p>
            </div>
            
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Verificar Alineación</h4>
              <p className="text-xs text-gray-600">Confirmar alineación con PND y ODS</p>
            </div>
            
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Tomar Decisión</h4>
              <p className="text-xs text-gray-600">Aprobar o rechazar con observaciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de elementos pendientes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            ⏳ Estado de Validaciones Pendientes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Objetivos urgentes */}
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-orange-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-orange-800">Objetivos Pendientes</h4>
                  {(stats?.objetivos_pendientes_validacion || 0) === 0 ? (
                    <p className="text-sm text-green-700 font-medium">No hay objetivos pendientes de validación</p>
                  ) : (
                    <p className="text-lg font-bold text-orange-900">{stats?.objetivos_pendientes_validacion}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Validaciones en proceso */}
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">En Proceso</h4>
                  {(stats?.validaciones_pendientes || 0) === 0 ? (
                    <p className="text-sm text-green-700 font-medium">Sin validaciones en proceso</p>
                  ) : (
                    <p className="text-lg font-bold text-blue-900">{stats?.validaciones_pendientes}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del rol */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              🧑‍⚖
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Autoridad Validadora - Funciones Específicas
            </h3>
            <div className="text-sm text-gray-700">
              <p className="mb-2"><strong>🎯 Propósito:</strong> Evaluar y aprobar o rechazar los objetivos estratégicos institucionales</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Acciones Autorizadas:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>• Revisar objetivos estratégicos enviados</li>
                    <li>• Aprobar o rechazar objetivos</li>
                    <li>• Verificar alineación PND/ODS</li>
                    <li>• Validar metas e indicadores</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Accesos del Sistema:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>• Módulo 2: Objetivos Estratégicos</li>
                    <li>• Módulo 4: Reportes (limitado)</li>
                    <li>• Visualización detallada de metas</li>
                    <li>• Exportación limitada de reportes</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm"><strong>⚠️ Restricciones:</strong></p>
                <p className="text-sm">• No puede crear ni editar objetivos</p>
                <p className="text-sm">• No accede a usuarios, instituciones ni proyectos directamente</p>
                <p className="text-sm">• Exportaciones con limitaciones de alcance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
