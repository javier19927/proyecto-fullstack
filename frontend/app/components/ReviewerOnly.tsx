'use client';

import { useAuth } from '../hooks/useAuth';

interface ReviewerOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ReviewerOnly({ 
  children, 
  fallback = (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acceso Restringido
        </h3>
        <p className="text-gray-500">
          Esta página está disponible solo para Revisores Institucionales (REVISOR).
        </p>
      </div>
    </div>
  )
}: ReviewerOnlyProps) {
  const { user, isAuthenticated } = useAuth();

  // Si no está autenticado o no tiene el rol REVISOR, mostrar fallback
  if (!isAuthenticated || !user?.roles?.includes('REVISOR')) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
