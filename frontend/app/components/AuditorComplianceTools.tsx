'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface ComparativoPresupuestario {
  institucion: string;
  proyecto_codigo: string;
  proyecto_nombre: string;
  presupuesto_asignado: number;
  presupuesto_ejecutado: number;
  porcentaje_ejecucion: number;
  estado_proyecto: string;
  avance_fisico: number;
  diferencia_presupuestaria: number;
  alertas: string[];
}

interface ValidacionCumplimiento {
  objetivo_id: number;
  objetivo_codigo: string;
  objetivo_nombre: string;
  meta_planificada: number;
  meta_ejecutada: number;
  porcentaje_cumplimiento: number;
  periodo: string;
  estado_cumplimiento: 'OPTIMO' | 'ACEPTABLE' | 'DEFICIENTE' | 'CRITICO';
  observaciones: string;
}

interface AuditorComplianceToolsProps {
  className?: string;
}

/**
 * Herramientas específicas para AUDITOR
 * Comparar y validar avances presupuestarios y de planificación
 */
export default function AuditorComplianceTools({ className = "" }: AuditorComplianceToolsProps) {
  const { user, token } = useAuth();
  const [comparativoPresupuesto, setComparativoPresupuesto] = useState<ComparativoPresupuestario[]>([]);
  const [validacionesCumplimiento, setValidacionesCumplimiento] = useState<ValidacionCumplimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<'presupuestario' | 'cumplimiento'>('presupuestario');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [alertasPresupuestarias, setAlertasPresupuestarias] = useState<number>(0);

  useEffect(() => {
    if (user?.roles?.includes('AUDITOR')) {
      cargarDatosComparativos();
    }
  }, [user, filtroInstitucion, filtroPeriodo]);

  const cargarDatosComparativos = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filtroInstitucion) queryParams.append('institucion', filtroInstitucion);
      if (filtroPeriodo) queryParams.append('periodo', filtroPeriodo);

      // Cargar comparativo presupuestario
      const presupuestoResponse = await fetch(
        buildApiUrl(`/api/auditoria/comparativo-presupuestario?${queryParams.toString()}`), 
        { headers: buildHeaders(token) }
      );
      
      if (presupuestoResponse.ok) {
        const presupuestoData = await presupuestoResponse.json();
        setComparativoPresupuesto(presupuestoData.data || []);
        
        // Contar alertas presupuestarias
        const alertas = presupuestoData.data.filter((item: ComparativoPresupuestario) => 
          item.alertas && item.alertas.length > 0
        ).length;
        setAlertasPresupuestarias(alertas);
      }

      // Cargar validaciones de cumplimiento
      const cumplimientoResponse = await fetch(
        buildApiUrl(`/api/auditoria/validacion-cumplimiento?${queryParams.toString()}`), 
        { headers: buildHeaders(token) }
      );
      
      if (cumplimientoResponse.ok) {
        const cumplimientoData = await cumplimientoResponse.json();
        setValidacionesCumplimiento(cumplimientoData.data || []);
      }

    } catch (error) {
      console.error('Error cargando datos comparativos:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporteCompleto = async (tipo: 'presupuestario' | 'cumplimiento', formato: 'pdf' | 'excel') => {
    if (!token) return;
    
    try {
      const response = await fetch(buildApiUrl('/api/auditoria/exportar-comparativo'), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ 
          tipo, 
          formato, 
          filtros: { institucion: filtroInstitucion, periodo: filtroPeriodo }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `auditoria_${tipo}_${formato}_${new Date().toISOString().split('T')[0]}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exportando reporte:', error);
    }
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const getColorPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 90) return 'text-green-600 bg-green-100';
    if (porcentaje >= 70) return 'text-yellow-600 bg-yellow-100';
    if (porcentaje >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getColorCumplimiento = (estado: string) => {
    switch (estado) {
      case 'OPTIMO': return 'text-green-600 bg-green-100';
      case 'ACEPTABLE': return 'text-blue-600 bg-blue-100';
      case 'DEFICIENTE': return 'text-orange-600 bg-orange-100';
      case 'CRITICO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user?.roles?.includes('AUDITOR')) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header específico para Auditor */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                🕵️
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-red-900">
                Herramientas de Auditoría y Validación
              </h2>
              <p className="text-sm text-red-700">
                Comparación y validación de avances presupuestarios y de planificación
              </p>
            </div>
          </div>
          {alertasPresupuestarias > 0 && (
            <div className="flex items-center px-3 py-2 bg-red-100 rounded-lg">
              <span className="text-sm font-medium text-red-800">
                ⚠️ {alertasPresupuestarias} alertas presupuestarias
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institución
            </label>
            <select
              value={filtroInstitucion}
              onChange={(e) => setFiltroInstitucion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todas las instituciones</option>
              {/* Aquí se cargarían las instituciones disponibles */}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos los períodos</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="trimestre-actual">Trimestre Actual</option>
              <option value="semestre-actual">Semestre Actual</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => exportarReporteCompleto(vistaActiva, 'pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={() => exportarReporteCompleto(vistaActiva, 'excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              📊 Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setVistaActiva('presupuestario')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            vistaActiva === 'presupuestario'
              ? 'bg-white text-red-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💰 Comparativo Presupuestario
        </button>
        <button
          onClick={() => setVistaActiva('cumplimiento')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            vistaActiva === 'cumplimiento'
              ? 'bg-white text-red-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📈 Validación de Cumplimiento
        </button>
      </div>

      {/* Vista de Comparativo Presupuestario */}
      {vistaActiva === 'presupuestario' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Comparativo de Avances Presupuestarios
            </h3>
          </div>
          
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
                    Presupuesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ejecución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avance Físico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alertas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Cargando datos...
                      </div>
                    </td>
                  </tr>
                ) : comparativoPresupuesto.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No hay datos disponibles para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  comparativoPresupuesto.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.proyecto_codigo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.proyecto_nombre}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.institucion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Asignado: {formatearMonto(item.presupuesto_asignado)}</div>
                          <div>Ejecutado: {formatearMonto(item.presupuesto_ejecutado)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorPorcentaje(item.porcentaje_ejecucion)}`}>
                          {item.porcentaje_ejecucion.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorPorcentaje(item.avance_fisico)}`}>
                          {item.avance_fisico.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.alertas && item.alertas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.alertas.map((alerta, alertaIndex) => (
                              <span
                                key={alertaIndex}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
                                title={alerta}
                              >
                                ⚠️
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600">✅ Sin alertas</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista de Validación de Cumplimiento */}
      {vistaActiva === 'cumplimiento' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Validación de Cumplimiento de Objetivos
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objetivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cumplimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Cargando validaciones...
                      </div>
                    </td>
                  </tr>
                ) : validacionesCumplimiento.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No hay validaciones disponibles para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  validacionesCumplimiento.map((validacion, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {validacion.objetivo_codigo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {validacion.objetivo_nombre}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {validacion.periodo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Planificada: {validacion.meta_planificada}</div>
                          <div>Ejecutada: {validacion.meta_ejecutada}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorPorcentaje(validacion.porcentaje_cumplimiento)}`}>
                          {validacion.porcentaje_cumplimiento.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorCumplimiento(validacion.estado_cumplimiento)}`}>
                          {validacion.estado_cumplimiento}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={validacion.observaciones}>
                          {validacion.observaciones || 'Sin observaciones'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
