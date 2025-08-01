'use client';

import { useAuth } from '../hooks/useAuth';

interface ValidatorOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ValidatorOnly({ 
  children, 
  fallback = (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acceso Restringido
        </h3>
        <p className="text-gray-500">
          Esta página está disponible solo para Autoridades Validadoras (VALID).
        </p>
      </div>
    </div>
  )
}: ValidatorOnlyProps) {
  const { user, isAuthenticated } = useAuth();

  // Si no está autenticado o no tiene el rol VALID, mostrar fallback
  if (!isAuthenticated || !user?.roles?.includes('VALID')) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
