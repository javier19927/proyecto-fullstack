'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado';
  presupuesto_total: number;
  fecha_inicio: string;
  fecha_fin: string;
  responsable_nombre?: string;
  institucion_nombre?: string;
  created_at: string;
  enviado_por?: string;
  enviado_fecha?: string;
}

interface ReviewerWorkflowProps {
  className?: string;
}

/**
 * Componente específico para REVISOR INSTITUCIONAL
 * Permite revisar proyectos enviados por técnicos planificadores
 */
export default function ReviewerWorkflow({ className = "" }: ReviewerWorkflowProps) {
  const { user, token } = useAuth();
  const [proyectosPendientes, setProyectosPendientes] = useState<Proyecto[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(false);
  const [accionSeleccionada, setAccionSeleccionada] = useState<'APROBAR' | 'RECHAZAR' | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (user?.roles?.includes('REVISOR')) {
      cargarProyectosPendientes();
    }
  }, [user]);

  const cargarProyectosPendientes = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Filtrar solo proyectos en estado "Enviado" que requieren revisión
      const response = await fetch(
        buildApiUrl('/api/proyectos/pendientes-revision'), 
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        setProyectosPendientes(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando proyectos pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalRevision = (proyecto: Proyecto, accion: 'APROBAR' | 'RECHAZAR') => {
    setProyectoSeleccionado(proyecto);
    setAccionSeleccionada(accion);
    setMostrarModal(true);
  };

  const procesarRevision = async () => {
    if (!proyectoSeleccionado || !accionSeleccionada || !token) return;
    
    if (accionSeleccionada === 'RECHAZAR' && !observaciones.trim()) {
      alert('Las observaciones son obligatorias para rechazar un proyecto.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = accionSeleccionada === 'APROBAR' 
        ? `/api/proyectos/${proyectoSeleccionado.id}/aprobar-revision`
        : `/api/proyectos/${proyectoSeleccionado.id}/rechazar-revision`;
      
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ observaciones })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // Recargar lista de proyectos pendientes
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
      setLoading(false);
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setProyectoSeleccionado(null);
    setAccionSeleccionada(null);
    setObservaciones('');
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(monto);
  };

  if (!user?.roles?.includes('REVISOR')) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header específico para Revisor */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              🧑‍⚖
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-purple-900">
              Panel de Revisión Institucional
            </h2>
            <p className="text-sm text-purple-700">
              Proyectos enviados por Técnicos Planificadores que requieren su revisión y aprobación
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                ⏳
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pendientes de Revisión</p>
              <p className="text-2xl font-semibold text-gray-900">{proyectosPendientes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                💰
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Presupuesto Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatearMonto(proyectosPendientes.reduce((sum, p) => sum + p.presupuesto_total, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                🚀
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Próximos a Iniciar</p>
              <p className="text-2xl font-semibold text-gray-900">
                {proyectosPendientes.filter(p => 
                  new Date(p.fecha_inicio) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de proyectos pendientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Proyectos Pendientes de Revisión
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                Cargando proyectos...
              </div>
            </div>
          ) : proyectosPendientes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>No hay proyectos pendientes de revisión</p>
            </div>
          ) : (
            proyectosPendientes.map((proyecto) => (
              <div key={proyecto.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {proyecto.codigo}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {proyecto.estado}
                      </span>
                    </div>
                    
                    <h5 className="text-md font-semibold text-gray-800 mb-2">
                      {proyecto.nombre}
                    </h5>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {proyecto.descripcion}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Responsable:</span>
                        <br />
                        <span className="text-gray-900">{proyecto.responsable_nombre}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Institución:</span>
                        <br />
                        <span className="text-gray-900">{proyecto.institucion_nombre}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Presupuesto:</span>
                        <br />
                        <span className="text-gray-900 font-semibold">{formatearMonto(proyecto.presupuesto_total)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Período:</span>
                        <br />
                        <span className="text-gray-900">
                          {formatearFecha(proyecto.fecha_inicio)} - {formatearFecha(proyecto.fecha_fin)}
                        </span>
                      </div>
                    </div>
                    
                    {proyecto.enviado_por && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-800">
                          <strong>Enviado por:</strong> {proyecto.enviado_por} el {formatearFecha(proyecto.enviado_fecha || proyecto.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex space-x-2">
                    <button
                      onClick={() => abrirModalRevision(proyecto, 'APROBAR')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      onClick={() => abrirModalRevision(proyecto, 'RECHAZAR')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de revisión */}
      {mostrarModal && proyectoSeleccionado && accionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {accionSeleccionada === 'APROBAR' ? '✅ Aprobar Proyecto' : '❌ Rechazar Proyecto'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>{proyectoSeleccionado.codigo}:</strong> {proyectoSeleccionado.nombre}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones de Revisión {accionSeleccionada === 'RECHAZAR' ? '(requeridas)' : '(opcionales)'}
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={`Ingrese sus observaciones para ${accionSeleccionada === 'APROBAR' ? 'la aprobación' : 'el rechazo'} del proyecto...`}
                required={accionSeleccionada === 'RECHAZAR'}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cerrarModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={procesarRevision}
                disabled={loading || (accionSeleccionada === 'RECHAZAR' && !observaciones.trim())}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  accionSeleccionada === 'APROBAR'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                }`}
              >
                {loading ? 'Procesando...' : `${accionSeleccionada === 'APROBAR' ? 'Aprobar' : 'Rechazar'} Proyecto`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
