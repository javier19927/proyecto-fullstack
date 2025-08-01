'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import ProtectedRoute from '../components/ProtectedRoute';
import { PlanifierOnly } from '../components/PermissionGate';

interface PNDObjective {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
}

interface ODSGoal {
  id: number;
  nombre: string;
  descripcion: string;
  metas: Array<{ id: string; descripcion: string }>;
}

interface Objetivo {
  id: number;
  nombre: string;
  descripcion: string;
  institucion_nombre: string;
  estado: string;
  alineacion_pnd: string | null;
  alineacion_ods: number | null;
  meta_ods: string | null;
}

export default function AlineacionPNDODSPage() {
  const { user, token } = useAuth();
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [pndObjectives, setPndObjectives] = useState<PNDObjective[]>([]);
  const [odsGoals, setOdsGoals] = useState<ODSGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedObjetivo, setSelectedObjetivo] = useState<Objetivo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [alignmentData, setAlignmentData] = useState({
    pnd_objetivo: '',
    ods_objetivo: 0,
    ods_meta: '',
    justificacion: ''
  });

  useEffect(() => {
    if (token && user) {
      loadData();
    }
  }, [token, user]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [objetivosRes, pndRes, odsRes] = await Promise.all([
        fetch(buildApiUrl('/api/objetivos/mis-objetivos'), {
          headers: buildHeaders(token)
        }),
        fetch(buildApiUrl('/api/alineacion/pnd'), {
          headers: buildHeaders(token)
        }),
        fetch(buildApiUrl('/api/alineacion/ods'), {
          headers: buildHeaders(token)
        })
      ]);

      if (objetivosRes.ok) {
        const data = await objetivosRes.json();
        setObjetivos(data.data || []);
      }

      if (pndRes.ok) {
        const data = await pndRes.json();
        setPndObjectives(data.data || []);
      }

      if (odsRes.ok) {
        const data = await odsRes.json();
        setOdsGoals(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAlineacion = (objetivo: Objetivo) => {
    setSelectedObjetivo(objetivo);
    setAlignmentData({
      pnd_objetivo: objetivo.alineacion_pnd || '',
      ods_objetivo: objetivo.alineacion_ods || 0,
      ods_meta: objetivo.meta_ods || '',
      justificacion: ''
    });
    setShowModal(true);
  };

  const saveAlignment = async () => {
    if (!selectedObjetivo || !token) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/objetivos/${selectedObjetivo.id}/alineacion`),
        {
          method: 'POST',
          headers: buildHeaders(token),
          body: JSON.stringify(alignmentData)
        }
      );

      if (response.ok) {
        await loadData(); // Recargar datos
        setShowModal(false);
        setSelectedObjetivo(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar alineación');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    }
  };

  const getAlignmentStatus = (objetivo: Objetivo) => {
    if (objetivo.alineacion_pnd && objetivo.alineacion_ods) {
      return { status: 'completa', color: 'bg-green-100 text-green-800', text: 'Alineación Completa' };
    } else if (objetivo.alineacion_pnd || objetivo.alineacion_ods) {
      return { status: 'parcial', color: 'bg-yellow-100 text-yellow-800', text: 'Alineación Parcial' };
    } else {
      return { status: 'sin_alinear', color: 'bg-red-100 text-red-800', text: 'Sin Alineación' };
    }
  };

  const selectedODS = odsGoals.find(ods => ods.id === alignmentData.ods_objetivo);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando herramientas de alineación...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PlanifierOnly>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    🌐 Alineación PND/ODS
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Alinear objetivos estratégicos al Plan Nacional de Desarrollo y Objetivos de Desarrollo Sostenible
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                  <p className="text-sm text-green-600">Técnico Planificador</p>
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

            {/* Estadísticas de Alineación */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Alineación Completa</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {objetivos.filter(obj => obj.alineacion_pnd && obj.alineacion_ods).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Alineación Parcial</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {objetivos.filter(obj => (obj.alineacion_pnd || obj.alineacion_ods) && !(obj.alineacion_pnd && obj.alineacion_ods)).length}
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
                    <p className="text-sm font-medium text-gray-600">Sin Alineación</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {objetivos.filter(obj => !obj.alineacion_pnd && !obj.alineacion_ods).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Objetivos</p>
                    <p className="text-2xl font-bold text-gray-900">{objetivos.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Marcos de Referencia */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🇧🇴 Plan Nacional de Desarrollo (PND)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  El PND establece los pilares fundamentales para el desarrollo del país. Alinea tus objetivos
                  con las prioridades nacionales.
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Categorías disponibles:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Array.from(new Set(pndObjectives.map(p => p.categoria))).map(categoria => (
                        <span key={categoria} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {categoria}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🌍 Objetivos de Desarrollo Sostenible (ODS)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Los ODS son un llamado universal para poner fin a la pobreza, proteger el planeta
                  y garantizar la paz y prosperidad.
                </p>
                <div className="text-sm">
                  <span className="font-medium">17 Objetivos disponibles</span>
                  <div className="mt-1 text-xs text-gray-500">
                    Cada ODS tiene metas específicas que puedes seleccionar para una alineación más precisa.
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Objetivos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Gestión de Alineación de Objetivos Estratégicos
                </h2>
              </div>

              {objetivos.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl">🎯</span>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No tienes objetivos registrados
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Primero debes crear objetivos estratégicos para poder alinearlos
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Objetivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado Alineación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PND
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ODS
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {objetivos.map((objetivo) => {
                        const alignmentStatus = getAlignmentStatus(objetivo);
                        return (
                          <tr key={objetivo.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {objetivo.nombre}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {objetivo.descripcion}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {objetivo.institucion_nombre}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alignmentStatus.color}`}>
                                {alignmentStatus.text}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {objetivo.alineacion_pnd ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {objetivo.alineacion_pnd}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">No definido</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {objetivo.alineacion_ods ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    ODS {objetivo.alineacion_ods}
                                  </span>
                                  {objetivo.meta_ods && (
                                    <div className="text-xs text-gray-500">
                                      Meta: {objetivo.meta_ods}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">No definido</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleAlineacion(objetivo)}
                                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors"
                              >
                                🌐 {objetivo.alineacion_pnd || objetivo.alineacion_ods ? 'Editar' : 'Alinear'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal de Alineación */}
          {showModal && selectedObjetivo && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Alineación PND/ODS: {selectedObjetivo.nombre}
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Alineación PND */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🇧🇴 Plan Nacional de Desarrollo
                      </label>
                      <select
                        value={alignmentData.pnd_objetivo}
                        onChange={(e) => setAlignmentData({...alignmentData, pnd_objetivo: e.target.value})}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Seleccionar objetivo PND</option>
                        {pndObjectives.map((pnd) => (
                          <option key={pnd.id} value={pnd.id}>
                            {pnd.categoria} - {pnd.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Alineación ODS */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🌍 Objetivos de Desarrollo Sostenible
                      </label>
                      <select
                        value={alignmentData.ods_objetivo}
                        onChange={(e) => setAlignmentData({...alignmentData, ods_objetivo: parseInt(e.target.value), ods_meta: ''})}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      >
                        <option value={0}>Seleccionar ODS</option>
                        {odsGoals.map((ods) => (
                          <option key={ods.id} value={ods.id}>
                            ODS {ods.id}: {ods.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Meta ODS */}
                  {selectedODS && selectedODS.metas.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Específica del ODS {selectedODS.id}
                      </label>
                      <select
                        value={alignmentData.ods_meta}
                        onChange={(e) => setAlignmentData({...alignmentData, ods_meta: e.target.value})}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Seleccionar meta específica (opcional)</option>
                        {selectedODS.metas.map((meta) => (
                          <option key={meta.id} value={meta.id}>
                            {meta.id}: {meta.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Justificación */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Justificación de la Alineación
                    </label>
                    <textarea
                      value={alignmentData.justificacion}
                      onChange={(e) => setAlignmentData({...alignmentData, justificacion: e.target.value})}
                      placeholder="Explica por qué este objetivo se alinea con los marcos seleccionados..."
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveAlignment}
                      disabled={!alignmentData.pnd_objetivo && !alignmentData.ods_objetivo}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Guardar Alineación
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PlanifierOnly>
    </ProtectedRoute>
  );
}
