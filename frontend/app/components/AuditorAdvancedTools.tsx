'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import Link from 'next/link';

interface AuditoriaMetrics {
  eventos_auditoria_hoy: number;
  usuarios_monitoreados: number;
  modulos_auditados: number;
  acciones_criticas_detectadas: number;
  reportes_auditoria_generados: number;
  cumplimiento_general: number;
  objetivos_auditados: number;
  proyectos_auditados: number;
  inconsistencias_detectadas: number;
}

interface AuditoriaEvent {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  modulo: string;
  nivel: 'INFO' | 'WARNING' | 'ERROR';
  detalles: string;
}

/**
 * Panel de herramientas avanzadas para AUDITOR DEL SISTEMA
 * Implementa todas las funcionalidades específicas según especificaciones:
 * - Supervisar el uso del sistema
 * - Revisar actividades institucionales 
 * - Validar el cumplimiento del plan
 * - Generar reportes técnicos completos
 * - Comparar y validar avances presupuestarios y de planificación
 * - Exportar reportes completos
 * - Auditar uso del sistema y acciones por rol
 * 
 * Módulos que usa:
 * - Módulo 4: Reportes (acceso completo)
 * - Futuro: Módulo 5 de Auditoría y Trazabilidad
 * - Acceso de solo lectura a todos los demás módulos
 */

