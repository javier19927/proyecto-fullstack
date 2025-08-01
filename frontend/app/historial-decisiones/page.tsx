'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import ProtectedRoute from '../components/ProtectedRoute';

interface DecisionHistorial {
  id: number;
  tipo: 'OBJETIVO' | 'PROYECTO' | 'PRESUPUESTO';
  elemento_id: number;
  elemento_nombre: string;
  elemento_codigo: string;
  accion: 'APROBADO' | 'RECHAZADO' | 'VALIDADO';
  fecha_decision: string;
  comentarios: string;
  revisor_nombre: string;
  institucion_nombre: string;
  planificador_nombre: string;
  monto?: number;
}

export default function HistorialDecisionesPage() {
  const { user, token } = useAuth();
  const [historial, setHistorial] = useState<DecisionHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filtros, setFiltros] = useState({
    tipo: '',
    accion: '',
    fecha_desde: '',
    fecha_hasta: '',
    institucion: ''
  });

  useEffect(() => {
    if (token && user) {
      cargarHistorial();
    }
  }, [token, user, filtros]);

  const cargarHistorial = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        buildApiUrl(`/api/decisiones/historial?${queryParams}`),
        { headers: buildHeaders(token) }
      );

      if (response.ok) {
        const data = await response.json();
        setHistorial(data.data || []);
      } else {
        setError('Error al cargar historial');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    return new Date(fechaStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMonto = (monto?: number) => {
    if (!monto) return '';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const obtenerIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'OBJETIVO':
        return '🎯';
      case 'PROYECTO':
        return '🏗️';
      case 'PRESUPUESTO':
        return '💰';
      default:
        return '📄';
    }
  };

  const obtenerColorAccion = (accion: string) => {
    switch (accion) {
      case 'APROBADO':
      case 'VALIDADO':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const esRevisor = user?.roles?.includes('REVISOR');
  const esValidador = user?.roles?.includes('VALID');
  const tieneAcceso = esRevisor || esValidador;

  if (!tieneAcceso) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
            <p className="text-gray-600">
              Solo revisores institucionales y autoridades validadoras pueden acceder al historial de decisiones.
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
          <div className={`border rounded-lg p-4 ${
            esRevisor ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  esRevisor ? 'bg-purple-100' : 'bg-orange-100'
                }`}>
                  {esRevisor ? '🧑‍⚖' : '🧑‍⚖'}
                </div>
              </div>
              <div className="ml-4">
                <h1 className={`text-2xl font-bold ${
                  esRevisor ? 'text-purple-900' : 'text-orange-900'
                }`}>
                  📜 Historial de Decisiones
                </h1>
                <p className={`text-sm ${
                  esRevisor ? 'text-purple-700' : 'text-orange-700'
                }`}>
                  {esRevisor 
                    ? 'Historial de revisiones de proyectos y presupuestos'
                    : 'Historial de validaciones de objetivos estratégicos'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros de Búsqueda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Elemento
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="OBJETIVO">🎯 Objetivos</option>
                <option value="PROYECTO">🏗️ Proyectos</option>
                <option value="PRESUPUESTO">💰 Presupuestos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acción
              </label>
              <select
                value={filtros.accion}
                onChange={(e) => setFiltros(prev => ({ ...prev, accion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las acciones</option>
                <option value="APROBADO">✅ Aprobado</option>
                <option value="VALIDADO">✅ Validado</option>
                <option value="RECHAZADO">❌ Rechazado</option>
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
                Institución
              </label>
              <input
                type="text"
                value={filtros.institucion}
                onChange={(e) => setFiltros(prev => ({ ...prev, institucion: e.target.value }))}
                placeholder="Filtrar por institución"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setFiltros({
                tipo: '',
                accion: '',
                fecha_desde: '',
                fecha_hasta: '',
                institucion: ''
              })}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              🗑️ Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Lista de historial */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              📋 Decisiones Registradas
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {historial.length}
              </span>
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Cargando historial...
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600">
                <div className="text-4xl mb-2">❌</div>
                <p>{error}</p>
              </div>
            ) : historial.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No se encontraron decisiones con los filtros aplicados</p>
              </div>
            ) : (
              historial.map((decision) => (
                <div key={decision.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{obtenerIconoTipo(decision.tipo)}</span>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {decision.elemento_codigo}
                          </h4>
                          <p className="text-sm text-gray-600">{decision.elemento_nombre}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorAccion(decision.accion)}`}>
                          {decision.accion}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-500">Revisor/Validador:</span>
                          <br />
                          <span className="text-gray-900">{decision.revisor_nombre}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Institución:</span>
                          <br />
                          <span className="text-gray-900">{decision.institucion_nombre}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Planificador:</span>
                          <br />
                          <span className="text-gray-900">{decision.planificador_nombre}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-500">Fecha de Decisión:</span>
                          <br />
                          <span className="text-gray-900">{formatearFecha(decision.fecha_decision)}</span>
                        </div>
                        {decision.monto && (
                          <div>
                            <span className="font-medium text-gray-500">Monto:</span>
                            <br />
                            <span className="text-gray-900 font-bold">{formatearMonto(decision.monto)}</span>
                          </div>
                        )}
                      </div>

                      {decision.comentarios && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <span className="font-medium text-gray-500 text-sm">Observaciones:</span>
                          <p className="text-gray-700 text-sm mt-1">{decision.comentarios}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Estadísticas del historial */}
        {historial.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {historial.filter(h => ['APROBADO', 'VALIDADO'].includes(h.accion)).length}
                </div>
                <div className="text-sm text-gray-600">Aprobados/Validados</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {historial.filter(h => h.accion === 'RECHAZADO').length}
                </div>
                <div className="text-sm text-gray-600">Rechazados</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(historial.map(h => h.institucion_nombre)).size}
                </div>
                <div className="text-sm text-gray-600">Instituciones</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {historial.filter(h => h.monto).reduce((sum, h) => sum + (h.monto || 0), 0) > 0 
                    ? formatearMonto(historial.filter(h => h.monto).reduce((sum, h) => sum + (h.monto || 0), 0))
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-gray-600">Monto Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
