'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG } from '../utils/apiConfig';

interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  responsable?: string;
  area?: string;
  institucion?: string;
  tipo?: string;
  ano?: string;
  rolCreador?: string;
  rolValidador?: string;
}

interface ObjetivoEstrategico {
  id: number;
  codigo: string;
  descripcion: string;
  institucion_nombre: string;
  estado: 'Borrador' | 'Enviado' | 'Validado' | 'Rechazado';
  alineacion_pnd: string;
  alineacion_ods: string;
  metas: string;
  indicadores: string;
  area_responsable: string;
  fecha_registro: string;
  fecha_validacion?: string;
  usuario_creador: string;
  usuario_validador?: string;
}

interface ProyectoInversion {
  id: number;
  codigo: string;
  nombre: string;
  institucion_nombre: string;
  estado: 'Borrador' | 'Pendiente' | 'Aprobado' | 'Rechazado';
  monto_total: number;
  actividades_poa: string;
  presupuesto_aprobado: number;
  ano_presupuesto: number;
  tipo_presupuesto: string;
  fecha_registro: string;
  fecha_validacion?: string;
  usuario_creador: string;
  revisor_validador?: string;
}

interface ReporteComparativo {
  id: number;
  institucion: string;
  objetivo_codigo: string;
  meta_planificada: number;
  meta_ejecutada: number;
  porcentaje_cumplimiento: number;
  indicador: string;
  periodo: string;
}

interface EstadisticasReporte {
  objetivos: {
    total: number;
    por_estado: {
      borrador: number;
      enviado: number;
      validado: number;
      rechazado: number;
    };
    por_institucion: Record<string, number>;
    alineacion_pnd: Record<string, number>;
    alineacion_ods: Record<string, number>;
    validados: number;
  };
  proyectos: {
    total: number;
    por_estado: {
      borrador: number;
      pendiente: number;
      aprobado: number;
      rechazado: number;
    };
    monto_total_asignado: number;
    presupuesto_por_ano: Record<string, number>;
    presupuesto_por_tipo: Record<string, number>;
    validados: number;
  };
  comparativo: {
    cumplimiento_promedio: number;
    metas_planificadas: number;
    metas_ejecutadas: number;
    instituciones_reportando: number;
  };
  validaciones: {
    total: number;
    objetivos: number;
    proyectos: number;
    por_revisor: Record<string, number>;
  };
}

interface OpcionesFiltros {
  estados: {
    objetivos: ['Borrador', 'Enviado', 'Validado', 'Rechazado'];
    proyectos: ['Borrador', 'Pendiente', 'Aprobado', 'Rechazado'];
  };
  anos: string[];
  instituciones: Array<{ id: number; nombre: string }>;
  areas: string[];
  responsables: Array<{ id: number; nombre_completo: string }>;
  roles: ['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'AUDITOR'];
  alineaciones_pnd: string[];
  alineaciones_ods: string[];
  tipos_presupuesto: string[];
}

export default function ReportesPage() {
  const { user } = useAuth();
  const [tipoReporte, setTipoReporte] = useState<'objetivos' | 'proyectos' | 'presupuestario' | 'comparativo'>('objetivos');
  const [datos, setDatos] = useState<ObjetivoEstrategico[] | ProyectoInversion[] | ReporteComparativo[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasReporte | null>(null);
  const [opcionesFiltros, setOpcionesFiltros] = useState<OpcionesFiltros | null>(null);
  const [filtros, setFiltros] = useState<FiltrosReporte>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalleModal, setDetalleModal] = useState<{ visible: boolean; datos: any }>({ visible: false, datos: null });

  // Cargar estadísticas y opciones de filtros al montar el componente
  useEffect(() => {
    cargarEstadisticas();
    cargarOpcionesFiltros();
  }, []);

  // Cargar datos cuando cambia el tipo de reporte o filtros
  useEffect(() => {
    cargarDatos();
  }, [tipoReporte, filtros]);

  const cargarEstadisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/reportes/consultar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setEstadisticas(result.data.estadisticas);
      } else {
        console.error('Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const cargarOpcionesFiltros = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/reportes/filtros`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setOpcionesFiltros(result.data);
      } else {
        console.error('Error al cargar opciones de filtros');
      }
    } catch (error) {
      console.error('Error al cargar opciones de filtros:', error);
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();

      // Añadir filtros a la query
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      let endpoint = '';
      switch (tipoReporte) {
        case 'objetivos':
          endpoint = 'objetivos';
          break;
        case 'proyectos':
          endpoint = 'proyectos';
          break;
        case 'comparativo':
          endpoint = 'comparativo';
          break;
        case 'presupuestario':
          endpoint = 'presupuestario';
          break;
        default:
          endpoint = 'objetivos';
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/reportes/${endpoint}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDatos(result.data.registros || []);
      } else {
        const errorResult = await response.json();
        setError(errorResult.message || 'Error al cargar datos');
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error de conexión al servidor');
    } finally {
      setCargando(false);
    }
  };

