'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import UserManagement from '../components/UserManagement';
import { useAuth } from '../hooks/useAuth';

export default function GestionUsuariosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.roles?.includes('ADMIN'))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.roles?.includes('ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="mt-2 text-lg font-medium text-gray-900">Acceso Restringido</h2>
          <p className="mt-1 text-sm text-gray-500">
            Solo los administradores pueden acceder a la gestión de usuarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <UserManagement />
      </div>
    </div>
  );
}
