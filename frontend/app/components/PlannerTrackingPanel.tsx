'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface EnvioSeguimiento {
  id: number;
  tipo: 'OBJETIVO' | 'PROYECTO';
  item_id: number;
  item_codigo: string;
  item_nombre: string;
  estado: 'ENVIADO' | 'EN_VALIDACION' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO';
  fecha_envio: string;
  fecha_respuesta?: string;
  enviado_a: string;
  observaciones?: string;
  dias_pendiente: number;
}

interface PlannerTrackingPanelProps {
  className?: string;
}

/**
 * Panel de seguimiento y gestión de planificación para Técnico Planificador
 * 
 * FUNCIONALIDADES ESPECÍFICAS DEL ROL:
 * - Registrar y gestionar objetivos, metas e indicadores
 * - Alinear objetivos al PND y ODS
 * - Crear y editar proyectos, actividades y presupuestos
 * - Enviar proyectos y objetivos a revisión/validación
 * - Seguimiento del estado de envíos
 * - Generar y exportar reportes técnicos
 */
export default function PlannerTrackingPanel({ className = "" }: PlannerTrackingPanelProps) {
  const { user, token } = useAuth();
  const [envios, setEnvios] = useState<EnvioSeguimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'OBJETIVO' | 'PROYECTO'>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [estadisticas, setEstadisticas] = useState({
    total_enviados: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
    promedio_dias_respuesta: 0
  });

  useEffect(() => {
    if (user && token && user.roles.includes('PLANIF')) {
      cargarEnvios();
      cargarEstadisticas();
    }
  }, [user, token, filtroTipo, filtroEstado]);

  const cargarEnvios = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTipo !== 'TODOS') params.append('tipo', filtroTipo);
      if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado);

      const response = await fetch(buildApiUrl(`/api/envios/seguimiento?${params}`), {
        headers: buildHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        setEnvios(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando envíos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    if (!token) return;

    try {
      const response = await fetch(buildApiUrl('/api/envios/estadisticas'), {
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
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ENVIADO':
      case 'EN_VALIDACION':
      case 'EN_REVISION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APROBADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'ENVIADO':
      case 'EN_VALIDACION':
      case 'EN_REVISION':
        return '⏳';
      case 'APROBADO':
        return '✅';
      case 'RECHAZADO':
        return '❌';
      default:
        return '❓';
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'OBJETIVO' ? '🎯' : '🏗️';
  };

  const getPrioridadColor = (dias: number) => {
    if (dias > 15) return 'text-red-600';
    if (dias > 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Verificar que el usuario sea técnico planificador
  if (!user?.roles?.includes('PLANIF')) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              📤
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-blue-900">
                Seguimiento de Envíos
              </h2>
              <p className="text-sm text-blue-700">
                Estado de objetivos y proyectos enviados a validación/revisión
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                📊
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Enviados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {estadisticas.total_enviados}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                ⏳
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {estadisticas.pendientes}
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
              <p className="text-sm font-medium text-gray-500">Promedio Días</p>
              <p className="text-2xl font-semibold text-purple-600">
                {estadisticas.promedio_dias_respuesta}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="OBJETIVO">🎯 Objetivos</option>
              <option value="PROYECTO">🏗️ Proyectos</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ENVIADO">Enviado</option>
              <option value="EN_VALIDACION">En Validación</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Envíos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Envíos Realizados ({envios.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando envíos...</p>
          </div>
        ) : envios.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📭</div>
            <p className="text-gray-500">No se encontraron envíos con los filtros aplicados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {envios.map((envio) => (
              <div key={`${envio.tipo}-${envio.id}`} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getTipoIcon(envio.tipo)}</span>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {envio.item_codigo}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {envio.item_nombre}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Enviado a:</span>
                        <br />
                        <span className="text-gray-900">{envio.enviado_a}</span>
                      </div>
                      <div>
                        <span className="font-medium">Fecha envío:</span>
                        <br />
                        <span className="text-gray-900">{formatearFecha(envio.fecha_envio)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Días pendiente:</span>
                        <br />
                        <span className={`font-semibold ${getPrioridadColor(envio.dias_pendiente)}`}>
                          {envio.dias_pendiente} días
                        </span>
                      </div>
                    </div>
                    
                    {envio.fecha_respuesta && (
                      <div className="mt-3 text-sm text-gray-500">
                        <span className="font-medium">Fecha respuesta:</span>
                        <span className="ml-2 text-gray-900">{formatearFecha(envio.fecha_respuesta)}</span>
                      </div>
                    )}
                    
                    {envio.observaciones && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm text-gray-700">
                          <strong>Observaciones:</strong> {envio.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getEstadoColor(envio.estado)}`}>
                      {getEstadoIcon(envio.estado)} {envio.estado.replace('_', ' ')}
                    </span>
                    
                    {envio.estado === 'RECHAZADO' && (
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        📝 Revisar y Reenviar
                      </button>
                    )}
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
