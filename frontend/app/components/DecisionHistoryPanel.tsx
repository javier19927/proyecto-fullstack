'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface HistorialDecision {
  id: number;
  tipo: 'OBJETIVO' | 'PROYECTO';
  item_id: number;
  item_codigo: string;
  item_nombre: string;
  accion: 'APROBADO' | 'RECHAZADO';
  observaciones?: string;
  fecha_decision: string;
  validador_nombre?: string;
  enviado_por?: string;
}

interface DecisionHistoryPanelProps {
  userRole: 'VALID' | 'REVISOR';
  className?: string;
}



interface DecisionRecord {
  id: number;
  item_id: number;
  item_codigo: string;
  item_nombre: string;
  tipo_item: 'OBJETIVO' | 'PROYECTO';
  accion: 'APROBAR' | 'RECHAZAR';
  observaciones?: string;
  fecha_decision: string;
  usuario_validador: string;
  estado_anterior: string;
  estado_nuevo: string;
}

/**
 * Panel de historial de decisiones específico para cada rol:
 * - VALID: Historial de objetivos aprobados/rechazados
 * - REVISOR: Historial de proyectos aprobados/rechazados
 */
export default function DecisionHistoryPanel({ userRole, className = "" }: DecisionHistoryPanelProps) {
  const { user, token } = useAuth();
  const [historial, setHistorial] = useState<HistorialDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: 'TODOS',
    accion: 'TODOS',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [estadisticas, setEstadisticas] = useState({
    total_decisiones: 0,
    aprobados: 0,
    rechazados: 0,
    este_mes: 0
  });

  useEffect(() => {
    if (user && token) {
      cargarHistorial();
      cargarEstadisticas();
    }
  }, [user, token, filtros]);

  const cargarHistorial = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.tipo !== 'TODOS') params.append('tipo', filtros.tipo);
      if (filtros.accion !== 'TODOS') params.append('accion', filtros.accion);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);

      const endpoint = userRole === 'VALID' ? '/api/validaciones/historial' : '/api/revisiones/historial';
      const response = await fetch(buildApiUrl(`${endpoint}?${params}`), {
        headers: buildHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        setHistorial(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    if (!token) return;

    try {
      const endpoint = userRole === 'VALID' ? '/api/validaciones/estadisticas' : '/api/revisiones/estadisticas';
      const response = await fetch(buildApiUrl(endpoint), {
        headers: buildHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data.data || estadisticas);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccionColor = (accion: string) => {
    return accion === 'APROBADO' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'OBJETIVO' ? '🎯' : '🏗️';
  };

  const roleTitle = userRole === 'VALID' ? 'Autoridad Validadora' : 'Revisor Institucional';
  const roleColor = userRole === 'VALID' ? 'orange' : 'purple';
  const itemType = userRole === 'VALID' ? 'objetivos estratégicos' : 'proyectos de inversión';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`bg-${roleColor}-50 border border-${roleColor}-200 rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-10 h-10 bg-${roleColor}-100 rounded-lg flex items-center justify-center`}>
              📜
            </div>
            <div className="ml-4">
              <h2 className={`text-lg font-semibold text-${roleColor}-900`}>
                Historial de Decisiones - {roleTitle}
              </h2>
              <p className={`text-sm text-${roleColor}-700`}>
                Consulta de decisiones anteriores sobre {itemType}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                📊
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Decisiones</p>
              <p className="text-2xl font-semibold text-gray-900">
                {estadisticas.total_decisiones}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                ✅
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Aprobados</p>
              <p className="text-2xl font-semibold text-green-600">
                {estadisticas.aprobados}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                ❌
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Rechazados</p>
              <p className="text-2xl font-semibold text-red-600">
                {estadisticas.rechazados}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                📅
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Este Mes</p>
              <p className="text-2xl font-semibold text-purple-600">
                {estadisticas.este_mes}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="TODOS">Todos los tipos</option>
              {userRole === 'VALID' && <option value="OBJETIVO">Objetivos</option>}
              {userRole === 'REVISOR' && <option value="PROYECTO">Proyectos</option>}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Decisión</label>
            <select
              value={filtros.accion}
              onChange={(e) => setFiltros({...filtros, accion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="TODOS">Todas las decisiones</option>
              <option value="APROBADO">Aprobados</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Lista de Historial */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Historial de Decisiones ({historial.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando historial...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📭</div>
            <p className="text-gray-500">No se encontraron decisiones con los filtros aplicados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {historial.map((decision) => (
              <div key={decision.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getTipoIcon(decision.tipo)}</span>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {decision.item_codigo}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {decision.item_nombre}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>Decidido por: <strong>{decision.validador_nombre || user?.nombre}</strong></span>
                      {decision.enviado_por && (
                        <span>Enviado por: <strong>{decision.enviado_por}</strong></span>
                      )}
                      <span>Fecha: <strong>{formatearFecha(decision.fecha_decision)}</strong></span>
                    </div>
                    
                    {decision.observaciones && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm text-gray-700">
                          <strong>Observaciones:</strong> {decision.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getAccionColor(decision.accion)}`}>
                      {decision.accion === 'APROBADO' ? '✅ Aprobado' : '❌ Rechazado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
