'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface ComplianceMetrics {
  objetivosCumplimiento: {
    total: number;
    aprobados: number;
    rechazados: number;
    pendientes: number;
    tasaCumplimiento: number;
    promedioTiempoValidacion: number; // en días
  };
  
  proyectosCumplimiento: {
    total: number;
    aprobados: number;
    rechazados: number;
    pendientes: number;
    tasaCumplimiento: number;
    promedioTiempoRevision: number; // en días
  };
  
  presupuestarioAnalisis: {
    totalAsignado: number;
    totalEjecutado: number;
    varianzaPresupuestaria: number; // %
    proyectosConVarianza: number;
    eficienciaPresupuestaria: number; // %
  };
  
  institucionalAnalisis: {
    institucionesCumplidas: number;
    totalInstituciones: number;
    tasaCumplimientoInstitucional: number;
    institucionesCriticas: Array<{
      nombre: string;
      objetivosPendientes: number;
      proyectosPendientes: number;
      varianzaPresupuestaria: number;
    }>;
  };
  
  tendencias: {
    cumplimientoMensual: Array<{
      mes: string;
      objetivos: number;
      proyectos: number;
    }>;
    usuariosActivos: Array<{
      mes: string;
      usuarios: number;
      acciones: number;
    }>;
  };
}

interface AuditTrail {
  usuario: string;
  rol: string;
  accion: string;
  modulo: string;
  fechas: {
    inicio: string;
    fin: string;
  };
  eventos: Array<{
    id: number;
    timestamp: string;
    accion: string;
    tabla: string;
    registroId: number;
    resultado: 'EXITOSO' | 'FALLIDO';
    ipAddress: string;
    detalles?: string;
  }>;
}

interface AdvancedAuditToolsProps {
  className?: string;
}

