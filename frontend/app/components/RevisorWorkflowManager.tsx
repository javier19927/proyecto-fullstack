'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  institucion_nombre: string;
  estado: 'PENDIENTE_REVISION' | 'APROBADO' | 'RECHAZADO';
  fecha_envio: string;
  fecha_revision?: string;
  planificador_nombre: string;
  comentario_revision?: string;
  presupuesto_total: number;
  actividades_count: number;
  objetivo_asociado?: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
}

interface RevisionData {
  decision: 'APROBADO' | 'RECHAZADO';
  comentario: string;
}

/**
 * Componente específico para REVISOR INSTITUCIONAL
 * Implementa todas las funcionalidades específicas del rol según matriz de permisos:
 * - Revisar proyectos de inversión enviados por técnicos planificadores
 * - Aprobar o rechazar proyectos con justificación obligatoria para rechazos
 * - Ver detalles de actividades y presupuestos
 * - Acceso limitado a reportes de proyectos
 */

export default function RevisorWorkflowManager() {
  const { user, token } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [modalRevision, setModalRevision] = useState<{
    show: boolean;
    proyecto: Proyecto | null;
    accion: 'APROBAR' | 'RECHAZAR' | null;
  }>({
    show: false,
    proyecto: null,
    accion: null
  });
  const [formRevision, setFormRevision] = useState<RevisionData>({
    decision: 'APROBADO',
    comentario: ''
  });

  useEffect(() => {
    if (user?.roles?.includes('REVISOR')) {
      cargarProyectosPendientes();
    }
  }, [user]);

  const cargarProyectosPendientes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        buildApiUrl('/api/proyectos?estado=PENDIENTE_REVISION&para_revision=true'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setProyectos(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalRevision = (proyecto: Proyecto, accion: 'APROBAR' | 'RECHAZAR') => {
    setModalRevision({
      show: true,
      proyecto,
      accion
    });
    setFormRevision({
      decision: accion === 'APROBAR' ? 'APROBADO' : 'RECHAZADO',
      comentario: ''
    });
  };

  const procesarRevision = async () => {
    if (!modalRevision.proyecto || !modalRevision.accion || !token) return;

    // Validar comentario obligatorio para rechazos
    if (modalRevision.accion === 'RECHAZAR' && !formRevision.comentario.trim()) {
      alert('Debe proporcionar una justificación para rechazar el proyecto.');
      return;
    }

    setProcesando(modalRevision.proyecto.id);
    try {
      const endpoint = modalRevision.accion === 'APROBAR' 
        ? `/api/proyectos/${modalRevision.proyecto.id}/aprobar-revision`
        : `/api/proyectos/${modalRevision.proyecto.id}/rechazar-revision`;

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({
          comentario: formRevision.comentario,
          revisor_id: user?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Proyecto ${modalRevision.accion === 'APROBAR' ? 'aprobado' : 'rechazado'} exitosamente`);
        
        // Recargar lista
        await cargarProyectosPendientes();
        cerrarModal();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error procesando revisión:', error);
      alert('Error procesando revisión');
    } finally {
      setProcesando(null);
    }
  };

  const cerrarModal = () => {
    setModalRevision({
      show: false,
      proyecto: null,
      accion: null
    });
    setFormRevision({
      decision: 'APROBADO',
      comentario: ''
    });
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'BOB'
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAJA': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow border">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          🧑‍⚖ Revisión Institucional de Proyectos
        </h2>
        <p className="text-blue-700">
          Como Revisor Institucional, tu función es evaluar y decidir sobre la validez de los proyectos de inversión 
          enviados por los técnicos planificadores.
        </p>
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-blue-800">
              {proyectos.filter(p => p.estado === 'PENDIENTE_REVISION').length} proyectos pendientes
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-blue-800">Solo acceso a Módulo 3 (Proyectos) y Módulo 4 (Reportes)</span>
          </div>
        </div>
      </div>

      {/* Lista de proyectos pendientes */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Proyectos de Inversión Pendientes de Revisión
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Proyectos enviados por técnicos planificadores que requieren tu evaluación y decisión
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {proyectos.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyectos pendientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Todos los proyectos han sido revisados o no hay proyectos enviados para revisión.
              </p>
            </div>
          ) : (
            proyectos.map((proyecto) => (
              <div key={proyecto.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {proyecto.nombre}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(proyecto.prioridad)}`}>
                        Prioridad {proyecto.prioridad}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {proyecto.descripcion}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Institución:</span>
                        <p className="text-gray-600">{proyecto.institucion_nombre}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Planificador:</span>
                        <p className="text-gray-600">{proyecto.planificador_nombre}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Presupuesto Total:</span>
                        <p className="text-green-600 font-medium">{formatearMonto(proyecto.presupuesto_total)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Actividades:</span>
                        <p className="text-blue-600">{proyecto.actividades_count} actividades planificadas</p>
                      </div>
                    </div>

                    {proyecto.objetivo_asociado && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Objetivo Estratégico Asociado:</strong> {proyecto.objetivo_asociado}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Enviado el {formatearFecha(proyecto.fecha_envio)}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => abrirModalRevision(proyecto, 'APROBAR')}
                      disabled={procesando === proyecto.id}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprobar
                    </button>
                    <button
                      onClick={() => abrirModalRevision(proyecto, 'RECHAZAR')}
                      disabled={procesando === proyecto.id}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de revisión */}
      {modalRevision.show && modalRevision.proyecto && modalRevision.accion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalRevision.accion === 'APROBAR' ? '✅ Aprobar Proyecto' : '❌ Rechazar Proyecto'}
              </h3>
              <button
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{modalRevision.proyecto.nombre}</h4>
              <p className="text-sm text-gray-600 mb-2">{modalRevision.proyecto.descripcion}</p>
              <div className="text-sm">
                <span className="font-medium">Presupuesto:</span> {formatearMonto(modalRevision.proyecto.presupuesto_total)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modalRevision.accion === 'APROBAR' ? 'Comentarios de aprobación (opcional)' : 'Justificación del rechazo (obligatorio)'}
              </label>
              <textarea
                value={formRevision.comentario}
                onChange={(e) => setFormRevision(prev => ({ ...prev, comentario: e.target.value }))}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  modalRevision.accion === 'APROBAR'
                    ? "Comentarios adicionales sobre la aprobación del proyecto..."
                    : "Especifica los motivos del rechazo y las correcciones necesarias..."
                }
              />
              {modalRevision.accion === 'RECHAZAR' && (
                <p className="text-sm text-red-600 mt-1">
                  * Debe proporcionar una justificación clara para el rechazo
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={procesarRevision}
                disabled={
                  procesando === modalRevision.proyecto.id ||
                  (modalRevision.accion === 'RECHAZAR' && !formRevision.comentario.trim())
                }
                className={`px-6 py-2 rounded-lg font-medium text-white disabled:opacity-50 ${
                  modalRevision.accion === 'APROBAR' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {procesando === modalRevision.proyecto.id 
                  ? 'Procesando...' 
                  : `Confirmar ${modalRevision.accion === 'APROBAR' ? 'Aprobación' : 'Rechazo'}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información del rol */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              🧑‍⚖
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Revisor Institucional - Funciones Específicas
            </h3>
            <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-900 mb-1">Acciones Autorizadas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>• Revisar proyectos de inversión</li>
                  <li>• Aprobar o rechazar proyectos</li>
                  <li>• Ver actividades y presupuestos</li>
                  <li>• Consultar reportes de proyectos</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Módulos de Acceso:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>• Módulo 3: Proyectos de Inversión</li>
                  <li>• Módulo 4: Reportes (limitado)</li>
                  <li>• ❌ SIN acceso a objetivos, usuarios o instituciones</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm"><strong>⚠️ Restricciones:</strong></p>
              <p className="text-sm">• No puede crear ni editar proyectos</p>
              <p className="text-sm">• No accede a objetivos estratégicos</p>
              <p className="text-sm">• Exportaciones de reportes con limitaciones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
