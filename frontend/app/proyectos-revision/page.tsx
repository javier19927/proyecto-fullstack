'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import ProtectedRoute from '../components/ProtectedRoute';
import { ReviewerOnly } from '../components/PermissionGate';

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  institucion_nombre: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fecha_envio: string;
  fecha_revision?: string;
  planificador_nombre: string;
  comentario_revision?: string;
  presupuesto_total: number;
  actividades_count: number;
  objetivo_asociado?: string;
}

interface RevisionData {
  decision: 'APROBADO' | 'RECHAZADO';
  comentario: string;
}

/**
 * Página específica para el Revisor Institucional
 * Implementa la funcionalidad completa según las especificaciones:
 * - Evaluar y decidir sobre la validez de proyectos de inversión
 * - Revisar proyectos enviados por técnicos planificadores
 * - Aprobar o rechazar proyectos con comentarios obligatorios para rechazos
 */

export default function ProyectosRevisionPage() {
  const { user, token } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [revisando, setRevisando] = useState<number | null>(null);
  const [modalRevision, setModalRevision] = useState<{ show: boolean; proyecto: Proyecto | null }>({
    show: false,
    proyecto: null
  });
  const [formRevision, setFormRevision] = useState<RevisionData>({
    decision: 'APROBADO',
    comentario: ''
  });
  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'revisados'>('pendientes');

  useEffect(() => {
    if (token && user) {
      cargarProyectosPendientes();
    }
  }, [token, user, filter]);

  const cargarProyectosPendientes = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const endpoint = filter === 'todos' 
        ? '/api/proyectos/revision/todos'
        : filter === 'pendientes'
          ? '/api/proyectos/pendientes-revision'
          : '/api/proyectos/revision/historial';

      const response = await fetch(
        buildApiUrl(endpoint),
        { headers: buildHeaders(token) }
      );

      if (response.ok) {
        const data = await response.json();
        setProyectos(data.data || []);
      } else {
        setError('Error al cargar proyectos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalRevision = (proyecto: Proyecto) => {
    setModalRevision({ show: true, proyecto });
    setFormRevision({ decision: 'APROBADO', comentario: '' });
  };

  const cerrarModal = () => {
    setModalRevision({ show: false, proyecto: null });
    setFormRevision({ decision: 'APROBADO', comentario: '' });
  };

  const procesarRevision = async () => {
    if (!modalRevision.proyecto) return;

    // Validar que se proporcione comentario para rechazos
    if (formRevision.decision === 'RECHAZADO' && !formRevision.comentario.trim()) {
      alert('Debe proporcionar un comentario para el rechazo');
      return;
    }

    setRevisando(modalRevision.proyecto.id);
    
    try {
      const response = await fetch(
        buildApiUrl(`/api/proyectos/${modalRevision.proyecto.id}/revisar`),
        {
          method: 'POST',
          headers: buildHeaders(token!),
          body: JSON.stringify({
            decision: formRevision.decision,
            comentario: formRevision.comentario,
            revisado_por: user?.id
          })
        }
      );

      if (response.ok) {
        // Actualizar la lista de proyectos
        await cargarProyectosPendientes();
        cerrarModal();
        
        // Mostrar mensaje de éxito
        const mensaje = formRevision.decision === 'APROBADO' ? 'aprobado' : 'rechazado';
        alert(`Proyecto ${mensaje} exitosamente`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error al revisar proyecto:', error);
      alert('Error al procesar la revisión');
    } finally {
      setRevisando(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'APROBADO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800',
      'EN_EJECUCION': 'bg-blue-100 text-blue-800',
      'FORMULACION': 'bg-purple-100 text-purple-800'
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando proyectos...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ReviewerOnly>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    🧑‍⚖ Proyectos para Revisar
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Evaluar y decidir sobre la validez de los proyectos de inversión
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                  <p className="text-sm text-purple-600">Revisor Institucional</p>
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

            {/* Filtros */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('pendientes')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'pendientes'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  📋 Pendientes de Revisión
                </button>
                <button
                  onClick={() => setFilter('revisados')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'revisados'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  📜 Historial de Decisiones
                </button>
                <button
                  onClick={() => setFilter('todos')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'todos'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  📊 Todos los Proyectos
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {proyectos.filter(p => p.estado === 'PENDIENTE').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aprobados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {proyectos.filter(p => p.estado === 'APROBADO').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-full">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rechazados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {proyectos.filter(p => p.estado === 'RECHAZADO').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{proyectos.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Proyectos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Proyectos de Inversión {
                    filter === 'pendientes' ? 'Pendientes de Revisión' :
                    filter === 'revisados' ? '- Historial de Decisiones' :
                    '- Vista General'
                  }
                </h2>
              </div>

              {proyectos.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl">📋</span>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No hay proyectos {filter === 'pendientes' ? 'pendientes' : 'disponibles'}
                  </h3>
                  <p className="mt-2 text-gray-500">
                    {filter === 'pendientes' 
                      ? 'Todos los proyectos han sido procesados'
                      : 'No se encontraron proyectos con los filtros seleccionados'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proyecto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Institución
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Planificador
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Presupuesto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {proyectos.map((proyecto) => (
                        <tr key={proyecto.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {proyecto.nombre}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {proyecto.descripcion}
                              </div>
                              <div className="mt-1 flex space-x-2">
                                {(proyecto.actividades_count || 0) > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {proyecto.actividades_count} actividades
                                  </span>
                                )}
                                {proyecto.objetivo_asociado && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Objetivo: {proyecto.objetivo_asociado}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {proyecto.institucion_nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {proyecto.planificador_nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {proyecto.presupuesto_total 
                              ? formatCurrency(proyecto.presupuesto_total)
                              : 'No definido'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(proyecto.estado)}`}>
                              {proyecto.estado.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {proyecto.estado === 'PENDIENTE' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => abrirModalRevision(proyecto)}
                                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors"
                                >
                                  ✅ Aprobar
                                </button>
                                <button
                                  onClick={() => abrirModalRevision(proyecto)}
                                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition-colors"
                                >
                                  ❌ Rechazar
                                </button>
                              </div>
                            )}
                            {proyecto.estado !== 'PENDIENTE' && (
                              <span className="text-sm text-gray-500">
                                {new Date(proyecto.fecha_envio).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal de Revisión */}
          {modalRevision.show && modalRevision.proyecto && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center mb-4">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                      formRevision.decision === 'APROBADO' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className="text-2xl">
                        {formRevision.decision === 'APROBADO' ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Revisar Proyecto
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Proyecto: "{modalRevision.proyecto.nombre}"
                      </p>
                    </div>
                    
                    {/* Selector de Decisión */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Decisión
                      </label>
                      <select
                        value={formRevision.decision}
                        onChange={(e) => setFormRevision(prev => ({ 
                          ...prev, 
                          decision: e.target.value as 'APROBADO' | 'RECHAZADO' 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="APROBADO">Aprobar</option>
                        <option value="RECHAZADO">Rechazar</option>
                      </select>
                    </div>

                    {/* Comentarios */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentarios {formRevision.decision === 'RECHAZADO' && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={formRevision.comentario}
                        onChange={(e) => setFormRevision(prev => ({ 
                          ...prev, 
                          comentario: e.target.value 
                        }))}
                        placeholder={`Comentarios de ${formRevision.decision === 'APROBADO' ? 'aprobación' : 'rechazo'}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                        required={formRevision.decision === 'RECHAZADO'}
                      />
                      {formRevision.decision === 'RECHAZADO' && (
                        <p className="text-xs text-red-500 mt-1">
                          Los comentarios son obligatorios para rechazos
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={cerrarModal}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={procesarRevision}
                      disabled={revisando === modalRevision.proyecto.id}
                      className={`px-4 py-2 rounded-md text-white transition-colors ${
                        formRevision.decision === 'APROBADO' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      } ${revisando === modalRevision.proyecto.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {revisando === modalRevision.proyecto.id ? 'Procesando...' : 
                       formRevision.decision === 'APROBADO' ? 'Aprobar' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ReviewerOnly>
    </ProtectedRoute>
  );
}
