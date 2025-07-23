'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardStats from '../components/DashboardStats';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Function to fix encoding issues
  const fixEncoding = (text: string): string => {
    if (!text) return '';
    
    // Fix common encoding issues
    const fixes = {
      'TÃ©cnico PlanificaciÃ³n': 'Tecnico Planificador',
      'TÃ©cnico': 'Tecnico',
      'PlanificaciÃ³n': 'Planificacion',
      'AdministraciÃ³n': 'Administracion',
      'ValidaciÃ³n': 'Validacion'
    };
    
    let fixedText = text;
    Object.entries(fixes).forEach(([corrupted, fixed]) => {
      fixedText = fixedText.replace(new RegExp(corrupted, 'g'), fixed);
    });
    
    return fixedText;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando Dashboard...</h3>
          <p className="text-gray-600">Preparando su espacio de trabajo</p>
          <div className="mt-4 w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                      {user.roles?.includes('ADMIN') 
                        ? '👨‍💼 Bienvenido Administrador' 
                        : user.roles?.includes('PLANIF') 
                        ? '📋 Bienvenido Tecnico Planificador'
                        : user.roles?.includes('REVISOR')
                        ? '🔍 Bienvenido Revisor Institucional'
                        : user.roles?.includes('VALID')
                        ? '⚖️ Bienvenido Validador'
                        : '🏠 Dashboard'}
                    </h1>
                    <p className="text-lg text-gray-600">
                      <span className="font-medium">Usuario:</span> {fixEncoding(user.nombre) || user.email}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-500 font-medium">Roles activos:</span>
                  {user.roles?.map((role, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm border ${
                        role === 'ADMIN' 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300' 
                          : role === 'PLANIF'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-300'
                          : role === 'REVISOR'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-purple-300'
                          : role === 'VALID'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-300'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {role === 'ADMIN' ? '👨‍💼 Administrador' 
                        : role === 'PLANIF' ? '📋 Tecnico Planificador' 
                        : role === 'REVISOR' ? '🔍 Revisor'
                        : role === 'VALID' ? '⚖️ Validador'
                        : role}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                {user.roles?.includes('ADMIN') && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 px-6 py-3 rounded-xl border border-emerald-200 shadow-sm">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold">🔓 Acceso Total al Sistema</span>
                  </div>
                )}
                {user.roles?.includes('PLANIF') && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 px-6 py-3 rounded-xl border border-blue-200 shadow-sm">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold">📊 Acceso de Planificacion</span>
                  </div>
                )}
                {user.roles?.includes('REVISOR') && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-800 px-6 py-3 rounded-xl border border-purple-200 shadow-sm">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold">🔍 Acceso de Revision</span>
                  </div>
                )}
                {user.roles?.includes('VALID') && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 px-6 py-3 rounded-xl border border-orange-200 shadow-sm">
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold">⚖️ Acceso de Validacion</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <DashboardStats />
        </div>

        {/* Quick Actions */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Accesos Rapidos
            </h3>
            <div className="text-sm text-gray-500">
              Selecciona una accion para comenzar
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Gestionar Objetivos - Disponible para ADMIN y PLANIF */}
            {(user.roles?.includes('ADMIN') || user.roles?.includes('PLANIF')) && (
              <button
                onClick={() => router.push('/gestion-objetivos')}
                className="group p-6 text-left bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-blue-200/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-blue-600 text-3xl bg-blue-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <svg className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">
                  {user.roles?.includes('PLANIF') ? 'Registrar Objetivo' : 'Gestionar Objetivos'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Crear y administrar objetivos estrategicos institucionales
                </p>
              </button>
            )}

            {/* Ver Objetivos - Solo lectura para REVISOR */}
            {user.roles?.includes('REVISOR') && (
              <button
                onClick={() => router.push('/gestion-objetivos')}
                className="group p-6 text-left bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-blue-200/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-blue-600 text-3xl bg-blue-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <svg className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Ver Objetivos</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Consultar objetivos estrategicos registrados
                </p>
              </button>
            )}

            {/* Validar Objetivos - Disponible para VALID */}
            {user.roles?.includes('VALID') && (
              <button
                onClick={() => router.push('/gestion-objetivos')}
                className="group p-6 text-left bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-orange-200/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-orange-600 text-3xl bg-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    ⚖️
                  </div>
                  <svg className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Validar Objetivos</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Revisar y validar objetivos estrategicos enviados
                </p>
              </button>
            )}

            {/* Gestionar Proyectos - Disponible para ADMIN y PLANIF */}
            {(user.roles?.includes('ADMIN') || user.roles?.includes('PLANIF')) && (
              <button
                onClick={() => router.push('/gestion-proyectos')}
                className="group p-6 text-left bg-gradient-to-br from-emerald-50 to-teal-100 hover:from-emerald-100 hover:to-teal-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-emerald-200/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-emerald-600 text-3xl bg-emerald-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    📁
                  </div>
                  <svg className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">
                  {user.roles?.includes('PLANIF') ? 'Registrar Proyecto' : 'Gestionar Proyectos'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Administrar proyectos de inversion y seguimiento
                </p>
              </button>
            )}

            {/* Revisar Proyectos - Disponible para REVISOR */}
            {user.roles?.includes('REVISOR') && (
              <button
                onClick={() => router.push('/gestion-proyectos')}
                className="group p-6 text-left bg-gradient-to-br from-emerald-50 to-teal-100 hover:from-emerald-100 hover:to-teal-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-emerald-200/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-emerald-600 text-3xl bg-emerald-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    🔍
                  </div>
                  <svg className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Revisar Proyectos</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Evaluar y aprobar proyectos de inversion
                </p>
              </button>
            )}

            {/* Configuracion Institucional - Para consulta ADMIN y PLANIF (NO REVISOR) */}
            {(user.roles?.includes('ADMIN') || user.roles?.includes('PLANIF')) && (
              <button
                onClick={() => router.push('/configuracion-institucional')}
                className="group p-6 text-left bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-purple-200/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-purple-600 text-3xl bg-purple-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    🏢
                  </div>
                  <svg className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">
                  {user.roles?.includes('PLANIF') ? 'Ver Instituciones' : 'Configuracion Institucional'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {user.roles?.includes('PLANIF') ? 'Consultar instituciones del sistema' : 'Gestionar configuracion institucional'}
                </p>
              </button>
            )}

            {/* Reportes - Disponible para ADMIN, PLANIF, REVISOR y VALID */}
            {(user.roles?.includes('ADMIN') || user.roles?.includes('PLANIF') || user.roles?.includes('REVISOR') || user.roles?.includes('VALID')) && (
              <button
                onClick={() => router.push('/dashboard')} // Por ahora redirige al dashboard, cambiar cuando tengas la página de reportes
                className="group p-6 text-left bg-gradient-to-br from-amber-50 to-yellow-100 hover:from-amber-100 hover:to-yellow-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-amber-200/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-amber-600 text-3xl bg-amber-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <svg className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">
                  {user.roles?.includes('VALID') ? 'Consultar Reportes' : 'Ver Reportes'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {user.roles?.includes('VALID') 
                    ? 'Acceder a reportes de validacion y seguimiento'
                    : 'Consultar reportes y estadisticas del sistema'
                  }
                </p>
              </button>
            )}

            {/* Gestionar Usuarios - Solo ADMIN */}
            {user.roles?.includes('ADMIN') && (
              <button
                onClick={() => router.push('/gestion-usuarios')}
                className="group p-6 text-left bg-gradient-to-br from-indigo-50 to-blue-100 hover:from-indigo-100 hover:to-blue-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-indigo-200/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-indigo-600 text-3xl bg-indigo-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    👥
                  </div>
                  <svg className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">Gestionar Usuarios</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Administrar usuarios y permisos del sistema
                </p>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
