'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface User {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  permisos?: string[];
}

// Mapeo de permisos por modulo segun la especificacion del sistema
const PERMISOS_MODULOS = {
  // MODULO 1: Configuracion Institucional
  CONFIGURACION_INSTITUCIONAL: {
    REGISTRAR_EDITAR: ['ADMIN'] as string[], // Solo Administrador ✓
    VALIDAR: [] as string[], // ❌ Administrador NO puede validar segun matriz actualizada
    CONSULTAR: ['ADMIN', 'PLANIF'] as string[] // Administrador ✓ y Tecnico ✓ segun matriz actualizada
  },
  
  // MODULO 2: Gestion de Objetivos Estrategicos  
  GESTION_OBJETIVOS: {
    REGISTRAR_EDITAR: ['ADMIN', 'PLANIF'] as string[], // Administrador ✓ y Tecnico ✓
    VALIDAR: ['VALID'] as string[], // Autoridad Validadora ✓ - Solo valida objetivos
    CONSULTAR: ['ADMIN', 'PLANIF', 'VALID', 'CONSUL'] as string[] // REVISOR removido - sin acceso segun matriz
  },
  
  // MODULO 3: Proyectos de Inversion
  PROYECTOS_INVERSION: {
    REGISTRAR_EDITAR: ['ADMIN', 'PLANIF'] as string[], // Administrador ✓ y Tecnico ✓
    VALIDAR: ['REVISOR'] as string[], // Solo Revisor ✓ (corregido - Admin NO puede ❌)
    CONSULTAR: ['ADMIN', 'PLANIF', 'REVISOR', 'CONSUL'] as string[] // Todos los roles que pueden consultar
  },
  
  // MODULO 4: Reportes
  REPORTES: {
    REGISTRAR_EDITAR: [] as string[], // No aplica para reportes
    VALIDAR: [] as string[], // No aplica para reportes
    CONSULTAR: ['ADMIN', 'PLANIF', 'REVISOR', 'VALID'] as string[] // Administrador ✓, Planificador ✓, Revisor ✓ y Validador ✓ segun matriz
  }
} as const;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si estamos en el navegador
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            // Validación básica del usuario
            if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.roles) {
              setToken(storedToken);
              setUser(parsedUser);
            } else {
              // Datos inválidos
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setToken(null);
              
              const currentPath = window.location.pathname;
              if (currentPath !== '/login' && currentPath !== '/') {
                router.push('/login');
              }
            }
          } catch (parseError) {
            // Error al parsear JSON
            console.error('Error parsing user data:', parseError);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
            router.push('/login');
          }
        } else {
          // No hay autenticacion válida
          setUser(null);
          setToken(null);
          
          // Solo redirigir si no estamos ya en login y no es la página raíz
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/') {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error al verificar autenticacion:', error);
        // En caso de error, limpiar todo
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Escuchar cambios en localStorage para sincronizar entre pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const setUserData = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  // Nuevas funciones de permisos segun la matriz de la especificacion
  const canRegisterEdit = (module: keyof typeof PERMISOS_MODULOS): boolean => {
    if (!user?.roles) return false;
    const allowedRoles = PERMISOS_MODULOS[module].REGISTRAR_EDITAR;
    return user.roles.some(role => allowedRoles.includes(role));
  };

  const canValidate = (module: keyof typeof PERMISOS_MODULOS): boolean => {
    if (!user?.roles) return false;
    const allowedRoles = PERMISOS_MODULOS[module].VALIDAR;
    return user.roles.some(role => allowedRoles.includes(role));
  };

  const canConsult = (module: keyof typeof PERMISOS_MODULOS): boolean => {
    if (!user?.roles) return false;
    const allowedRoles = PERMISOS_MODULOS[module].CONSULTAR;
    return user.roles.some(role => allowedRoles.includes(role));
  };

  // Funciones especificas por modulo
  const permissions = {
    configuracionInstitucional: {
      canRegisterEdit: () => canRegisterEdit('CONFIGURACION_INSTITUCIONAL'),
      canValidate: () => canValidate('CONFIGURACION_INSTITUCIONAL'),
      canConsult: () => canConsult('CONFIGURACION_INSTITUCIONAL')
    },
    gestionObjetivos: {
      canRegisterEdit: () => canRegisterEdit('GESTION_OBJETIVOS'),
      canValidate: () => canValidate('GESTION_OBJETIVOS'),
      canConsult: () => canConsult('GESTION_OBJETIVOS')
    },
    proyectosInversion: {
      canRegisterEdit: () => canRegisterEdit('PROYECTOS_INVERSION'),
      canValidate: () => canValidate('PROYECTOS_INVERSION'),
      canConsult: () => canConsult('PROYECTOS_INVERSION')
    },
    reportes: {
      canRegisterEdit: () => canRegisterEdit('REPORTES'),
      canValidate: () => canValidate('REPORTES'),
      canConsult: () => canConsult('REPORTES')
    }
  };

  return {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    logout,
    setUserData,
    hasRole,
    isAdmin,
    permissions,
    // Funciones legacy para compatibilidad
    canRegisterEdit,
    canValidate,
    canConsult
  };
};
