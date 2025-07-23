'use client';

import { useState } from 'react';
import { API_CONFIG } from '../utils/apiConfig';

export default function DiagnosticoPage() {
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  const probarConexion = async () => {
    setCargando(true);
    setResultado(null);

    try {
      // 1. Probar health check
      const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/health`);
      const healthData = await healthResponse.json();

      // 2. Probar login
      const loginResponse = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: '123456'
        })
      });
      const loginData = await loginResponse.json();

      // 3. Probar endpoint de reportes con token
      let reportesData = null;
      if (loginData.success && loginData.data?.token) {
        const reportesResponse = await fetch(`${API_CONFIG.BASE_URL}/api/reportes/test`, {
          headers: {
            'Authorization': `Bearer ${loginData.data.token}`,
            'Content-Type': 'application/json'
          }
        });
        reportesData = await reportesResponse.json();
      }

      setResultado({
        health: healthData,
        login: loginData,
        reportes: reportesData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setResultado({
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 Diagnóstico de Conexión</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuración Actual</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Backend URL:</strong> {API_CONFIG.BASE_URL}
            </div>
            <div>
              <strong>Frontend URL:</strong> {window.location.origin}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={probarConexion}
            disabled={cargando}
            className={`px-4 py-2 rounded font-medium ${
              cargando 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {cargando ? 'Probando...' : 'Probar Conexión'}
          </button>

          {resultado && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Resultados:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(resultado, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