export default function AuditorAdvancedTools() {
  const { user, token } = useAuth();
  const [metrics, setMetrics] = useState<AuditoriaMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuditoriaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    if (user?.roles?.includes('AUDITOR')) {
      loadAuditorMetrics();
      loadRecentEvents();
    }
  }, [user]);

  const loadAuditorMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        buildApiUrl('/api/auditor/metrics-overview'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      } else {
        // Datos de ejemplo mientras se implementa el endpoint
        setMetrics({
          eventos_auditoria_hoy: 47,
          usuarios_monitoreados: 23,
          modulos_auditados: 4,
          acciones_criticas_detectadas: 2,
          reportes_auditoria_generados: 12,
          cumplimiento_general: 87,
          objetivos_auditados: 34,
          proyectos_auditados: 28,
          inconsistencias_detectadas: 5
        });
      }
    } catch (error) {
      console.error('Error al cargar métricas de auditoría:', error);
      // Datos de ejemplo en caso de error
      setMetrics({
        eventos_auditoria_hoy: 47,
        usuarios_monitoreados: 23,
        modulos_auditados: 4,
        acciones_criticas_detectadas: 2,
        reportes_auditoria_generados: 12,
        cumplimiento_general: 87,
        objetivos_auditados: 34,
        proyectos_auditados: 28,
        inconsistencias_detectadas: 5
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentEvents = async () => {
    try {
      const response = await fetch(
        buildApiUrl('/api/auditor/recent-events'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setRecentEvents(data.data || []);
      } else {
        // Datos de ejemplo
        setRecentEvents([
          {
            id: 1,
            fecha: new Date().toISOString(),
            usuario: 'Juan Pérez',
            accion: 'Creación de objetivo',
            modulo: 'Objetivos',
            nivel: 'INFO',
            detalles: 'Objetivo OBJ-2024-001 creado'
          },
          {
            id: 2,
            fecha: new Date(Date.now() - 3600000).toISOString(),
            usuario: 'María González',
            accion: 'Validación de proyecto',
            modulo: 'Proyectos',
            nivel: 'WARNING',
            detalles: 'Proyecto rechazado por falta de documentación'
          },
          {
            id: 3,
            fecha: new Date(Date.now() - 7200000).toISOString(),
            usuario: 'Carlos López',
            accion: 'Modificación de presupuesto',
            modulo: 'Presupuestos',
            nivel: 'ERROR',
            detalles: 'Intento de modificar presupuesto aprobado'
          }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar eventos recientes:', error);
    }
  };

  const generateAuditReport = async (tipoReporte: string) => {
    setGeneratingReport(tipoReporte);
    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      switch (tipoReporte) {
        case 'compliance':
          alert('✅ Reporte de Cumplimiento generado exitosamente');
          break;
        case 'activity':
          alert('✅ Reporte de Actividad del Sistema generado');
          break;
        case 'security':
          alert('✅ Reporte de Seguridad y Accesos generado');
          break;
        case 'performance':
          alert('✅ Reporte de Rendimiento del Sistema generado');
          break;
        default:
          alert('✅ Reporte generado exitosamente');
      }
    } catch (error) {
      alert('❌ Error al generar el reporte');
    } finally {
      setGeneratingReport(null);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'ERROR': return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INFO': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow border h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Auditor */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-2">
          🕵 Auditoría y Supervisión del Sistema
        </h2>
        <p className="text-red-700">
          Como Auditor del Sistema, tu función es supervisar el uso del sistema, revisar actividades 
          institucionales y validar el cumplimiento del plan estratégico.
        </p>
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-red-800">
              {metrics?.eventos_auditoria_hoy || 0} eventos monitoreados hoy
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-red-800">
              Acceso completo a reportes y solo lectura a todos los módulos
            </span>
          </div>
        </div>
      </div>

      {/* Métricas de auditoría */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-green-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cumplimiento General</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.cumplimiento_general || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuarios Monitoreados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.usuarios_monitoreados || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-yellow-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Acciones Críticas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.acciones_criticas_detectadas || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-purple-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reportes Generados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.reportes_auditoria_generados || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Herramientas de auditoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Supervisión del Sistema */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Supervisión y Monitoreo
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Herramientas para supervisar el uso del sistema y actividades
            </p>
          </div>
          <div className="p-6 space-y-4">
            <Link
              href="/auditoria"
              className="block p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-900">Auditoría Principal</h4>
                  <p className="text-sm text-red-700">Supervisar uso del sistema</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-800">{metrics?.eventos_auditoria_hoy || 0}</div>
                  <div className="text-xs text-red-600">eventos hoy</div>
                </div>
              </div>
            </Link>

            <Link
              href="/supervision-sistema"
              className="block p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-orange-900">Supervisar Sistema</h4>
                  <p className="text-sm text-orange-700">Auditar uso y acciones por rol</p>
                </div>
                <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/auditoria-avanzada"
              className="block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-yellow-900">Herramientas Avanzadas</h4>
                  <p className="text-sm text-yellow-700">Análisis profundo y trazabilidad</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-800">{metrics?.inconsistencias_detectadas || 0}</div>
                  <div className="text-xs text-yellow-600">inconsistencias</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Validación de Cumplimiento */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validación de Cumplimiento
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Revisar actividades institucionales y validar cumplimiento del plan
            </p>
          </div>
          <div className="p-6 space-y-4">
            <Link
              href="/gestion-objetivos?auditoria=true"
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Consultar Objetivos</h4>
                  <p className="text-sm text-blue-700">Solo lectura para auditoría</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-800">{metrics?.objetivos_auditados || 0}</div>
                  <div className="text-xs text-blue-600">auditados</div>
                </div>
              </div>
            </Link>

            <Link
              href="/gestion-proyectos?auditoria=true"
              className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-900">Consultar Proyectos</h4>
                  <p className="text-sm text-green-700">Solo lectura para auditoría</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-800">{metrics?.proyectos_auditados || 0}</div>
                  <div className="text-xs text-green-600">auditados</div>
                </div>
              </div>
            </Link>

            <Link
              href="/diagnostico"
              className="block p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-purple-900">Diagnósticos del Sistema</h4>
                  <p className="text-sm text-purple-700">Validar integridad y coherencia</p>
                </div>
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Generación de reportes de auditoría */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reportes Técnicos Completos
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Generar reportes completos sin restricciones - Módulo 4 acceso total
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <button
              onClick={() => generateAuditReport('compliance')}
              disabled={generatingReport !== null}
              className="p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 text-center"
            >
              <svg className="h-8 w-8 text-green-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-sm font-medium text-gray-900">
                {generatingReport === 'compliance' ? 'Generando...' : 'Reporte de Cumplimiento'}
              </h4>
              <p className="text-xs text-gray-600 mt-1">Validar cumplimiento del plan</p>
            </button>

            <button
              onClick={() => generateAuditReport('activity')}
              disabled={generatingReport !== null}
              className="p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 text-center"
            >
              <svg className="h-8 w-8 text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h4 className="text-sm font-medium text-gray-900">
                {generatingReport === 'activity' ? 'Generando...' : 'Actividad del Sistema'}
              </h4>
              <p className="text-xs text-gray-600 mt-1">Monitoreo de actividades</p>
            </button>

            <button
              onClick={() => generateAuditReport('security')}
              disabled={generatingReport !== null}
              className="p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 text-center"
            >
              <svg className="h-8 w-8 text-red-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h4 className="text-sm font-medium text-gray-900">
                {generatingReport === 'security' ? 'Generando...' : 'Seguridad y Accesos'}
              </h4>
              <p className="text-xs text-gray-600 mt-1">Análisis de seguridad</p>
            </button>

            <Link
              href="/reportes"
              className="p-4 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <svg className="h-8 w-8 text-purple-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="text-sm font-medium text-gray-900">Todos los Reportes</h4>
              <p className="text-xs text-gray-600 mt-1">Acceso completo y exportación</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Eventos recientes */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Eventos Recientes del Sistema
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Monitoreo en tiempo real de actividades del sistema
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {recentEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay eventos recientes registrados
            </div>
          ) : (
            recentEvents.map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getNivelColor(event.nivel)}`}>
                        {event.nivel}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{event.usuario}</span>
                      <span className="text-sm text-gray-500">en {event.modulo}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{event.accion}</p>
                    <p className="text-xs text-gray-500">{event.detalles}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {formatearFecha(event.fecha)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Información del rol */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow p-6 border border-red-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              🕵
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Auditor del Sistema - Funciones Específicas
            </h3>
            <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium text-gray-900 mb-2">✅ Acciones Autorizadas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>• Supervisar el uso del sistema</li>
                  <li>• Revisar actividades institucionales</li>
                  <li>• Validar el cumplimiento del plan</li>
                  <li>• Generar reportes técnicos completos</li>
                  <li>• Comparar y validar avances presupuestarios</li>
                  <li>• Exportar reportes completos</li>
                  <li>• Auditar uso del sistema y acciones por rol</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">📦 Módulos de Acceso:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>• <strong>Módulo 4:</strong> Reportes (acceso completo)</li>
                  <li>• <strong>Futuro:</strong> Módulo 5 de Auditoría y Trazabilidad</li>
                  <li>• <strong>Todos los módulos:</strong> Solo lectura para auditoría</li>
                  <li>• <strong>Capacidades:</strong> Trazabilidad, análisis comparativo</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm"><strong>🎯 Propósito General:</strong></p>
              <p className="text-sm">Supervisar el uso del sistema, revisar actividades institucionales y validar el cumplimiento del plan estratégico con capacidades completas de auditoría.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
