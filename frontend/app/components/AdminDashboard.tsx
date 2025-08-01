'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import Link from 'next/link';

interface AdminStats {
  total_usuarios: number;
  total_instituciones: number;
  total_objetivos: number;
  total_proyectos: number;
  usuarios_activos: number;
  proyectos_activos: number;
  objetivos_pendientes_validacion: number;
  proyectos_pendientes_revision: number;
}

/**
 * Dashboard específico para ADMINISTRADOR DEL SISTEMA (ADMIN)
 * Implementa todas las funcionalidades específicas según especificaciones:
 * - Configurar el sistema institucionalmente
 * - Crear usuarios y asignar roles
 * - Supervisar la planificación general de las instituciones
 * - Registrar y editar todos los elementos
 * - Acceder a todos los reportes y exportaciones sin restricciones
 * - Gestionar la estructura organizativa general
 * - Administrar configuraciones del sistema
 * 
 * Módulos que usa:
 * - Módulo 1: Configuración Institucional (acceso completo)
 * - Módulo 2: Objetivos Estratégicos (acceso completo)
 * - Módulo 3: Proyectos de Inversión (acceso completo)
 * - Módulo 4: Reportes (acceso completo)
 * - Acceso total a todas las funcionalidades del sistema
 */
export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      cargarEstadisticas();
    }
  }, [token]);

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(
        buildApiUrl('/api/dashboard/admin-stats'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Administrador */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">
          🏛️ Administración General del Sistema
        </h2>
        <p className="text-indigo-700">
          Como Administrador del Sistema, tienes acceso completo a todas las funcionalidades: 
          configurar institucionalmente, crear usuarios, supervisar planificación general y acceder a todos los reportes.
        </p>
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-indigo-800">Acceso completo a todos los módulos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-indigo-800">
              {stats?.usuarios_activos || 0} usuarios activos en el sistema
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Usuarios
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_usuarios || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Instituciones
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_instituciones || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Objetivos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_objetivos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Proyectos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_proyectos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas del Administrador */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gestión Institucional y Usuarios */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Administración Institucional
            </h3>
            <div className="space-y-3">
              
              <Link href="/configuracion-institucional" className="block p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Configurar Sistema Institucionalmente</h4>
                    <p className="text-sm text-blue-700">Registrar y editar instituciones</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-800">{stats?.total_instituciones || 0}</div>
                    <div className="text-xs text-blue-600">instituciones</div>
                  </div>
                </div>
              </Link>

              <Link href="/gestion-usuarios" className="block p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">Crear Usuarios y Asignar Roles</h4>
                    <p className="text-sm text-green-700">Gestión completa de usuarios</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-800">{stats?.total_usuarios || 0}</div>
                    <div className="text-xs text-green-600">usuarios</div>
                  </div>
                </div>
              </Link>

              <Link href="/supervision-sistema" className="block p-4 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-purple-900">Supervisar Planificación General</h4>
                    <p className="text-sm text-purple-700">Estructura organizativa general</p>
                  </div>
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Módulos del Sistema */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Gestión de Módulos - Acceso Total
            </h3>
            <div className="space-y-3">
              
              <Link href="/gestion-objetivos" className="block p-4 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-indigo-900">Módulo 2: Objetivos Estratégicos</h4>
                    <p className="text-sm text-indigo-700">Registrar y editar todos los elementos</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-800">{stats?.total_objetivos || 0}</div>
                    <div className="text-xs text-indigo-600">objetivos</div>
                  </div>
                </div>
              </Link>

              <Link href="/gestion-proyectos" className="block p-4 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-orange-900">Módulo 3: Proyectos de Inversión</h4>
                    <p className="text-sm text-orange-700">Acceso completo a proyectos</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-800">{stats?.total_proyectos || 0}</div>
                    <div className="text-xs text-orange-600">proyectos</div>
                  </div>
                </div>
              </Link>

              <Link href="/reportes" className="block p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900">Módulo 4: Reportes</h4>
                    <p className="text-sm text-red-700">Exportaciones sin restricciones</p>
                  </div>
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Herramientas administrativas avanzadas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Herramientas Administrativas Avanzadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <Link href="/diagnostico" className="p-4 border border-gray-200 rounded-lg hover:border-cyan-300 hover:bg-cyan-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Diagnóstico del Sistema</h4>
                  <p className="text-sm text-gray-500">Estado general y rendimiento</p>
                </div>
              </div>
            </Link>

            <Link href="/auditoria" className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Auditoría del Sistema</h4>
                  <p className="text-sm text-gray-500">Seguimiento de actividades</p>
                </div>
              </div>
            </Link>

            <Link href="/historial-decisiones" className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Historial de Decisiones</h4>
                  <p className="text-sm text-gray-500">Trazabilidad completa</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Alertas y notificaciones */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            🚨 Elementos que Requieren Atención
          </h3>
          <div className="space-y-3">
            {stats?.objetivos_pendientes_validacion && stats.objetivos_pendientes_validacion > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="h-5 w-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-yellow-800">
                  {stats.objetivos_pendientes_validacion} objetivos pendientes de validación
                </span>
              </div>
            )}
            
            {stats?.proyectos_pendientes_revision && stats.proyectos_pendientes_revision > 0 && (
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-blue-800">
                  {stats.proyectos_pendientes_revision} proyectos pendientes de revisión
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información del rol de Administrador */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow p-6 border border-indigo-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              🏛️
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Administrador del Sistema - Funciones Específicas
            </h3>
            <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium text-gray-900 mb-2">✅ Acciones Autorizadas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>• Configurar el sistema institucionalmente</li>
                  <li>• Crear usuarios y asignar roles</li>
                  <li>• Supervisar la planificación general de las instituciones</li>
                  <li>• Registrar y editar todos los elementos</li>
                  <li>• Acceder a todos los reportes y exportaciones sin restricciones</li>
                  <li>• Gestionar la estructura organizativa general</li>
                  <li>• Administrar configuraciones del sistema</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">📦 Módulos de Acceso:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>• <strong>Módulo 1:</strong> Configuración Institucional (acceso completo)</li>
                  <li>• <strong>Módulo 2:</strong> Objetivos Estratégicos (acceso completo)</li>
                  <li>• <strong>Módulo 3:</strong> Proyectos de Inversión (acceso completo)</li>
                  <li>• <strong>Módulo 4:</strong> Reportes (acceso completo)</li>
                  <li>• <strong>Sistema:</strong> Acceso total a todas las funcionalidades</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm"><strong>🎯 Propósito General:</strong></p>
              <p className="text-sm">Administrar completamente el sistema, configurar institucionalmente, gestionar usuarios y supervisar la planificación general con acceso total a todas las funcionalidades.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
