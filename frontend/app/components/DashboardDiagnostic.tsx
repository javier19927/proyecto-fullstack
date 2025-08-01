'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface DiagnosticInfo {
  backend_connection: boolean;
  auth_status: boolean;
  user_data: any;
  dashboard_stats: any;
  role_specific_stats: any;
  menu_data: any;
  errors: string[];
}

export default function DashboardDiagnostic() {
  const { user, token, loading: authLoading } = useAuth();
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo>({
    backend_connection: false,
    auth_status: false,
    user_data: null,
    dashboard_stats: null,
    role_specific_stats: null,
    menu_data: null,
    errors: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      runDiagnostic();
    }
  }, [authLoading, user, token]);

  const runDiagnostic = async () => {
    setLoading(true);
    const errors: string[] = [];
    let result: DiagnosticInfo = {
      backend_connection: false,
      auth_status: false,
      user_data: user,
      dashboard_stats: null,
      role_specific_stats: null,
      menu_data: null,
      errors: []
    };

    try {
      // 1. Test backend connection
      const healthResponse = await fetch(buildApiUrl('/health'));
      result.backend_connection = healthResponse.ok;
      if (!healthResponse.ok) {
        errors.push('Backend no está respondiendo');
      }
    } catch (error) {
      errors.push(`Error de conexión al backend: ${error}`);
    }

    // 2. Test auth status
    result.auth_status = !!user && !!token;
    if (!result.auth_status) {
      errors.push('Usuario no autenticado o token faltante');
    }

    if (token) {
      try {
        // 3. Test dashboard stats endpoint
        const statsResponse = await fetch(buildApiUrl('/api/dashboard/stats'), {
          headers: buildHeaders(token)
        });
        
        if (statsResponse.ok) {
          result.dashboard_stats = await statsResponse.json();
        } else {
          errors.push(`Error en /api/dashboard/stats: ${statsResponse.status} ${statsResponse.statusText}`);
          const errorText = await statsResponse.text();
          errors.push(`Respuesta del servidor: ${errorText}`);
        }
      } catch (error) {
        errors.push(`Error llamando dashboard stats: ${error}`);
      }

      try {
        // 4. Test role-specific endpoint
        const roleResponse = await fetch(
          buildApiUrl(`/api/dashboard/role-specific?role=${user?.roles[0] || 'ADMIN'}`), 
          { headers: buildHeaders(token) }
        );
        
        if (roleResponse.ok) {
          result.role_specific_stats = await roleResponse.json();
        } else {
          errors.push(`Error en /api/dashboard/role-specific: ${roleResponse.status} ${roleResponse.statusText}`);
          const errorText = await roleResponse.text();
          errors.push(`Respuesta del servidor: ${errorText}`);
        }
      } catch (error) {
        errors.push(`Error llamando role-specific: ${error}`);
      }

      try {
        // 5. Test menu endpoint
        const menuResponse = await fetch(buildApiUrl('/api/dashboard/menu'), {
          headers: buildHeaders(token)
        });
        
        if (menuResponse.ok) {
          result.menu_data = await menuResponse.json();
        } else {
          errors.push(`Error en /api/dashboard/menu: ${menuResponse.status} ${menuResponse.statusText}`);
        }
      } catch (error) {
        errors.push(`Error llamando menu: ${error}`);
      }
    }

    result.errors = errors;
    setDiagnostic(result);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center text-gray-600 mt-4">Ejecutando diagnóstico...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            🔧 Diagnóstico del Dashboard
          </h3>
          <button
            onClick={runDiagnostic}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Ejecutar de nuevo
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status de conexión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${
            diagnostic.backend_connection 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {diagnostic.backend_connection ? '✅' : '❌'}
              </span>
              <div>
                <h4 className="font-medium">Conexión Backend</h4>
                <p className="text-sm text-gray-600">
                  {diagnostic.backend_connection ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            diagnostic.auth_status 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {diagnostic.auth_status ? '✅' : '❌'}
              </span>
              <div>
                <h4 className="font-medium">Autenticación</h4>
                <p className="text-sm text-gray-600">
                  {diagnostic.auth_status ? 'Autenticado' : 'Sin autenticar'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Datos del usuario */}
        {diagnostic.user_data && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">👤 Datos del Usuario</h4>
            <div className="text-sm space-y-1">
              <p><strong>Nombre:</strong> {diagnostic.user_data.nombre}</p>
              <p><strong>Email:</strong> {diagnostic.user_data.email}</p>
              <p><strong>Roles:</strong> {diagnostic.user_data.roles?.join(', ')}</p>
              <p><strong>ID:</strong> {diagnostic.user_data.id}</p>
            </div>
          </div>
        )}

        {/* Errores */}
        {diagnostic.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">🚨 Errores Detectados</h4>
            <ul className="text-sm text-red-800 space-y-1">
              {diagnostic.errors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Datos de API */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">📊 Dashboard Stats</h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-32">
              {diagnostic.dashboard_stats 
                ? JSON.stringify(diagnostic.dashboard_stats, null, 2)
                : 'No disponible'
              }
            </pre>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">🎯 Role Specific</h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-32">
              {diagnostic.role_specific_stats 
                ? JSON.stringify(diagnostic.role_specific_stats, null, 2)
                : 'No disponible'
              }
            </pre>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">📋 Menu Data</h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-32">
              {diagnostic.menu_data 
                ? JSON.stringify(diagnostic.menu_data, null, 2)
                : 'No disponible'
              }
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
