'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import Link from 'next/link';

interface PlanifierStats {
  objetivos_creados: number;
  proyectos_creados: number;
  objetivos_pendientes_validacion: number;
  proyectos_pendientes_revision: number;
  objetivos_aprobados: number;
  proyectos_aprobados: number;
  objetivos_rechazados: number;
  proyectos_rechazados: number;
}

/**
 * Dashboard específico para el Técnico Planificador
 * 
 * Funciones principales:
 * - Registrar y gestionar planificación estratégica (objetivos, metas, indicadores)
 * - Crear y editar proyectos, actividades y presupuestos
 * - Alinear objetivos al PND y ODS
 * - Enviar proyectos y objetivos a revisión/validación
 * - Generar y exportar reportes técnicos
 */
export default function PlanifierDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<PlanifierStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      cargarEstadisticas();
    }
  }, [token]);

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(
        buildApiUrl('/api/dashboard/planifier-stats'),
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
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Objetivos Creados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.objetivos_creados || 0}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Proyectos Creados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.proyectos_creados || 0}
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
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En Validación/Revisión
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(stats?.objetivos_pendientes_validacion || 0) + (stats?.proyectos_pendientes_revision || 0)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aprobados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(stats?.objetivos_aprobados || 0) + (stats?.proyectos_aprobados || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones principales del Técnico Planificador */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            📋 Planificación Estratégica - Acciones Principales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Gestión de Objetivos */}
            <Link href="/gestion-objetivos" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Objetivos Estratégicos</h4>
                  <p className="text-sm text-gray-500">Crear objetivos, metas e indicadores</p>
                </div>
              </div>
            </Link>

            {/* Gestión de Proyectos */}
            <Link href="/gestion-proyectos" className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Proyectos de Inversión</h4>
                  <p className="text-sm text-gray-500">Crear proyectos, actividades y presupuestos</p>
                </div>
              </div>
            </Link>

            {/* Alineación PND/ODS */}
            <Link href="/alineacion-pnd-ods" className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Alineación PND/ODS</h4>
                  <p className="text-sm text-gray-500">Alinear objetivos al Plan Nacional</p>
                </div>
              </div>
            </Link>

            {/* Envíos a Validación */}
            <Link href="/envios-validacion" className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Enviar a Validación</h4>
                  <p className="text-sm text-gray-500">Objetivos y proyectos pendientes</p>
                </div>
              </div>
            </Link>

            {/* Reportes Técnicos */}
            <Link href="/reportes" className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Reportes Técnicos</h4>
                  <p className="text-sm text-gray-500">Generar y exportar reportes</p>
                </div>
              </div>
            </Link>

            {/* Configuración (Solo consulta) */}
            <Link href="/configuracion-institucional" className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Consultar Configuración</h4>
                  <p className="text-sm text-gray-500">Solo lectura - información institucional</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Workflow del Planificador */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            🔄 Flujo de Trabajo Recomendado
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Definir Objetivos</h4>
              <p className="text-xs text-gray-600">Crear objetivos estratégicos con metas e indicadores</p>
            </div>
            
            <svg className="w-6 h-6 text-gray-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Alinear PND/ODS</h4>
              <p className="text-xs text-gray-600">Conectar con planes nacionales y ODS</p>
            </div>
            
            <svg className="w-6 h-6 text-gray-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Crear Proyectos</h4>
              <p className="text-xs text-gray-600">Desarrollar proyectos de inversión con actividades</p>
            </div>
            
            <svg className="w-6 h-6 text-gray-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Enviar a Validación</h4>
              <p className="text-xs text-gray-600">Someter a revisión y aprobación</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de elementos pendientes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            ⏳ Estado de Elementos en Proceso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Objetivos pendientes */}
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Objetivos en Validación</h4>
                  <p className="text-lg font-bold text-yellow-900">{stats?.objetivos_pendientes_validacion || 0}</p>
                </div>
              </div>
            </div>

            {/* Proyectos pendientes */}
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Proyectos en Revisión</h4>
                  <p className="text-lg font-bold text-blue-900">{stats?.proyectos_pendientes_revision || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
