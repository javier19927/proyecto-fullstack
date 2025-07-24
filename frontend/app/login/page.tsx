'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG } from '../utils/apiConfig';

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: number;
      nombre: string;
      email: string;
      roles: string[];
      permisos: string[];
    };
    token: string;
    expiresIn: string;
  };
  error?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, setUserData } = useAuth();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // No mostrar el formulario si ya está autenticado
  if (isAuthenticated) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post<LoginResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
        email,
        password
      });

      if (response.data.success && response.data.data) {
        // Actualizar el estado inmediatamente usando el hook
        setUserData(response.data.data.user, response.data.data.token);
        
        // Redirigir al dashboard
        router.push('/dashboard');
      } else {
        setError(response.data.error || 'Error al iniciar sesion');
      }
    } catch (error: any) {
      console.error('Error de login:', error);
      setError(error.response?.data?.error || 'Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Corporate Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgb(148, 163, 184)" strokeWidth="1" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Corporate Header */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-700 to-blue-800 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="space-y-3">
            <h1 className="heading-2 text-slate-900">Sistema de Planificación</h1>
            <h2 className="heading-3 text-slate-700">Estratégica Institucional</h2>
            <p className="body-medium text-slate-600 max-w-sm mx-auto">
              Plataforma integral para la gestión de objetivos estratégicos y proyectos institucionales
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mx-auto"></div>
          </div>
        </div>

        {/* Corporate Login Form */}
        <div className="corporate-card-elevated">
          <div className="text-center mb-8">
            <h3 className="heading-4 text-slate-900 mb-2">Acceso al Sistema</h3>
            <p className="body-small text-slate-600">Ingrese sus credenciales para continuar</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="label-large text-slate-700 mb-3 block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-field pl-12"
                    placeholder="usuario@institucion.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="label-large text-slate-700 mb-3 block">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="input-field pl-12"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="status-error">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
              >
                <span className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="spinner text-white mr-3"></div>
                      Verificando credenciales...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Iniciar Sesión
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="text-center">
                <p className="body-small text-slate-500">
                  ¿Necesita acceso al sistema?{' '}
                  <span className="text-blue-600 font-semibold">Contacte al administrador</span>
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Information */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-6 text-slate-500">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">Seguro</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">Privado</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm">Rápido</span>
            </div>
          </div>
          <p className="body-small text-slate-400">
            © 2025 Sistema de Planificación Estratégica. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