  const exportarReporte = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/reportes/exportar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: tipoReporte,
          formato,
          filtros
        })
      });

      if (response.ok) {
        if (formato === 'csv') {
          // Descargar CSV directamente
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          // Para PDF y Excel (en desarrollo)
          const result = await response.json();
          alert(result.message);
        }
      } else {
        const errorResult = await response.json();
        alert(errorResult.message || 'Error al exportar reporte');
      }
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      alert('Error de conexión al servidor');
    }
  };

  const limpiarFiltros = () => {
    setFiltros({});
  };

  const obtenerColorEstado = (estado: string) => {
    const colores: Record<string, string> = {
      'borrador': 'bg-gray-100 text-gray-800',
      'enviado': 'bg-blue-100 text-blue-800',
      'en_revision': 'bg-yellow-100 text-yellow-800',
      'aprobado': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800',
      'registrado': 'bg-gray-100 text-gray-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const tieneAccesoTipo = (tipo: string) => {
    if (!user?.roles) return false;
    
    if (tipo === 'objetivos') {
      // Revisor no tiene acceso a objetivos
      return !user.roles.includes('REVISOR');
    } else if (tipo === 'proyectos') {
      // Autoridad Validante no tiene acceso a proyectos
      return !user.roles.includes('VALID');
    }
    return true; // Validaciones disponibles para todos los roles con permisos
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">📊 Módulo de Reportes</h1>
            <p className="mt-2 text-gray-600">
              Visualización, generación y exportación de reportes técnicos sobre planificación institucional
            </p>
          </div>

          {/* Estadísticas resumidas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* 📊 1. Reportes Técnicos de Objetivos Estratégicos */}
              {tieneAccesoTipo('objetivos') && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Objetivos Estratégicos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{estadisticas.objetivos.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Validados:</span>
                      <span className="font-semibold text-green-600">{estadisticas.objetivos.validados}</span>
                    </div>
                    
                    {/* Estados específicos */}
                    <div className="border-t pt-2 mt-3">
                      <div className="text-xs text-gray-500 mb-1">Por Estado:</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Borrador:</span>
                        <span>{estadisticas.objetivos.por_estado.borrador}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Enviado:</span>
                        <span>{estadisticas.objetivos.por_estado.enviado}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Validado:</span>
                        <span className="text-green-600">{estadisticas.objetivos.por_estado.validado}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rechazado:</span>
                        <span className="text-red-600">{estadisticas.objetivos.por_estado.rechazado}</span>
                      </div>
                    </div>
                    
                    {/* Alineación PND/ODS */}
                    <div className="border-t pt-2 mt-3">
                      <div className="text-xs text-gray-500 mb-1">Alineación PND: {Object.keys(estadisticas.objetivos.alineacion_pnd).length}</div>
                      <div className="text-xs text-gray-500">Alineación ODS: {Object.keys(estadisticas.objetivos.alineacion_ods).length}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 📊 2. Reportes Técnicos de Proyectos de Inversión */}
              {tieneAccesoTipo('proyectos') && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗 Proyectos de Inversión</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{estadisticas.proyectos.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto Total:</span>
                      <span className="font-semibold text-green-600">${estadisticas.proyectos.monto_total_asignado.toLocaleString()}</span>
                    </div>
                    
                    {/* Estados específicos */}
                    <div className="border-t pt-2 mt-3">
                      <div className="text-xs text-gray-500 mb-1">Por Estado:</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Borrador:</span>
                        <span>{estadisticas.proyectos.por_estado.borrador}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pendiente:</span>
                        <span className="text-yellow-600">{estadisticas.proyectos.por_estado.pendiente}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Aprobado:</span>
                        <span className="text-green-600">{estadisticas.proyectos.por_estado.aprobado}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rechazado:</span>
                        <span className="text-red-600">{estadisticas.proyectos.por_estado.rechazado}</span>
                      </div>
                    </div>
                    
                    {/* Presupuestos */}
                    <div className="border-t pt-2 mt-3">
                      <div className="text-xs text-gray-500 mb-1">Años Presupuesto: {Object.keys(estadisticas.proyectos.presupuesto_por_ano).length}</div>
                      <div className="text-xs text-gray-500">Tipos Presupuesto: {Object.keys(estadisticas.proyectos.presupuesto_por_tipo).length}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 📊 3. Reportes comparativo */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Reportes comparativo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cumplimiento Promedio:</span>
                    <span className="font-semibold text-blue-600">{estadisticas.comparativo.cumplimiento_promedio.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metas Planificadas:</span>
                    <span className="font-semibold">{estadisticas.comparativo.metas_planificadas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metas Ejecutadas:</span>
                    <span className="font-semibold text-green-600">{estadisticas.comparativo.metas_ejecutadas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Instituciones:</span>
                    <span className="font-semibold">{estadisticas.comparativo.instituciones_reportando}</span>
                  </div>
                  
                  {/* Indicador de rendimiento */}
                  <div className="border-t pt-2 mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(estadisticas.comparativo.cumplimiento_promedio, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Seguimiento de Indicadores</div>
                  </div>
                </div>
              </div>

              {/* ✅ Validaciones */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Validaciones</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold">{estadisticas.validaciones.total}</span>
                  </div>
                  {tieneAccesoTipo('objetivos') && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Objetivos:</span>
                      <span className="font-semibold text-blue-600">{estadisticas.validaciones.objetivos}</span>
                    </div>
                  )}
                  {tieneAccesoTipo('proyectos') && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proyectos:</span>
                      <span className="font-semibold text-purple-600">{estadisticas.validaciones.proyectos}</span>
                    </div>
                  )}
                  
                  {/* Por Revisor */}
                  <div className="border-t pt-2 mt-3">
                    <div className="text-xs text-gray-500 mb-1">Por Revisor:</div>
                    {Object.entries(estadisticas.validaciones.por_revisor).slice(0, 3).map(([revisor, cantidad]) => (
                      <div key={revisor} className="flex justify-between text-sm">
                        <span className="text-gray-500 truncate">{revisor.substring(0, 10)}...</span>
                        <span>{cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selector de tipo de reporte */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Tipo de Reporte Técnico</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 📊 1. Reportes Técnicos de Objetivos Estratégicos */}
                {tieneAccesoTipo('objetivos') && (
                  <button
                    onClick={() => setTipoReporte('objetivos')}
                    className={`p-4 rounded-lg font-medium transition-all border-2 text-left ${
                      tipoReporte === 'objetivos'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-lg mb-2">📄 Objetivos Estratégicos</div>
                    <div className="text-sm opacity-90">
                      • Estados: Borrador, Enviado, Validado, Rechazado<br/>
                      • Alineación PND y ODS<br/>
                      • Metas e indicadores<br/>
                      • Fechas de validación
                    </div>
                  </button>
                )}
                
                {/* 📊 2. Reportes Técnicos de Proyectos de Inversión */}
                {tieneAccesoTipo('proyectos') && (
                  <button
                    onClick={() => setTipoReporte('proyectos')}
                    className={`p-4 rounded-lg font-medium transition-all border-2 text-left ${
                      tipoReporte === 'proyectos'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-lg mb-2">🏗 Proyectos de Inversión</div>
                    <div className="text-sm opacity-90">
                      • Estados: Borrador, Pendiente, Aprobado, Rechazado<br/>
                      • Montos y presupuestos<br/>
                      • Actividades POA<br/>
                      • Validaciones por revisor
                    </div>
                  </button>
                )}
                
                {/* 📊 3. Resumen Presupuestario */}
                <button
                  onClick={() => setTipoReporte('presupuestario')}
                  className={`p-4 rounded-lg font-medium transition-all border-2 text-left ${
                    tipoReporte === 'presupuestario'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-lg mb-2">� Resumen Presupuestario</div>
                  <div className="text-sm opacity-90">
                    • Total de presupuestos<br/>
                    • Monto aprobado<br/>
                    • Estado de ejecución<br/>
                    • Análisis por institución
                  </div>
                </button>
                
                {/* 📊 4. Reportes comparativo */}
                <button
                  onClick={() => setTipoReporte('comparativo')}
                  className={`p-4 rounded-lg font-medium transition-all border-2 text-left ${
                    tipoReporte === 'comparativo'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-lg mb-2">📈 Reportes comparativo</div>
                  <div className="text-sm opacity-90">
                    • Metas planificadas vs ejecutadas<br/>
                    • Seguimiento de indicadores<br/>
                    • Cumplimiento por institución<br/>
                    • Análisis de rendimiento
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
                <button
                  onClick={limpiarFiltros}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 📄 4. Filtros por Estado del objetivo/proyecto */}
                {opcionesFiltros && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado {tipoReporte === 'objetivos' ? 'Objetivo' : tipoReporte === 'proyectos' ? 'Proyecto' : tipoReporte === 'presupuestario' ? 'Presupuestario' : 'Comparativo'}
                    </label>
                    <select
                      value={filtros.estado || ''}
                      onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los estados</option>
                      {tipoReporte === 'objetivos' && (
                        <>
                          <option value="Borrador">Borrador</option>
                          <option value="Enviado">Enviado</option>
                          <option value="Validado">Validado</option>
                          <option value="Rechazado">Rechazado</option>
                        </>
                      )}
                      {tipoReporte === 'proyectos' && (
                        <>
                          <option value="Borrador">Borrador</option>
                          <option value="Pendiente">Pendiente</option>
                          <option value="Aprobado">Aprobado</option>
                          <option value="Rechazado">Rechazado</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* 📄 4. Filtros por Año */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <select
                    value={filtros.ano || ''}
                    onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los años</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>

                {/* 📄 4. Filtros por Institución */}
                {opcionesFiltros && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institución
                    </label>
                    <select
                      value={filtros.institucion || ''}
                      onChange={(e) => setFiltros({ ...filtros, institucion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas las instituciones</option>
                      {opcionesFiltros.instituciones?.map(institucion => (
                        <option key={institucion.id} value={institucion.id.toString()}>
                          {institucion.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 📄 4. Filtros por Rol del usuario que creó */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol Creador
                  </label>
                  <select
                    value={filtros.rolCreador || ''}
                    onChange={(e) => setFiltros({ ...filtros, rolCreador: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="PLANIF">PLANIF</option>
                    <option value="REVISOR">REVISOR</option>
                    <option value="VALID">VALID</option>
                    <option value="AUDITOR">AUDITOR</option>
                  </select>
                </div>

                {/* 📄 4. Filtros por Rol del usuario que validó */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol Validador
                  </label>
                  <select
                    value={filtros.rolValidador || ''}
                    onChange={(e) => setFiltros({ ...filtros, rolValidador: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los validadores</option>
                    <option value="REVISOR">REVISOR</option>
                    <option value="VALID">VALID</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                {/* Filtro de fechas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaInicio || ''}
                    onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filtros específicos por tipo de reporte */}
              {tipoReporte === 'objetivos' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📄 Alineación PND
                    </label>
                    <select
                      value={filtros.area || ''}
                      onChange={(e) => setFiltros({ ...filtros, area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas las alineaciones PND</option>
                      <option value="Desarrollo Social">Desarrollo Social</option>
                      <option value="Desarrollo Económico">Desarrollo Económico</option>
                      <option value="Fortalecimiento Institucional">Fortalecimiento Institucional</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📄 Alineación ODS
                    </label>
                    <select
                      value={filtros.tipo || ''}
                      onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas las alineaciones ODS</option>
                      <option value="ODS 1 - Fin de la Pobreza">ODS 1 - Fin de la Pobreza</option>
                      <option value="ODS 4 - Educación de Calidad">ODS 4 - Educación de Calidad</option>
                      <option value="ODS 8 - Trabajo Decente">ODS 8 - Trabajo Decente</option>
                      <option value="ODS 16 - Paz y Justicia">ODS 16 - Paz y Justicia</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📄 Área Responsable
                    </label>
                    <select
                      value={filtros.responsable || ''}
                      onChange={(e) => setFiltros({ ...filtros, responsable: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas las áreas</option>
                      <option value="Dirección de Planificación">Dirección de Planificación</option>
                      <option value="Dirección Financiera">Dirección Financiera</option>
                      <option value="Dirección Técnica">Dirección Técnica</option>
                    </select>
                  </div>
                </div>
              )}

              {tipoReporte === 'proyectos' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏗 Tipo Presupuesto
                    </label>
                    <select
                      value={filtros.tipo || ''}
                      onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los tipos</option>
                      <option value="Inversión">Inversión</option>
                      <option value="Funcionamiento">Funcionamiento</option>
                      <option value="Servicio de Deuda">Servicio de Deuda</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏗 Actividades POA
                    </label>
                    <select
                      value={filtros.area || ''}
                      onChange={(e) => setFiltros({ ...filtros, area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas las actividades</option>
                      <option value="Actividad 1">Actividad 1</option>
                      <option value="Actividad 2">Actividad 2</option>
                      <option value="Actividad 3">Actividad 3</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏗 Revisor Validador
                    </label>
                    <select
                      value={filtros.responsable || ''}
                      onChange={(e) => setFiltros({ ...filtros, responsable: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los revisores</option>
                      {opcionesFiltros?.responsables?.map(responsable => (
                        <option key={responsable.id} value={responsable.nombre_completo}>
                          {responsable.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 📄 4. Exportaciones */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📄 4. Exportaciones</h2>
              <p className="text-gray-600 mb-4">
                Genere reportes en diferentes formatos según sus necesidades de análisis
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => exportarReporte('pdf')}
                  className="flex flex-col items-center p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border-2 border-red-200 hover:border-red-300"
                >
                  <div className="text-2xl mb-2">�</div>
                  <div className="font-semibold">Formato PDF</div>
                  <div className="text-sm text-center mt-1">
                    Para informes institucionales formales
                  </div>
                </button>
                <button
                  onClick={() => exportarReporte('excel')}
                  className="flex flex-col items-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border-2 border-green-200 hover:border-green-300"
                >
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-semibold">Formato Excel</div>
                  <div className="text-sm text-center mt-1">
                    Para análisis detallado y manipulación de datos
                  </div>
                </button>
                <button
                  onClick={() => exportarReporte('csv')}
                  className="flex flex-col items-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border-2 border-blue-200 hover:border-blue-300"
                >
                  <div className="text-2xl mb-2">�</div>
                  <div className="font-semibold">Formato CSV</div>
                  <div className="text-sm text-center mt-1">
                    Para importación en otros sistemas
                  </div>
                </button>
              </div>
              
              {/* Información sobre filtros aplicados */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Filtros aplicados:</strong> {
                    Object.entries(filtros).filter(([_, value]) => value).length > 0 
                      ? Object.entries(filtros)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')
                      : 'Ninguno (se exportarán todos los datos)'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de resultados */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Resultados ({datos.length} registros)
                </h2>
                <button
                  onClick={cargarDatos}
                  disabled={cargando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {cargando ? 'Cargando...' : '🔄 Actualizar'}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="text-red-400">⚠️</div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {cargando ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Cargando datos...</p>
                </div>
              ) : datos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron registros con los filtros aplicados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {tipoReporte === 'presupuestario' ? 'Institución' : 'ID'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {tipoReporte === 'presupuestario' ? 'Responsable' : 'Responsable'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        {tipoReporte === 'proyectos' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Presupuesto
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {datos.map((registro, index) => {
                        // Determinar el tipo de registro y mostrar datos específicos
                        if (tipoReporte === 'objetivos') {
                          const obj = registro as ObjetivoEstrategico;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                📄 {obj.codigo || obj.id}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="max-w-xs truncate">
                                  {obj.descripcion}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {obj.institucion_nombre}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  obtenerColorEstado(obj.estado)
                                }`}>
                                  {obj.estado}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {obj.area_responsable || obj.usuario_creador || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {obj.fecha_registro 
                                  ? new Date(obj.fecha_registro).toLocaleDateString('es-ES')
                                  : '-'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => setDetalleModal({ visible: true, datos: obj })}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Ver Detalle
                                </button>
                              </td>
                            </tr>
                          );
                        } else if (tipoReporte === 'proyectos') {
                          const proy = registro as ProyectoInversion;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                🏗 {proy.codigo || proy.id}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="max-w-xs truncate">
                                  {proy.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {proy.institucion_nombre}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  obtenerColorEstado(proy.estado)
                                }`}>
                                  {proy.estado}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {proy.revisor_validador || proy.usuario_creador || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {proy.fecha_registro 
                                  ? new Date(proy.fecha_registro).toLocaleDateString('es-ES')
                                  : '-'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {proy.monto_total 
                                  ? `$${proy.monto_total.toLocaleString()}`
                                  : '-'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => setDetalleModal({ visible: true, datos: proy })}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Ver Detalle
                                </button>
                              </td>
                            </tr>
                          );
                        } else if (tipoReporte === 'comparativo') {
                          const comp = registro as ReporteComparativo;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                📈 {comp.objetivo_codigo}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="max-w-xs truncate">
                                  {comp.indicador}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {comp.institucion}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  comp.porcentaje_cumplimiento >= 80 ? 'bg-green-100 text-green-800' :
                                  comp.porcentaje_cumplimiento >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {comp.porcentaje_cumplimiento.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {comp.meta_planificada}/{comp.meta_ejecutada}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {comp.periodo}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => setDetalleModal({ visible: true, datos: comp })}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Ver Detalle
                                </button>
                              </td>
                            </tr>
                          );
                        } else {
                          // Validaciones - usar any por ahora para evitar errores de tipo
                          const val = registro as any;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ✅ {val.id}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="max-w-xs truncate">
                                  {val.elemento_validado || val.nombre || 'Validación'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  obtenerColorEstado(val.estado || val.resultado)
                                }`}>
                                  {val.estado || val.resultado || 'Procesado'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {val.validador || val.revisor || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {val.fecha_validacion 
                                  ? new Date(val.fecha_validacion).toLocaleDateString('es-ES')
                                  : '-'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => setDetalleModal({ visible: true, datos: val })}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Ver Detalle
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {detalleModal.visible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {tipoReporte === 'objetivos' ? '📄 Detalle de Objetivo Estratégico' : 
                   tipoReporte === 'proyectos' ? '🏗 Detalle de Proyecto de Inversión' : 
                   tipoReporte === 'comparativo' ? '� Detalle Comparativo' :
                   '✅ Detalle de Validación'}
                </h3>
                <button
                  onClick={() => setDetalleModal({ visible: false, datos: null })}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {/* 📊 1. Reportes Técnicos de Objetivos Estratégicos */}
              {tipoReporte === 'objetivos' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📄 Código del Objetivo</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.codigo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Institución</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.institucion_nombre}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📝 Descripción del Objetivo</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.descripcion}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📊 Estado</label>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        obtenerColorEstado((detalleModal.datos as ObjetivoEstrategico)?.estado)
                      }`}>
                        {(detalleModal.datos as ObjetivoEstrategico)?.estado}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">👥 Área Responsable</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.area_responsable}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Alineación PND</label>
                      <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.alineacion_pnd || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🌍 Alineación ODS</label>
                      <p className="text-sm text-gray-900 bg-green-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.alineacion_ods || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Metas</label>
                    <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.metas || 'No especificadas'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📊 Indicadores Asociados</label>
                    <p className="text-sm text-gray-900 bg-purple-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.indicadores || 'No especificados'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📅 Fecha de Registro</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                        {(detalleModal.datos as ObjetivoEstrategico)?.fecha_registro 
                          ? new Date((detalleModal.datos as ObjetivoEstrategico).fecha_registro).toLocaleDateString('es-ES')
                          : 'No registrada'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">✅ Fecha de Validación</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                        {(detalleModal.datos as ObjetivoEstrategico)?.fecha_validacion 
                          ? new Date((detalleModal.datos as ObjetivoEstrategico).fecha_validacion!).toLocaleDateString('es-ES')
                          : 'Pendiente'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">👤 Usuario Creador</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico)?.usuario_creador}</p>
                    </div>
                  </div>
                  
                  {(detalleModal.datos as ObjetivoEstrategico)?.usuario_validador && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">✅ Usuario Validador</label>
                      <p className="text-sm text-gray-900 bg-green-50 p-3 rounded">{(detalleModal.datos as ObjetivoEstrategico).usuario_validador}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 📊 2. Reportes Técnicos de Proyectos de Inversión */}
              {tipoReporte === 'proyectos' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🏗 Código del Proyecto</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ProyectoInversion)?.codigo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Institución</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ProyectoInversion)?.institucion_nombre}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📝 Nombre del Proyecto</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ProyectoInversion)?.nombre}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📊 Estado</label>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        obtenerColorEstado((detalleModal.datos as ProyectoInversion)?.estado)
                      }`}>
                        {(detalleModal.datos as ProyectoInversion)?.estado}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">💰 Monto Total Asignado</label>
                      <p className="text-sm text-gray-900 bg-green-50 p-3 rounded font-semibold">
                        ${(detalleModal.datos as ProyectoInversion)?.monto_total?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📋 Actividades del POA Vinculadas</label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded">{(detalleModal.datos as ProyectoInversion)?.actividades_poa || 'No especificadas'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">💰 Presupuesto Aprobado</label>
                      <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded">
                        ${(detalleModal.datos as ProyectoInversion)?.presupuesto_aprobado?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📅 Año Presupuesto</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ProyectoInversion)?.ano_presupuesto}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📊 Tipo Presupuesto</label>
                      <p className="text-sm text-gray-900 bg-purple-50 p-3 rounded">{(detalleModal.datos as ProyectoInversion)?.tipo_presupuesto}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📅 Fecha de Registro</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                        {(detalleModal.datos as ProyectoInversion)?.fecha_registro 
                          ? new Date((detalleModal.datos as ProyectoInversion).fecha_registro).toLocaleDateString('es-ES')
                          : 'No registrada'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">✅ Fecha de Validación</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                        {(detalleModal.datos as ProyectoInversion)?.fecha_validacion 
                          ? new Date((detalleModal.datos as ProyectoInversion).fecha_validacion!).toLocaleDateString('es-ES')
                          : 'Pendiente'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">👤 Usuario Creador</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ProyectoInversion)?.usuario_creador}</p>
                    </div>
                  </div>
                  
                  {(detalleModal.datos as ProyectoInversion)?.revisor_validador && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">✅ Revisor Validador</label>
                      <p className="text-sm text-gray-900 bg-green-50 p-3 rounded">{(detalleModal.datos as ProyectoInversion).revisor_validador}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 📊 3. Reportes comparativo */}
              {tipoReporte === 'comparativo' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Código de Objetivo</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ReporteComparativo)?.objetivo_codigo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Institución</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ReporteComparativo)?.institucion}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📊 Indicador</label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded">{(detalleModal.datos as ReporteComparativo)?.indicador}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Meta Planificada</label>
                      <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded font-semibold">
                        {(detalleModal.datos as ReporteComparativo)?.meta_planificada}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">✅ Meta Ejecutada</label>
                      <p className="text-sm text-gray-900 bg-green-50 p-3 rounded font-semibold">
                        {(detalleModal.datos as ReporteComparativo)?.meta_ejecutada}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📈 % Cumplimiento</label>
                      <span className={`inline-flex px-3 py-2 text-sm font-bold rounded-full ${
                        (detalleModal.datos as ReporteComparativo)?.porcentaje_cumplimiento >= 80 ? 'bg-green-100 text-green-800' :
                        (detalleModal.datos as ReporteComparativo)?.porcentaje_cumplimiento >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(detalleModal.datos as ReporteComparativo)?.porcentaje_cumplimiento.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📅 Período</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{(detalleModal.datos as ReporteComparativo)?.periodo}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setDetalleModal({ visible: false, datos: null })}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
