'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CorporateActionCard from '../components/CorporateActionCard';
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
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <h3 className="heading-4 text-slate-900 mb-2">Cargando Dashboard...</h3>
          <p className="body-medium text-slate-600">Preparando su espacio de trabajo</p>
          <div className="mt-4 w-48 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full primary-gradient rounded-full animate-pulse"></div>
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
        {/* Corporate Header */}
        <div className="mb-8">
          <div className="corporate-card-elevated">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 primary-gradient rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="heading-2 text-slate-900 mb-1">
                      {user.roles?.includes('ADMIN') 
                        ? '👨‍💼 Bienvenido Administrador' 
                        : user.roles?.includes('PLANIF') 
                        ? '📋 Bienvenido Técnico Planificador'
                        : user.roles?.includes('REVISOR')
                        ? '🔍 Bienvenido Revisor Institucional'
                        : user.roles?.includes('VALID')
                        ? '⚖️ Bienvenido Validador de Proyectos'
                        : '🏠 Dashboard'}
                    </h1>
                    <div className="space-y-1">
                      <p className="body-medium text-slate-600">
                        <span className="font-semibold">Usuario:</span> {fixEncoding(user.nombre) || user.email}
                      </p>
                      <p className="body-small text-slate-500">
                        <span className="font-medium">Email:</span> {user.email}
                      </p>
                      <div className="inline-flex items-center">
                        <span className="body-small text-slate-500 font-medium mr-2">Rol:</span>
                        <span className="status-info">
                          {user.roles?.includes('ADMIN') ? 'Administrador del Sistema' 
                          : user.roles?.includes('PLANIF') ? 'Técnico Planificador' 
                          : user.roles?.includes('REVISOR') ? 'Revisor Institucional'
                          : user.roles?.includes('VALID') ? 'Validador de Proyectos'
                          : 'Usuario del Sistema'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <span className="label-medium text-slate-500">Roles activos:</span>
                  {user.roles?.map((role, index) => (
                    <span
                      key={index}
                      className={`status-${
                        role === 'ADMIN' ? 'success' 
                        : role === 'PLANIF' ? 'info'
                        : role === 'REVISOR' ? 'warning'
                        : role === 'VALID' ? 'neutral'
                        : 'neutral'
                      }`}
                    >
                      {role === 'ADMIN' ? '👨‍💼 Administrador' 
                        : role === 'PLANIF' ? '📋 Técnico Planificador' 
                        : role === 'REVISOR' ? '🔍 Revisor'
                        : role === 'VALID' ? '⚖️ Validador'
                        : role}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                {user.roles?.includes('ADMIN') && (
                  <div className="status-success">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>🔓 Acceso Total al Sistema</span>
                  </div>
                )}
                {user.roles?.includes('PLANIF') && (
                  <div className="status-info">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>📊 Acceso de Planificación Estratégica</span>
                  </div>
                )}
                {user.roles?.includes('REVISOR') && (
                  <div className="status-warning">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    <span>🔍 Acceso de Revisión Institucional</span>
                  </div>
                )}
                {user.roles?.includes('VALID') && (
                  <div className="status-neutral">
                    <div className="w-3 h-3 bg-slate-500 rounded-full animate-pulse"></div>
                    <span>⚖️ Acceso de Validación de Proyectos</span>
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
        <div className="corporate-card-elevated">
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-3 text-slate-900 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Accesos Rápidos
            </h3>
            <div className="body-small text-slate-500">
              Selecciona una acción para comenzar
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Gestionar Objetivos */}
            <CorporateActionCard
              title={user.roles?.includes('PLANIF') ? 'Registrar Objetivo' : 'Gestionar Objetivos'}
              description="Crear y administrar objetivos estratégicos institucionales"
              href="/gestion-objetivos"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
              disabled={!(user.roles?.includes('ADMIN') || user.roles?.includes('PLANIF') || user.roles?.includes('REVISOR') || user.roles?.includes('VALID'))}
            />

            {/* Gestionar Proyectos */}
            <CorporateActionCard
              title={user.roles?.includes('PLANIF') ? 'Registrar Proyecto' : 'Gestionar Proyectos'}
              description="Crear y administrar proyectos de inversión institucionales"
              href="/gestion-proyectos"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
              bgColor="bg-emerald-100"
              iconColor="text-emerald-600"
              disabled={!(user.roles?.includes('ADMIN') || user.roles?.includes('PLANIF') || user.roles?.includes('REVISOR'))}
            />

            {/* Generar Reportes */}
            <CorporateActionCard
              title="Generar Reportes"
              description="Crear reportes detallados de objetivos y proyectos"
              href="/reportes"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              bgColor="bg-purple-100"
              iconColor="text-purple-600"
              disabled={!(user.roles?.includes('ADMIN') || user.roles?.includes('PLANIF') || user.roles?.includes('REVISOR') || user.roles?.includes('VALID'))}
            />

            {/* Configuración Institucional */}
            <CorporateActionCard
              title="Configuración"
              description="Administrar configuración institucional del sistema"
              href="/configuracion-institucional"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              bgColor="bg-slate-100"
              iconColor="text-slate-600"
              disabled={!(user.roles?.includes('ADMIN') || user.roles?.includes('PLANIF'))}
            />

            {/* Gestionar Usuarios */}
            <CorporateActionCard
              title="Gestionar Usuarios"
              description="Administrar usuarios y permisos del sistema"
              href="/gestion-usuarios"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
              bgColor="bg-amber-100"
              iconColor="text-amber-600"
              disabled={!user.roles?.includes('ADMIN')}
            />

            {/* Diagnóstico del Sistema */}
            <CorporateActionCard
              title="Diagnóstico"
              description="Verificar el estado y conectividad del sistema"
              href="/diagnostico"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              bgColor="bg-cyan-100"
              iconColor="text-cyan-600"
              disabled={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