export default function AdvancedAuditTools({ className = "" }: AdvancedAuditToolsProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'compliance' | 'budget' | 'trail' | 'reports'>('compliance');
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrail | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filtros para auditoría
  const [filtrosAuditoria, setFiltrosAuditoria] = useState({
    fechaInicio: '',
    fechaFin: '',
    usuario: '',
    rol: '',
    modulo: '',
    accion: ''
  });

  useEffect(() => {
    if (token && user?.roles?.includes('AUDITOR')) {
      cargarMetricasCumplimiento();
    }
  }, [token, user]);

  const cargarMetricasCumplimiento = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        buildApiUrl('/api/auditoria/metricas-cumplimiento'),
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error cargando métricas de cumplimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTrazabilidadUsuario = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filtrosAuditoria);
      const response = await fetch(
        buildApiUrl(`/api/auditoria/trazabilidad-usuario?${queryParams}`),
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAuditTrail(data.data);
      }
    } catch (error) {
      console.error('Error cargando trazabilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporteAuditoria = async (tipo: 'compliance' | 'budget' | 'trail') => {
    if (!token) return;
    
    try {
      const response = await fetch(
        buildApiUrl(`/api/auditoria/exportar-reporte?tipo=${tipo}`),
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-auditoria-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exportando reporte:', error);
    }
  };

  const renderComplianceAnalysis = () => (
    <div className="space-y-6">
      {/* Métricas Generales de Cumplimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cumplimiento Objetivos</p>
              <p className="text-3xl font-bold text-green-600">
                {metrics?.objetivosCumplimiento?.tasaCumplimiento || 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {metrics?.objetivosCumplimiento?.aprobados || 0} de {metrics?.objetivosCumplimiento?.total || 0} objetivos
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cumplimiento Proyectos</p>
              <p className="text-3xl font-bold text-blue-600">
                {metrics?.proyectosCumplimiento?.tasaCumplimiento || 0}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h8a2 2 0 002-2V3a2 2 0 012 2v6h-3a2 2 0 00-2 2v4H6a2 2 0 01-2-2V5zm8 5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {metrics?.proyectosCumplimiento?.aprobados || 0} de {metrics?.proyectosCumplimiento?.total || 0} proyectos
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Eficiencia Presupuestaria</p>
              <p className="text-3xl font-bold text-purple-600">
                {metrics?.presupuestarioAnalisis?.eficienciaPresupuestaria || 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Varianza: {metrics?.presupuestarioAnalisis?.varianzaPresupuestaria || 0}%
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cumplimiento Institucional</p>
              <p className="text-3xl font-bold text-orange-600">
                {metrics?.institucionalAnalisis?.tasaCumplimientoInstitucional || 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {metrics?.institucionalAnalisis?.institucionesCumplidas || 0} de {metrics?.institucionalAnalisis?.totalInstituciones || 0} instituciones
          </p>
        </div>
      </div>

      {/* Instituciones Críticas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instituciones que Requieren Atención</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institución
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Objetivos Pendientes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyectos Pendientes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Varianza Presupuestaria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics?.institucionalAnalisis?.institucionesCriticas?.map((institucion, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {institucion.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      institucion.objetivosPendientes > 5 ? 'bg-red-100 text-red-800' : 
                      institucion.objetivosPendientes > 2 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {institucion.objetivosPendientes}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      institucion.proyectosPendientes > 5 ? 'bg-red-100 text-red-800' : 
                      institucion.proyectosPendientes > 2 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {institucion.proyectosPendientes}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      Math.abs(institucion.varianzaPresupuestaria) > 20 ? 'bg-red-100 text-red-800' : 
                      Math.abs(institucion.varianzaPresupuestaria) > 10 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {institucion.varianzaPresupuestaria}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {institucion.objetivosPendientes > 5 || institucion.proyectosPendientes > 5 || Math.abs(institucion.varianzaPresupuestaria) > 20 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🚨 Crítico
                      </span>
                    ) : institucion.objetivosPendientes > 2 || institucion.proyectosPendientes > 2 || Math.abs(institucion.varianzaPresupuestaria) > 10 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ Atención
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Bueno
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBudgetAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis Presupuestario Detallado</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ${(metrics?.presupuestarioAnalisis?.totalAsignado || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Asignado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              ${(metrics?.presupuestarioAnalisis?.totalEjecutado || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Ejecutado</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              (metrics?.presupuestarioAnalisis?.varianzaPresupuestaria || 0) < 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {metrics?.presupuestarioAnalisis?.varianzaPresupuestaria || 0}%
            </p>
            <p className="text-sm text-gray-500">Varianza</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuditTrail = () => (
    <div className="space-y-6">
      {/* Filtros de Trazabilidad */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Auditoría</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            type="date"
            placeholder="Fecha Inicio"
            value={filtrosAuditoria.fechaInicio}
            onChange={(e) => setFiltrosAuditoria(prev => ({ ...prev, fechaInicio: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="date"
            placeholder="Fecha Fin" 
            value={filtrosAuditoria.fechaFin}
            onChange={(e) => setFiltrosAuditoria(prev => ({ ...prev, fechaFin: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="text"
            placeholder="Usuario"
            value={filtrosAuditoria.usuario}
            onChange={(e) => setFiltrosAuditoria(prev => ({ ...prev, usuario: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select
            value={filtrosAuditoria.rol}
            onChange={(e) => setFiltrosAuditoria(prev => ({ ...prev, rol: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los roles</option>
            <option value="ADMIN">Administrador</option>
            <option value="PLANIF">Planificador</option>
            <option value="REVISOR">Revisor</option>
            <option value="VALID">Validador</option>
            <option value="AUDITOR">Auditor</option>
          </select>
          <select
            value={filtrosAuditoria.modulo}
            onChange={(e) => setFiltrosAuditoria(prev => ({ ...prev, modulo: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los módulos</option>
            <option value="objetivos">Objetivos</option>
            <option value="proyectos">Proyectos</option>
            <option value="usuarios">Usuarios</option>
            <option value="instituciones">Instituciones</option>
          </select>
          <button
            onClick={cargarTrazabilidadUsuario}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Resultados de Trazabilidad */}
      {auditTrail && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trazabilidad de Auditoría - {auditTrail.usuario} ({auditTrail.rol})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo/Tabla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resultado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditTrail.eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(evento.timestamp).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {evento.accion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {evento.tabla}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {evento.registroId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        evento.resultado === 'EXITOSO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {evento.resultado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {evento.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (!user?.roles?.includes('AUDITOR')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acceso restringido. Solo auditores pueden acceder a estas herramientas.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Navegación de Pestañas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compliance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Análisis de Cumplimiento
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'budget'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💰 Análisis Presupuestario
          </button>
          <button
            onClick={() => setActiveTab('trail')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trail'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔍 Trazabilidad de Usuarios
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📈 Reportes de Auditoría
          </button>
        </nav>
      </div>

      {/* Contenido de las Pestañas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'compliance' && renderComplianceAnalysis()}
          {activeTab === 'budget' && renderBudgetAnalysis()}
          {activeTab === 'trail' && renderAuditTrail()}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar Reportes de Auditoría</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => exportarReporteAuditoria('compliance')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    📊 Reporte de Cumplimiento
                  </button>
                  <button
                    onClick={() => exportarReporteAuditoria('budget')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    💰 Reporte Presupuestario
                  </button>
                  <button
                    onClick={() => exportarReporteAuditoria('trail')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    🔍 Reporte de Trazabilidad
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
