'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface Objetivo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: 'BORRADOR' | 'EN_VALIDACION' | 'APROBADO' | 'RECHAZADO';
  area_responsable: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  pnd_nombre?: string;
  ods_nombre?: string;
  responsable_nombre?: string;
  created_at: string;
  enviado_por?: string;
  enviado_fecha?: string;
}

interface ValidatorWorkflowProps {
  className?: string;
}

/**
 * Componente específico para AUTORIDAD VALIDADORA (VALID)
 * Permite validar objetivos estratégicos enviados por técnicos planificadores
 */
export default function ValidatorWorkflow({ className = "" }: ValidatorWorkflowProps) {
  const { user, token } = useAuth();
  const [objetivosPendientes, setObjetivosPendientes] = useState<Objetivo[]>([]);
  const [objetivoSeleccionado, setObjetivoSeleccionado] = useState<Objetivo | null>(null);
  const [loading, setLoading] = useState(false);
  const [accionSeleccionada, setAccionSeleccionada] = useState<'APROBAR' | 'RECHAZAR' | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (user?.roles?.includes('VALID')) {
      cargarObjetivosPendientes();
    }
  }, [user]);

  const cargarObjetivosPendientes = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Filtrar solo objetivos en estado "EN_VALIDACION" que requieren validación
      const response = await fetch(
        buildApiUrl('/api/objetivos/pendientes-validacion'), 
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        setObjetivosPendientes(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando objetivos pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalValidacion = (objetivo: Objetivo, accion: 'APROBAR' | 'RECHAZAR') => {
    setObjetivoSeleccionado(objetivo);
    setAccionSeleccionada(accion);
    setMostrarModal(true);
  };

  const procesarValidacion = async () => {
    if (!objetivoSeleccionado || !accionSeleccionada || !token) return;
    
    if (accionSeleccionada === 'RECHAZAR' && !observaciones.trim()) {
      alert('Las observaciones son obligatorias para rechazar un objetivo.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = accionSeleccionada === 'APROBAR' 
        ? `/api/objetivos/${objetivoSeleccionado.id}/aprobar-validacion`
        : `/api/objetivos/${objetivoSeleccionado.id}/rechazar-validacion`;
      
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ observaciones })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // Recargar lista de objetivos pendientes
        await cargarObjetivosPendientes();
        cerrarModal();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error procesando validación:', error);
      alert('Error procesando validación');
    } finally {
      setLoading(false);
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setObjetivoSeleccionado(null);
    setAccionSeleccionada(null);
    setObservaciones('');
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'bg-red-100 text-red-800';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800';
      case 'BAJA': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user?.roles?.includes('VALID')) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header específico para Autoridad Validadora */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              🧑‍⚖
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-orange-900">
              Panel de Autoridad Validadora
            </h2>
            <p className="text-sm text-orange-700">
              Objetivos estratégicos enviados por Técnicos Planificadores que requieren su validación
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                📋
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{objetivosPendientes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                🔴
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Alta Prioridad</p>
              <p className="text-2xl font-semibold text-gray-900">
                {objetivosPendientes.filter(o => o.prioridad === 'ALTA').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                🎯
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Con PND</p>
              <p className="text-2xl font-semibold text-gray-900">
                {objetivosPendientes.filter(o => o.pnd_nombre).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                🌍
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Con ODS</p>
              <p className="text-2xl font-semibold text-gray-900">
                {objetivosPendientes.filter(o => o.ods_nombre).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de objetivos pendientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Objetivos Estratégicos Pendientes de Validación
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                Cargando objetivos...
              </div>
            </div>
          ) : objetivosPendientes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>No hay objetivos pendientes de validación</p>
            </div>
          ) : (
            objetivosPendientes.map((objetivo) => (
              <div key={objetivo.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {objetivo.codigo}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {objetivo.estado}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(objetivo.prioridad)}`}>
                        {objetivo.prioridad}
                      </span>
                    </div>
                    
                    <h5 className="text-md font-semibold text-gray-800 mb-2">
                      {objetivo.nombre}
                    </h5>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {objetivo.descripcion}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium text-gray-500">Área Responsable:</span>
                        <br />
                        <span className="text-gray-900">{objetivo.area_responsable}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Responsable:</span>
                        <br />
                        <span className="text-gray-900">{objetivo.responsable_nombre}</span>
                      </div>
                    </div>

                    {/* Alineaciones PND y ODS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {objetivo.pnd_nombre && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-xs font-medium text-blue-900">🎯 Alineación PND:</p>
                          <p className="text-sm text-blue-800">{objetivo.pnd_nombre}</p>
                        </div>
                      )}
                      {objetivo.ods_nombre && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-xs font-medium text-green-900">🌍 Alineación ODS:</p>
                          <p className="text-sm text-green-800">{objetivo.ods_nombre}</p>
                        </div>
                      )}
                    </div>
                    
                    {objetivo.enviado_por && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-md">
                        <p className="text-xs text-orange-800">
                          <strong>Enviado por:</strong> {objetivo.enviado_por} el {formatearFecha(objetivo.enviado_fecha || objetivo.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex space-x-2">
                    <button
                      onClick={() => abrirModalValidacion(objetivo, 'APROBAR')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      onClick={() => abrirModalValidacion(objetivo, 'RECHAZAR')}
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

      {/* Modal de validación */}
      {mostrarModal && objetivoSeleccionado && accionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {accionSeleccionada === 'APROBAR' ? '✅ Aprobar Objetivo' : '❌ Rechazar Objetivo'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>{objetivoSeleccionado.codigo}:</strong> {objetivoSeleccionado.nombre}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones de Validación {accionSeleccionada === 'RECHAZAR' ? '(requeridas)' : '(opcionales)'}
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder={`Ingrese sus observaciones para ${accionSeleccionada === 'APROBAR' ? 'la aprobación' : 'el rechazo'} del objetivo...`}
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
                onClick={procesarValidacion}
                disabled={loading || (accionSeleccionada === 'RECHAZAR' && !observaciones.trim())}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  accionSeleccionada === 'APROBAR'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                }`}
              >
                {loading ? 'Procesando...' : `${accionSeleccionada === 'APROBAR' ? 'Aprobar' : 'Rechazar'} Objetivo`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
