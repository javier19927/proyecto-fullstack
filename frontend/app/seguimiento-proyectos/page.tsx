'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import ProtectedRoute from '../components/ProtectedRoute';

interface ProyectoSeguimiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: 'BORRADOR' | 'ENVIADO' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO';
  presupuesto_total: number;
  presupuesto_aprobado?: number;
  fecha_creacion: string;
  fecha_envio?: string;
  fecha_revision?: string;
  institucion_nombre: string;
  planificador_nombre: string;
  revisor_nombre?: string;
  objetivo_estrategico: string;
  avance_porcentaje: number;
  comentarios_revision?: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  tipo_proyecto: string;
}

export default function SeguimientoProyectosPage() {
  const { user, token } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoSeguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filtros, setFiltros] = useState({
    estado: '',
    prioridad: '',
    fecha_desde: '',
    fecha_hasta: '',
    busqueda: ''
  });
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoSeguimiento | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (token && user) {
      cargarProyectos();
    }
  }, [token, user, filtros]);

  const cargarProyectos = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        buildApiUrl(`/api/proyectos/seguimiento?${queryParams}`),
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

  const actualizarAvance = async (proyectoId: number, nuevoAvance: number) => {
    if (!token) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/proyectos/${proyectoId}/avance`),
        {
          method: 'PUT',
          headers: buildHeaders(token),
          body: JSON.stringify({ avance_porcentaje: nuevoAvance })
        }
      );

      if (response.ok) {
        setProyectos(prev => prev.map(p => 
          p.id === proyectoId 
            ? { ...p, avance_porcentaje: nuevoAvance }
            : p
        ));
      } else {
        setError('Error al actualizar avance');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    }
  };

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'N/A';
    return new Date(fechaStr).toLocaleDateString('es-ES', {
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

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'BORRADOR':
        return 'bg-gray-100 text-gray-800';
      case 'ENVIADO':
        return 'bg-blue-100 text-blue-800';
      case 'EN_REVISION':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROBADO':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const obtenerColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA':
        return 'bg-red-100 text-red-800';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800';
      case 'BAJA':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'BORRADOR':
        return '📝';
      case 'ENVIADO':
        return '📤';
      case 'EN_REVISION':
        return '🔍';
      case 'APROBADO':
        return '✅';
      case 'RECHAZADO':
        return '❌';
      default:
        return '📄';
    }
  };

  const esPlanificador = user?.roles?.includes('PLANIF');

  if (!esPlanificador) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
            <p className="text-gray-600">
              Solo planificadores institucionales pueden acceder al seguimiento de proyectos.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  📊
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-blue-900">
                  📈 Seguimiento de Proyectos
                </h1>
                <p className="text-sm text-blue-700">
                  Monitoreo y gestión de proyectos de inversión
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {proyectos.length}
              </div>
              <div className="text-sm text-gray-600">Total Proyectos</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {proyectos.filter(p => p.estado === 'APROBADO').length}
              </div>
              <div className="text-sm text-gray-600">Aprobados</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {proyectos.filter(p => p.estado === 'EN_REVISION').length}
              </div>
              <div className="text-sm text-gray-600">En Revisión</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {proyectos.filter(p => p.estado === 'RECHAZADO').length}
              </div>
              <div className="text-sm text-gray-600">Rechazados</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {proyectos.length > 0 
                  ? Math.round(proyectos.reduce((sum, p) => sum + p.avance_porcentaje, 0) / proyectos.length)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Avance Promedio</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros de Búsqueda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="BORRADOR">📝 Borrador</option>
                <option value="ENVIADO">📤 Enviado</option>
                <option value="EN_REVISION">🔍 En Revisión</option>
                <option value="APROBADO">✅ Aprobado</option>
                <option value="RECHAZADO">❌ Rechazado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                value={filtros.prioridad}
                onChange={(e) => setFiltros(prev => ({ ...prev, prioridad: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las prioridades</option>
                <option value="ALTA">🔴 Alta</option>
                <option value="MEDIA">🟡 Media</option>
                <option value="BAJA">🟢 Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_desde: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_hasta: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                placeholder="Código o nombre del proyecto"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setFiltros({
                estado: '',
                prioridad: '',
                fecha_desde: '',
                fecha_hasta: '',
                busqueda: ''
              })}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              🗑️ Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Lista de proyectos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              🏗️ Proyectos en Seguimiento
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {proyectos.length}
              </span>
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Cargando proyectos...
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600">
                <div className="text-4xl mb-2">❌</div>
                <p>{error}</p>
              </div>
            ) : proyectos.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">🏗️</div>
                <p>No se encontraron proyectos con los filtros aplicados</p>
              </div>
            ) : (
              proyectos.map((proyecto) => (
                <div key={proyecto.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{obtenerIconoEstado(proyecto.estado)}</span>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {proyecto.codigo}
                          </h4>
                          <p className="text-sm text-gray-600">{proyecto.nombre}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado(proyecto.estado)}`}>
                            {proyecto.estado.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorPrioridad(proyecto.prioridad)}`}>
                            {proyecto.prioridad}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-500">Presupuesto Total:</span>
                          <br />
                          <span className="text-gray-900 font-bold">{formatearMonto(proyecto.presupuesto_total)}</span>
                          {proyecto.presupuesto_aprobado && (
                            <>
                              <br />
                              <span className="text-xs text-green-600">
                                Aprobado: {formatearMonto(proyecto.presupuesto_aprobado)}
                              </span>
                            </>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Objetivo Estratégico:</span>
                          <br />
                          <span className="text-gray-900">{proyecto.objetivo_estrategico}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Tipo de Proyecto:</span>
                          <br />
                          <span className="text-gray-900">{proyecto.tipo_proyecto}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-500">Fecha Creación:</span>
                          <br />
                          <span className="text-gray-900">{formatearFecha(proyecto.fecha_creacion)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Fecha Envío:</span>
                          <br />
                          <span className="text-gray-900">{formatearFecha(proyecto.fecha_envio)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Fecha Revisión:</span>
                          <br />
                          <span className="text-gray-900">{formatearFecha(proyecto.fecha_revision)}</span>
                        </div>
                      </div>

                      {/* Barra de avance */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-500">Avance del Proyecto</span>
                          <span className="text-gray-900 font-bold">{proyecto.avance_porcentaje}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${proyecto.avance_porcentaje}%` }}
                          ></div>
                        </div>
                      </div>

                      {proyecto.revisor_nombre && (
                        <div className="text-sm mb-2">
                          <span className="font-medium text-gray-500">Revisor Asignado:</span>
                          <span className="text-gray-900 ml-2">{proyecto.revisor_nombre}</span>
                        </div>
                      )}

                      {proyecto.comentarios_revision && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <span className="font-medium text-gray-500 text-sm">Comentarios de Revisión:</span>
                          <p className="text-gray-700 text-sm mt-1">{proyecto.comentarios_revision}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => {
                          setProyectoSeleccionado(proyecto);
                          setMostrarModal(true);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                      >
                        📊 Ver Detalles
                      </button>
                      
                      {proyecto.estado === 'APROBADO' && (
                        <button
                          onClick={() => {
                            const nuevoAvance = prompt(
                              `Ingrese el nuevo porcentaje de avance (actual: ${proyecto.avance_porcentaje}%):`,
                              proyecto.avance_porcentaje.toString()
                            );
                            if (nuevoAvance && !isNaN(Number(nuevoAvance))) {
                              const avance = Math.max(0, Math.min(100, Number(nuevoAvance)));
                              actualizarAvance(proyecto.id, avance);
                            }
                          }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                        >
                          📈 Actualizar Avance
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal de detalles */}
        {mostrarModal && proyectoSeleccionado && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    📊 Detalles del Proyecto
                  </h3>
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Información Básica</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Código:</span>
                        <span className="ml-2 text-gray-900">{proyectoSeleccionado.codigo}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Nombre:</span>
                        <span className="ml-2 text-gray-900">{proyectoSeleccionado.nombre}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Descripción:</span>
                        <p className="text-gray-900 mt-1">{proyectoSeleccionado.descripcion}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Estado:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${obtenerColorEstado(proyectoSeleccionado.estado)}`}>
                          {proyectoSeleccionado.estado.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Prioridad:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${obtenerColorPrioridad(proyectoSeleccionado.prioridad)}`}>
                          {proyectoSeleccionado.prioridad}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Información Financiera</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Presupuesto Total:</span>
                        <span className="ml-2 text-gray-900 font-bold">{formatearMonto(proyectoSeleccionado.presupuesto_total)}</span>
                      </div>
                      {proyectoSeleccionado.presupuesto_aprobado && (
                        <div>
                          <span className="font-medium text-gray-500">Presupuesto Aprobado:</span>
                          <span className="ml-2 text-green-600 font-bold">{formatearMonto(proyectoSeleccionado.presupuesto_aprobado)}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-500">Avance:</span>
                        <span className="ml-2 text-gray-900 font-bold">{proyectoSeleccionado.avance_porcentaje}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Fechas Importantes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Fecha de Creación:</span>
                      <br />
                      <span className="text-gray-900">{formatearFecha(proyectoSeleccionado.fecha_creacion)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Fecha de Envío:</span>
                      <br />
                      <span className="text-gray-900">{formatearFecha(proyectoSeleccionado.fecha_envio)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Fecha de Revisión:</span>
                      <br />
                      <span className="text-gray-900">{formatearFecha(proyectoSeleccionado.fecha_revision)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Responsables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Institución:</span>
                      <br />
                      <span className="text-gray-900">{proyectoSeleccionado.institucion_nombre}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Planificador:</span>
                      <br />
                      <span className="text-gray-900">{proyectoSeleccionado.planificador_nombre}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Revisor:</span>
                      <br />
                      <span className="text-gray-900">{proyectoSeleccionado.revisor_nombre || 'No asignado'}</span>
                    </div>
                  </div>
                </div>

                {proyectoSeleccionado.comentarios_revision && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Comentarios de Revisión</h4>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-700 text-sm">{proyectoSeleccionado.comentarios_revision}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
