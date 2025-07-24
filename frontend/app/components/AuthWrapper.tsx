'use client';

import { useAuth } from '../hooks/useAuth';
import LogoutButton from './LogoutButton';
import Navigation from './Navigation';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading, isAuthenticated } = useAuth();

  // Si está cargando, mostrar loader sin navegación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar navegación
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <main className="relative">
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>
        
        {/* Background decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-200 to-cyan-200 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar layout completo con navegación
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="min-h-full">
        <Navigation key={`nav-${user.id}-${user.roles.join('-')}`} />
        <main className="relative">
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>
        <LogoutButton />
      </div>
      
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-200 to-cyan-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
    </div>
  );
}
