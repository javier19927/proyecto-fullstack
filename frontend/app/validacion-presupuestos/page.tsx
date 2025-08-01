'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import ValidatorOnly from '../components/ValidatorOnly';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface Presupuesto {
  id: number;
  institucion_id: number;
  institucion_nombre: string;
  ejercicio_fiscal: number;
  monto_total: number;
  moneda: string;
  estado: 'DRAFT' | 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO';
  fecha_creacion: string;
  fecha_validacion?: string;
  validado_por_nombre?: string;
  comentarios_validacion?: string;
  detalles?: {
    programa: string;
    actividad: string;
    monto: number;
  }[];
}

interface ValidacionPresupuestoData {
  decision: 'VALIDADO' | 'RECHAZADO';
  comentario: string;
}

export default function ValidacionPresupuestosPage() {
  const { user, token } = useAuth();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [validando, setValidando] = useState<number | null>(null);
  const [modalValidacion, setModalValidacion] = useState<{ 
    show: boolean; 
    presupuesto: Presupuesto | null;
  }>({
    show: false,
    presupuesto: null
  });
  const [formValidacion, setFormValidacion] = useState<ValidacionPresupuestoData>({
    decision: 'VALIDADO',
    comentario: ''
  });
  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'validados'>('pendientes');

  useEffect(() => {
    if (token && user) {
      cargarPresupuestos();
    }
  }, [token, user, filter]);

  const cargarPresupuestos = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const endpoint = filter === 'todos'
        ? '/api/presupuestos/validacion/todos'
        : filter === 'pendientes'
          ? '/api/presupuestos/pendientes-validacion'
          : '/api/presupuestos/validacion/historial';

      const response = await fetch(
        buildApiUrl(endpoint),
        { headers: buildHeaders(token) }
      );

      if (response.ok) {
        const data = await response.json();
        setPresupuestos(data.data || []);
      } else {
        setError('Error al cargar presupuestos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalValidacion = (presupuesto: Presupuesto) => {
    setModalValidacion({ show: true, presupuesto });
    setFormValidacion({ decision: 'VALIDADO', comentario: '' });
  };

  const cerrarModal = () => {
    setModalValidacion({ show: false, presupuesto: null });
    setFormValidacion({ decision: 'VALIDADO', comentario: '' });
  };

  const procesarValidacion = async () => {
    if (!modalValidacion.presupuesto) return;

    // Validar que se proporcione comentario para rechazos
    if (formValidacion.decision === 'RECHAZADO' && !formValidacion.comentario.trim()) {
      alert('Debe proporcionar un comentario para el rechazo');
      return;
    }

    setValidando(modalValidacion.presupuesto.id);

    try {
      const response = await fetch(
        buildApiUrl(`/api/presupuestos/${modalValidacion.presupuesto.id}/validar`),
        {
          method: 'POST',
          headers: buildHeaders(token!),
          body: JSON.stringify({
            decision: formValidacion.decision,
            comentario: formValidacion.comentario,
            validado_por: user?.id
          })
        }
      );

      if (response.ok) {
        await cargarPresupuestos();
        cerrarModal();
        
        const mensaje = formValidacion.decision === 'VALIDADO' ? 'validado' : 'rechazado';
        alert(`Presupuesto ${mensaje} exitosamente`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error al validar presupuesto:', error);
      alert('Error al procesar la validación');
    } finally {
      setValidando(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDIENTE_VALIDACION': 'bg-yellow-100 text-yellow-800',
      'VALIDADO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800'
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-700"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ValidatorOnly>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    🧑‍⚖ Validación de Presupuestos
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Validar presupuestos institucionales presentados para aprobación
                  </p>
                </div>
                <div className="flex space-x-3">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                  >
                    <option value="pendientes">Pendientes</option>
                    <option value="validados">Validados</option>
                    <option value="todos">Todos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">⏳</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Pendientes de Validación
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {presupuestos.filter(p => p.estado === 'PENDIENTE_VALIDACION').length}
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
                      <div className="text-2xl">✅</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Validados
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {presupuestos.filter(p => p.estado === 'VALIDADO').length}
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
                      <div className="text-2xl">❌</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Rechazados
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {presupuestos.filter(p => p.estado === 'RECHAZADO').length}
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
                      <div className="text-2xl">💰</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Monto Total Validado
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(
                            presupuestos
                              .filter(p => p.estado === 'VALIDADO')
                              .reduce((sum, p) => sum + p.monto_total, 0)
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400">❌</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Presupuestos */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Presupuestos para Validación
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Lista de presupuestos institucionales que requieren validación
                </p>
              </div>

              {presupuestos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay presupuestos para mostrar
                  </h3>
                  <p className="text-gray-500">
                    {filter === 'pendientes' 
                      ? 'No hay presupuestos pendientes de validación.'
                      : 'No se encontraron presupuestos con el filtro seleccionado.'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Institución
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ejercicio Fiscal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Creación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {presupuestos.map((presupuesto) => (
                        <tr key={presupuesto.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {presupuesto.institucion_nombre}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {presupuesto.ejercicio_fiscal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(presupuesto.monto_total)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(presupuesto.estado)}`}>
                              {presupuesto.estado.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(presupuesto.fecha_creacion).toLocaleDateString('es-BO')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {presupuesto.estado === 'PENDIENTE_VALIDACION' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => abrirModalValidacion(presupuesto)}
                                  disabled={validando === presupuesto.id}
                                  className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                  {validando === presupuesto.id ? 'Procesando...' : 'Validar'}
                                </button>
                              </div>
                            )}
                            {presupuesto.estado !== 'PENDIENTE_VALIDACION' && (
                              <div className="text-sm text-gray-500">
                                {presupuesto.estado === 'VALIDADO' && (
                                  <span className="text-green-600">✅ Validado</span>
                                )}
                                {presupuesto.estado === 'RECHAZADO' && (
                                  <span className="text-red-600">❌ Rechazado</span>
                                )}
                                {presupuesto.fecha_validacion && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {new Date(presupuesto.fecha_validacion).toLocaleDateString('es-BO')}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal de Validación */}
            {modalValidacion.show && modalValidacion.presupuesto && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex items-center mb-4">
                      <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                        formValidacion.decision === 'VALIDADO' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className="text-2xl">
                          {formValidacion.decision === 'VALIDADO' ? '✅' : '❌'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Validar Presupuesto
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Institución: "{modalValidacion.presupuesto.institucion_nombre}"
                        </p>
                        <p className="text-sm text-gray-500">
                          Monto: {formatCurrency(modalValidacion.presupuesto.monto_total)}
                        </p>
                      </div>
                      
                      {/* Selector de Decisión */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Decisión
                        </label>
                        <select
                          value={formValidacion.decision}
                          onChange={(e) => setFormValidacion(prev => ({ 
                            ...prev, 
                            decision: e.target.value as 'VALIDADO' | 'RECHAZADO' 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="VALIDADO">Validar</option>
                          <option value="RECHAZADO">Rechazar</option>
                        </select>
                      </div>

                      {/* Comentarios */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comentarios {formValidacion.decision === 'RECHAZADO' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                          value={formValidacion.comentario}
                          onChange={(e) => setFormValidacion(prev => ({ 
                            ...prev, 
                            comentario: e.target.value 
                          }))}
                          placeholder={`Comentarios de ${formValidacion.decision === 'VALIDADO' ? 'validación' : 'rechazo'}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={3}
                          required={formValidacion.decision === 'RECHAZADO'}
                        />
                        {formValidacion.decision === 'RECHAZADO' && (
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
                        onClick={procesarValidacion}
                        disabled={validando === modalValidacion.presupuesto.id}
                        className={`px-4 py-2 rounded-md text-white transition-colors ${
                          formValidacion.decision === 'VALIDADO' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        } ${validando === modalValidacion.presupuesto.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {validando === modalValidacion.presupuesto.id ? 'Procesando...' : 
                         formValidacion.decision === 'VALIDADO' ? 'Validar' : 'Rechazar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ValidatorOnly>
    </ProtectedRoute>
  );
}
