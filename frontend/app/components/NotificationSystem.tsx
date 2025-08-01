'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface Notificacion {
  id: number;
  tipo: 'OBJETIVO_PENDIENTE' | 'PROYECTO_PENDIENTE' | 'OBJETIVO_APROBADO' | 'PROYECTO_APROBADO' | 'OBJETIVO_RECHAZADO' | 'PROYECTO_RECHAZADO';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  url_accion?: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  usuario_origen?: string;
  item_id?: number;
  item_codigo?: string;
}

interface NotificationSystemProps {
  className?: string;
}

export default function NotificationSystem({ className = "" }: NotificationSystemProps) {
  const { user, token } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      cargarNotificaciones();
      // Configurar polling cada 30 segundos para notificaciones en tiempo real
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  const cargarNotificaciones = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(
        buildApiUrl('/api/notificaciones/mis-notificaciones'),
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        const notificaciones = data.data || [];
        setNotificaciones(notificaciones);
        setNoLeidas(notificaciones.filter((n: Notificacion) => !n.leida).length);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarComoLeida = async (notificacionId: number) => {
    if (!token) return;
    
    try {
      await fetch(
        buildApiUrl(`/api/notificaciones/${notificacionId}/marcar-leida`),
        {
          method: 'PATCH',
          headers: buildHeaders(token)
        }
      );
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(n => n.id === notificacionId ? { ...n, leida: true } : n)
      );
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      await fetch(
        buildApiUrl('/api/notificaciones/marcar-todas-leidas'),
        {
          method: 'PATCH',
          headers: buildHeaders(token)
        }
      );
      
      // Actualizar estado local
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerIconoNotificacion = (tipo: string) => {
    switch (tipo) {
      case 'OBJETIVO_PENDIENTE':
        return '🎯';
      case 'PROYECTO_PENDIENTE':
        return '📋';
      case 'OBJETIVO_APROBADO':
        return '✅';
      case 'PROYECTO_APROBADO':
        return '✅';
      case 'OBJETIVO_RECHAZADO':
        return '❌';
      case 'PROYECTO_RECHAZADO':
        return '❌';
      default:
        return '📢';
    }
  };

  const obtenerColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA':
        return 'bg-red-50 border-red-200';
      case 'MEDIA':
        return 'bg-yellow-50 border-yellow-200';
      case 'BAJA':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const manejarAccionNotificacion = (notificacion: Notificacion) => {
    if (notificacion.url_accion) {
      window.location.href = notificacion.url_accion;
    }
    marcarComoLeida(notificacion.id);
  };

  // Solo mostrar para roles que pueden recibir notificaciones
  const rolesConNotificaciones = ['REVISOR', 'VALID', 'PLANIF'];
  if (!user?.roles?.some(role => rolesConNotificaciones.includes(role))) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Botón de Notificaciones */}
      <button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v7" />
        </svg>
        
        {/* Badge de notificaciones no leídas */}
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel de Notificaciones */}
      {mostrarPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            <div className="flex items-center space-x-2">
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {loading ? 'Marcando...' : 'Marcar todas como leídas'}
                </button>
              )}
              <button
                onClick={() => setMostrarPanel(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v7" />
                </svg>
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notificaciones.slice(0, 10).map((notificacion) => (
                  <div
                    key={notificacion.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notificacion.leida ? 'bg-blue-50' : ''
                    } ${obtenerColorPrioridad(notificacion.prioridad)}`}
                    onClick={() => manejarAccionNotificacion(notificacion)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {obtenerIconoNotificacion(notificacion.tipo)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notificacion.leida ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notificacion.titulo}
                          </h4>
                          {!notificacion.leida && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notificacion.mensaje}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatearFecha(notificacion.fecha)}
                          </span>
                          
                          {notificacion.usuario_origen && (
                            <span className="text-xs text-gray-500">
                              Por: {notificacion.usuario_origen}
                            </span>
                          )}
                        </div>
                        
                        {notificacion.item_codigo && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {notificacion.item_codigo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 10 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <a 
                href="/notificaciones" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ver todas las notificaciones
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
