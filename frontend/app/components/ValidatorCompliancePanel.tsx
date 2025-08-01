'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import Link from 'next/link';

interface ValidatorMetrics {
  objetivos_pendientes: number;
  objetivos_validados_hoy: number;
  objetivos_rechazados: number;
  tiempo_promedio_validacion: number;
  total_objetivos_recibidos: number;
  cumplimiento_validacion: number;
  objetivos_en_revision: number;
  validaciones_exitosas: number;
}

interface ObjetivoPendiente {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha_recepcion: string;
  planificador: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  estado: 'PENDIENTE' | 'EN_REVISION' | 'VALIDADO' | 'RECHAZADO';
  dias_transcurridos: number;
}

/**
 * Panel específico para AUTORIDAD VALIDADORA (VALID)
 * Implementa todas las funcionalidades específicas según especificaciones:
 * - Validar objetivos estratégicos enviados por los planificadores
 * - Aprobar o rechazar objetivos con comentarios
 * - Consultar módulos para tomar decisiones informadas
 * - Solo lectura en objetivos ya validados
 * 
 * Módulos que usa:
 * - Módulo 2: Objetivos Estratégicos (validación específica)
 * - Módulo 1: Configuración Institucional (solo consulta)
 * - Módulo 3: Proyectos de Inversión (solo consulta)
 * - Módulo 4: Reportes (solo consulta)
 */

