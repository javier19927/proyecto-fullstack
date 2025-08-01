'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface SimpleDashboardStats {
  totalInstituciones: number;
  totalUsuarios: number;
  totalObjetivos: number;
  totalProyectos: number;
}

export default function SimpleDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<SimpleDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && user && token) {
      loadStats();
    }
  }, [authLoading, user, token]);

  const loadStats = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Cargando stats con token:', token.substring(0, 20) + '...');
      
      const response = await fetch(buildApiUrl('/api/dashboard/role-specific?role=' + (user?.roles[0] || 'ADMIN')), {
        headers: buildHeaders(token)
      });
      
      console.log('📡 Respuesta recibida:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Datos recibidos:', data);
        setStats(data.data);
      } else {
        const errorText = await response.text();
        console.error('❌ Error respuesta:', errorText);
        setError(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error cargando stats:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Usuario no autenticado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Simple - {user.roles[0] || 'Sin rol'}
              </h1>
              <p className="text-gray-600">Usuario: {user.nombre}</p>
            </div>
            <button
              onClick={loadStats}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Recargar'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">❌</span>
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
              <p className="text-blue-700">Cargando estadísticas...</p>
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    🏢
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Instituciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInstituciones || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    👥
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsuarios || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    🎯
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Objetivos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalObjetivos || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    📊
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Proyectos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProyectos || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información de debug */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Debug Info</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Usuario ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Roles:</strong> {user.roles?.join(', ')}</p>
            <p><strong>Token presente:</strong> {token ? 'Sí' : 'No'}</p>
            <p><strong>Stats cargadas:</strong> {stats ? 'Sí' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
