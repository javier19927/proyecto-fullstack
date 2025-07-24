'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      logout();
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // No mostrar el boton en la pagina de login o si no esta autenticado
  if (!isAuthenticated || pathname === '/login') {
    return null;
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`
        fixed bottom-4 right-4 z-50
        bg-red-600 hover:bg-red-700 
        text-white font-medium
        px-4 py-2 rounded-full shadow-lg
        transition-all duration-200
        flex items-center space-x-2
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:scale-105'}
      `}
      title="Cerrar Sesion"
    >
      <span className="hidden sm:inline text-sm">
        {isLoading ? 'Cerrando...' : 'Cerrar Sesion'}
      </span>
      <span className="sm:hidden text-sm">
        {isLoading ? '...' : 'Salir'}
      </span>
      <svg 
        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        {isLoading ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        )}
      </svg>
    </button>
  );
}
