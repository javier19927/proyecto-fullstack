'use client';

import { useEffect, useState } from 'react';
import { BackendConnection, checkBackendConnection } from '../utils/backendCheck';

export default function BackendDiagnostic() {
  const [connections, setConnections] = useState<BackendConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const results = await checkBackendConnection();
        setConnections(results);
      } catch (error) {
        console.error('Error checking backend connections:', error);
      } finally {
        setLoading(false);
      }
    };

    checkConnections();
  }, []);

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        <p>🔍 Verificando conexion al backend...</p>
      </div>
    );
  }

  const onlineConnections = connections.filter(c => c.status === 'online');

  return (
    <div className="space-y-4">
      {onlineConnections.length === 0 ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <h4 className="font-bold">❌ Backend no disponible</h4>
          <p>No se pudo conectar a ningun servidor backend.</p>
          <div className="mt-2 text-sm">
            <p>Servidores verificados:</p>
            <ul className="list-disc list-inside">
              {connections.map(conn => (
                <li key={conn.port}>
                  Puerto {conn.port}: {conn.status === 'offline' ? '❌ Sin conexion' : '✅ Conectado'}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 text-sm">
            <p><strong>Soluciones:</strong></p>
            <ul className="list-disc list-inside">
              <li>Ejecutar: <code className="bg-red-100 px-1 rounded">cd backend && npm run dev</code></li>
              <li>Verificar que PostgreSQL este ejecutandose</li>
              <li>Verificar las variables de entorno</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <h4 className="font-bold">✅ Backend conectado</h4>
          <div className="mt-2">
            {onlineConnections.map(conn => (
              <p key={conn.port} className="text-sm">
                Servidor activo en puerto <strong>{conn.port}</strong>
                {conn.responseTime && (
                  <span className="ml-2 text-xs">
                    (Tiempo de respuesta: {conn.responseTime}ms)
                  </span>
                )}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