export default function ValidatorCompliancePanel() {
  const { user, token } = useAuth();
  const [metrics, setMetrics] = useState<ValidatorMetrics | null>(null);
  const [pendingObjectives, setPendingObjectives] = useState<ObjetivoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedObjective, setSelectedObjective] = useState<ObjetivoPendiente | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (user?.roles?.includes('VALID')) {
      loadValidatorMetrics();
      loadPendingObjectives();
    }
  }, [user]);

  const loadValidatorMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        buildApiUrl('/api/validator/metrics-overview'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      } else {
        // Datos de ejemplo mientras se implementa el endpoint
        setMetrics({
          objetivos_pendientes: 7,
          objetivos_validados_hoy: 3,
          objetivos_rechazados: 2,
          tiempo_promedio_validacion: 2.4,
          total_objetivos_recibidos: 45,
          cumplimiento_validacion: 89,
          objetivos_en_revision: 4,
          validaciones_exitosas: 38
        });
      }
    } catch (error) {
      console.error('Error al cargar métricas del validador:', error);
      // Datos de ejemplo en caso de error
      setMetrics({
        objetivos_pendientes: 7,
        objetivos_validados_hoy: 3,
        objetivos_rechazados: 2,
        tiempo_promedio_validacion: 2.4,
        total_objetivos_recibidos: 45,
        cumplimiento_validacion: 89,
        objetivos_en_revision: 4,
        validaciones_exitosas: 38
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingObjectives = async () => {
    try {
      const response = await fetch(
        buildApiUrl('/api/validator/pending-objectives'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingObjectives(data.data || []);
      } else {
        // Datos de ejemplo
        setPendingObjectives([
          {
            id: 1,
            codigo: 'OBJ-2024-001',
            nombre: 'Mejorar la infraestructura tecnológica',
            descripcion: 'Modernizar sistemas informáticos institucionales',
            fecha_recepcion: new Date(Date.now() - 86400000).toISOString(),
            planificador: 'Juan Pérez',
            prioridad: 'ALTA',
            estado: 'PENDIENTE',
            dias_transcurridos: 1
          },
          {
            id: 2,
            codigo: 'OBJ-2024-002',
            nombre: 'Implementar programa de capacitación',
            descripcion: 'Fortalecer capacidades del personal técnico',
            fecha_recepcion: new Date(Date.now() - 172800000).toISOString(),
            planificador: 'María González',
            prioridad: 'MEDIA',
            estado: 'EN_REVISION',
            dias_transcurridos: 2
          },
          {
            id: 3,
            codigo: 'OBJ-2024-003',
            nombre: 'Optimizar procesos administrativos',
            descripcion: 'Reducir tiempos de gestión y tramitación',
            fecha_recepcion: new Date(Date.now() - 259200000).toISOString(),
            planificador: 'Carlos López',
            prioridad: 'ALTA',
            estado: 'PENDIENTE',
            dias_transcurridos: 3
          }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar objetivos pendientes:', error);
    }
  };

  const validateObjective = async (objectiveId: number, decision: 'VALIDADO' | 'RECHAZADO') => {
    if (!validationComment.trim()) {
      alert('Por favor, ingrese un comentario para la validación');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(
        buildApiUrl(`/api/validator/validate-objective/${objectiveId}`),
        {
          method: 'POST',
          headers: buildHeaders(token!),
          body: JSON.stringify({
            decision,
            comentario: validationComment
          })
        }
      );

      if (response.ok) {
        alert(`✅ Objetivo ${decision.toLowerCase()} exitosamente`);
        setSelectedObjective(null);
        setValidationComment('');
        loadPendingObjectives();
        loadValidatorMetrics();
      } else {
        alert('❌ Error al procesar la validación');
      }
    } catch (error) {
      alert('❌ Error de conexión al validar objetivo');
    } finally {
      setValidating(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAJA': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'EN_REVISION': return 'bg-blue-100 text-blue-800';
      case 'VALIDADO': return 'bg-green-100 text-green-800';
      case 'RECHAZADO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* Header del Validador */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          ✅ Validación de Objetivos Estratégicos
        </h2>
        <p className="text-blue-700">
          Como Autoridad Validadora, tu función es validar objetivos estratégicos enviados por los 
          planificadores, aprobarlos o rechazarlos con comentarios fundamentados.
        </p>
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-blue-800">
              {metrics?.objetivos_pendientes || 0} objetivos pendientes de validación
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-blue-800">
              {metrics?.objetivos_validados_hoy || 0} validados hoy
            </span>
          </div>
        </div>
      </div>

      {/* Métricas del validador */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-yellow-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes de Validación</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.objetivos_pendientes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-green-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Validados Hoy</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.objetivos_validados_hoy || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.tiempo_promedio_validacion || 0} días
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-purple-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cumplimiento</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.cumplimiento_validacion || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de validación principal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Objetivos pendientes de validación */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Objetivos Pendientes de Validación
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Objetivos enviados por planificadores que requieren tu validación
              </p>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {pendingObjectives.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay objetivos pendientes de validación
                </div>
              ) : (
                pendingObjectives.map((objetivo) => (
                  <div 
                    key={objetivo.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedObjective?.id === objetivo.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedObjective(objetivo)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{objetivo.codigo}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPrioridadColor(objetivo.prioridad)}`}>
                            {objetivo.prioridad}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(objetivo.estado)}`}>
                            {objetivo.estado}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{objetivo.nombre}</h4>
                        <p className="text-sm text-gray-600 mb-2">{objetivo.descripcion}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Planificador: {objetivo.planificador}</span>
                          <span>Recibido: {formatearFecha(objetivo.fecha_recepcion)}</span>
                          <span className={objetivo.dias_transcurridos > 2 ? 'text-red-600 font-medium' : ''}>
                            {objetivo.dias_transcurridos} días transcurridos
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {objetivo.dias_transcurridos > 2 && (
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel de validación detallada */}
        <div className="space-y-6">
          
          {/* Detalle del objetivo seleccionado */}
          {selectedObjective && (
            <div className="bg-white rounded-lg shadow border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Validar Objetivo
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedObjective.codigo}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Nombre del Objetivo</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedObjective.nombre}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Descripción</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedObjective.descripcion}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Información Adicional</h4>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Planificador:</span>
                      <span className="text-gray-900">{selectedObjective.planificador}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prioridad:</span>
                      <span className={`font-medium ${
                        selectedObjective.prioridad === 'ALTA' ? 'text-red-600' :
                        selectedObjective.prioridad === 'MEDIA' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {selectedObjective.prioridad}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Días transcurridos:</span>
                      <span className={`font-medium ${
                        selectedObjective.dias_transcurridos > 2 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {selectedObjective.dias_transcurridos} días
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Comentario de Validación *</h4>
                  <textarea
                    value={validationComment}
                    onChange={(e) => setValidationComment(e.target.value)}
                    placeholder="Ingrese sus comentarios sobre la validación del objetivo..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => validateObjective(selectedObjective.id, 'VALIDADO')}
                    disabled={validating || !validationComment.trim()}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {validating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Validando...
                      </>
                    ) : (
                      '✅ Validar'
                    )}
                  </button>
                  
                  <button
                    onClick={() => validateObjective(selectedObjective.id, 'RECHAZADO')}
                    disabled={validating || !validationComment.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {validating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Rechazando...
                      </>
                    ) : (
                      '❌ Rechazar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Módulos de consulta */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Módulos de Consulta
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Solo lectura para tomar decisiones informadas
              </p>
            </div>
            <div className="p-6 space-y-3">
              <Link
                href="/configuracion-institucional?readonly=true"
                className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Configuración Institucional</h4>
                    <p className="text-xs text-blue-700">Solo consulta</p>
                  </div>
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              <Link
                href="/gestion-proyectos?readonly=true"
                className="block p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Proyectos de Inversión</h4>
                    <p className="text-xs text-green-700">Solo consulta</p>
                  </div>
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              <Link
                href="/reportes?readonly=true"
                className="block p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-purple-900">Reportes</h4>
                    <p className="text-xs text-purple-700">Solo consulta</p>
                  </div>
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Información del rol */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              ✅
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Autoridad Validadora - Funciones Específicas
            </h3>
            <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium text-gray-900 mb-2">✅ Acciones Autorizadas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>• Validar objetivos estratégicos enviados por planificadores</li>
                  <li>• Aprobar objetivos con comentarios</li>
                  <li>• Rechazar objetivos con justificación</li>
                  <li>• Consultar módulos para decisiones informadas</li>
                  <li>• Solo lectura en objetivos ya validados</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">📦 Módulos de Acceso:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>• <strong>Módulo 2:</strong> Objetivos Estratégicos (validación específica)</li>
                  <li>• <strong>Módulo 1:</strong> Configuración Institucional (solo consulta)</li>
                  <li>• <strong>Módulo 3:</strong> Proyectos de Inversión (solo consulta)</li>
                  <li>• <strong>Módulo 4:</strong> Reportes (solo consulta)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm"><strong>🎯 Propósito General:</strong></p>
              <p className="text-sm">Su función principal es validar objetivos estratégicos enviados por los planificadores, aprobarlos o rechazarlos con comentarios fundamentados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
