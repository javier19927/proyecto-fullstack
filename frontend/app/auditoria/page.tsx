'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorHandler from '../components/ErrorHandler';
import ProtectedRoute from '../components/ProtectedRoute';
import AuditorComplianceTools from '../components/AuditorComplianceTools';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface EventoAuditoria {
  id: number;
  accion: string;
  modulo: string;
  tabla_afectada: string;
  registro_id: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_email: string;
  ip_address: string;
  user_agent: string;
  datos_anteriores?: string;
  datos_nuevos?: string;
  timestamp: string;
  resultado: 'EXITOSO' | 'FALLIDO';
  detalles?: string;
}

interface EstadisticasAuditoria {
  total_eventos: number;
  eventos_por_usuario: Record<string, number>;
  eventos_por_modulo: Record<string, number>;
  eventos_por_accion: Record<string, number>;
  eventos_recientes: number;
  usuarios_activos: number;
}

interface FiltrosAuditoria {
  usuario_id?: string;
  modulo?: string;
  accion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  ip_address?: string;
  resultado?: string;
}

export default function AuditoriaPage() {
  const { user, token } = useAuth();
  const { error, errorType, handleError, clearError } = useErrorHandler();
  
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAuditoria | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({});
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoAuditoria | null>(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Construir query params para filtros
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      // Cargar eventos de auditoría
      const eventosUrl = `/api/auditoria/eventos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const eventosResponse = await fetch(
        buildApiUrl(eventosUrl), 
        { headers: buildHeaders(token) }
      );
      
      if (eventosResponse.ok) {
        const eventosData = await eventosResponse.json();
        setEventos(eventosData.data || []);
      }

      // Cargar estadísticas
      const statsResponse = await fetch(
        buildApiUrl('/api/auditoria/estadisticas'), 
        { headers: buildHeaders(token) }
      );
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setEstadisticas(statsData.data);
      }

    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporteAuditoria = async (formato: 'pdf' | 'excel') => {
    if (!token) return;
    
    try {
      const response = await fetch(buildApiUrl('/api/auditoria/exportar'), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ formato, filtros }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `auditoria_${formato}_${new Date().toISOString().split('T')[0]}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const abrirDetalle = (evento: EventoAuditoria) => {
    setEventoSeleccionado(evento);
    setModalDetalle(true);
  };

  if (!user || !user.roles.includes('AUDITOR')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              Solo los usuarios con rol de <strong>Auditor</strong> pueden acceder a este módulo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <ErrorHandler error={error} />
      )}
        
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                🕵️ Módulo 5: Auditoría y Trazabilidad
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Supervisión del uso del sistema, revisión de actividades institucionales y validación del cumplimiento
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => exportarReporteAuditoria('pdf')}
                className="btn-secondary"
                disabled={loading}
              >
                📄 Exportar PDF
              </button>
              <button
                onClick={() => exportarReporteAuditoria('excel')}
                className="btn-secondary"
                disabled={loading}
              >
                📊 Exportar Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Herramientas específicas de Auditor */}
        <AuditorComplianceTools className="mb-8" />

        {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      📊
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Eventos</p>
                    <p className="text-2xl font-semibold text-gray-900">{estadisticas.total_eventos}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      👥
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
                    <p className="text-2xl font-semibold text-gray-900">{estadisticas.usuarios_activos}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      ⏰
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Eventos Recientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{estadisticas.eventos_recientes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                      🔍
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Módulos Auditados</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Object.keys(estadisticas.eventos_por_modulo).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Filtros de Auditoría</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Módulo
                  </label>
                  <select
                    value={filtros.modulo || ''}
                    onChange={(e) => setFiltros({ ...filtros, modulo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todos los módulos</option>
                    <option value="configuracion">Configuración</option>
                    <option value="objetivos">Objetivos</option>
                    <option value="proyectos">Proyectos</option>
                    <option value="reportes">Reportes</option>
                    <option value="usuarios">Usuarios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acción
                  </label>
                  <select
                    value={filtros.accion || ''}
                    onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todas las acciones</option>
                    <option value="crear">Crear</option>
                    <option value="editar">Editar</option>
                    <option value="eliminar">Eliminar</option>
                    <option value="validar">Validar</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resultado
                  </label>
                  <select
                    value={filtros.resultado || ''}
                    onChange={(e) => setFiltros({ ...filtros, resultado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todos los resultados</option>
                    <option value="EXITOSO">Exitoso</option>
                    <option value="FALLIDO">Fallido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fecha_inicio || ''}
                    onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Eventos */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Registro de Eventos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resultado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Cargando eventos de auditoría...
                      </td>
                    </tr>
                  ) : eventos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron eventos de auditoría
                      </td>
                    </tr>
                  ) : (
                    eventos.map((evento) => (
                      <tr key={evento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(evento.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{evento.usuario_nombre}</div>
                            <div className="text-gray-500">{evento.usuario_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {evento.modulo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {evento.accion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            evento.resultado === 'EXITOSO' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {evento.resultado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {evento.ip_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => abrirDetalle(evento)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de Detalle */}
        {modalDetalle && eventoSeleccionado && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Detalle del Evento
                  </h3>
                  <button
                    onClick={() => setModalDetalle(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID del Evento</label>
                    <p className="text-sm text-gray-900">{eventoSeleccionado.id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Acción</label>
                    <p className="text-sm text-gray-900">{eventoSeleccionado.accion}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tabla Afectada</label>
                    <p className="text-sm text-gray-900">{eventoSeleccionado.tabla_afectada}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Agent</label>
                    <p className="text-sm text-gray-900 break-words">{eventoSeleccionado.user_agent}</p>
                  </div>
                  
                  {eventoSeleccionado.datos_anteriores && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Datos Anteriores</label>
                      <pre className="text-xs text-gray-900 bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(JSON.parse(eventoSeleccionado.datos_anteriores), null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {eventoSeleccionado.datos_nuevos && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Datos Nuevos</label>
                      <pre className="text-xs text-gray-900 bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(JSON.parse(eventoSeleccionado.datos_nuevos), null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {eventoSeleccionado.detalles && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Detalles</label>
                      <p className="text-sm text-gray-900">{eventoSeleccionado.detalles}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => setModalDetalle(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
