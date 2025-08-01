'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import NotificationSystem from './NotificationSystem';
import { 
  hasModuleAccess, 
  getRoleDescription, 
  getRoleShortDescription, 
  getRoleColors 
} from '../utils/rolePermissions';

interface User {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  permisos: string[];
}

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Cerrar menu movil cuando cambie el usuario o la ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [user, pathname]);

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

  // Si no está autenticado o está cargando, no mostrar nada
  if (loading || !isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const hasAccess = (module: string) => {
    return hasModuleAccess(user, module);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y navegacion principal */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold gradient-text">
                    Planificación
                  </span>
                  <div className="text-xs text-slate-500 font-medium">
                    Estratégica
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Navegacion desktop */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'nav-pill-active shadow-sm'
                    : 'nav-pill-inactive'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>

              {hasAccess('configuracion') && (
                <Link
                  href="/configuracion-institucional"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive('/configuracion-institucional')
                      ? 'nav-pill-active shadow-sm'
                      : 'nav-pill-inactive'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Configuración
                </Link>
              )}

              {hasAccess('objetivos') && (
                <Link
                  href="/gestion-objetivos"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive('/gestion-objetivos')
                      ? 'nav-pill-active shadow-sm'
                      : 'nav-pill-inactive'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Objetivos
                </Link>
              )}

              {hasAccess('proyectos') && (
                <Link
                  href="/gestion-proyectos"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive('/gestion-proyectos')
                      ? 'nav-pill-active shadow-sm'
                      : 'nav-pill-inactive'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Proyectos
                </Link>
              )}

              {hasAccess('reportes') && (
                <Link
                  href="/reportes"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive('/reportes')
                      ? 'nav-pill-active shadow-sm'
                      : 'nav-pill-inactive'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reportes
                </Link>
              )}

              {hasAccess('usuarios') && (
                <Link
                  href="/gestion-usuarios"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive('/gestion-usuarios')
                      ? 'nav-pill-active shadow-sm'
                      : 'nav-pill-inactive'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Usuarios
                </Link>
              )}

              {hasAccess('auditoria') && (
                <Link
                  href="/auditoria"
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive('/auditoria')
                      ? 'nav-pill-active shadow-sm'
                      : 'nav-pill-inactive'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Auditoría
                </Link>
              )}
            </div>
          </div>

          {/* Usuario y cerrar sesion */}
          <div className="flex items-center space-x-4">
            {/* Informacion del usuario - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">{fixEncoding(user.nombre)}</div>
                <div className="text-xs text-gray-500 mb-1">
                  {getRoleDescription(user.roles[0] || '')}
                </div>
                <div className="flex justify-end space-x-1">
                  {user.roles.map((role, index) => {
                    const colors = getRoleColors(role);
                    return (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                      >
                        {getRoleShortDescription(role)}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg">
                {fixEncoding(user.nombre) ? fixEncoding(user.nombre).charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Sistema de Notificaciones */}
            <NotificationSystem className="hidden md:block" />
            
            {/* Boton cerrar sesion - Siempre visible */}
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              title="Cerrar Sesion"
            >
              <span className="hidden sm:inline">Cerrar Sesion</span>
              <span className="sm:hidden">Salir</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Boton menu movil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menu principal</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Menu movil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/dashboard"
                className={`block pl-3 pr-4 py-2 text-base font-medium ${
                  isActive('/dashboard')
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                🏠 Dashboard
              </Link>

              {hasAccess('configuracion') && (
                <Link
                  href="/configuracion-institucional"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/configuracion-institucional')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🏢 Configuracion
                </Link>
              )}

              {hasAccess('objetivos') && (
                <Link
                  href="/gestion-objetivos"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/gestion-objetivos')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🎯 Objetivos
                </Link>
              )}

              {hasAccess('proyectos') && (
                <Link
                  href="/gestion-proyectos"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/gestion-proyectos')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🚀 Proyectos
                </Link>
              )}

              {hasAccess('reportes') && (
                <Link
                  href="/reportes"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/reportes')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📊 Reportes
                </Link>
              )}

              {hasAccess('usuarios') && (
                <Link
                  href="/gestion-usuarios"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/gestion-usuarios')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👥 Usuarios
                </Link>
              )}

              {hasAccess('auditoria') && (
                <Link
                  href="/auditoria"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/auditoria')
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🕵️ Auditoría
                </Link>
              )}
            </div>

            {/* Informacion del usuario en movil */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-4">
                <div className="text-base font-medium text-gray-800">{fixEncoding(user.nombre)}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="text-xs text-gray-500 mb-2">
                  {getRoleDescription(user.roles[0] || '').replace(/👨‍💼|🧑‍💼|🧑‍⚖|🕵/, '').trim()}
                </div>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role, index) => {
                    const colors = getRoleColors(role);
                    return (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text.replace('700', '800')}`}
                      >
                        {getRoleShortDescription(role).replace(/👨‍💼|🧑‍💼|🧑‍⚖|🕵/, '').trim()}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
