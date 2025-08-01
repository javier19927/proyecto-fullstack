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
    REGISTRAR_EDITAR: ['ADMIN'] as string[], // ✅ Solo Administrador del Sistema puede registrar, editar instituciones, usuarios y roles
    VALIDAR: [] as string[], // ❌ No aplica validacion en este modulo
    CONSULTAR: ['ADMIN', 'PLANIF'] as string[] // ✅ Administrador completo, Tecnico Planificador (consulta limitada)
  },
  
  // MODULO 2: Gestion de Objetivos Estrategicos  
  GESTION_OBJETIVOS: {
    REGISTRAR_EDITAR: ['ADMIN', 'PLANIF'] as string[], // ✅ Administrador del Sistema y Tecnico Planificador
    VALIDAR: ['VALID'] as string[], // ✅ Solo Autoridad Validadora puede aprobar/rechazar objetivos
    CONSULTAR: ['ADMIN', 'PLANIF', 'VALID', 'AUDITOR', 'CONSUL'] as string[] // ✅ Todos excepto Revisor Institucional (sin acceso a objetivos)
  },
  
  // MODULO 3: Proyectos de Inversion
  PROYECTOS_INVERSION: {
    REGISTRAR_EDITAR: ['ADMIN', 'PLANIF'] as string[], // ✅ Administrador del Sistema y Tecnico Planificador
    VALIDAR: ['REVISOR'] as string[], // ✅ Solo Revisor Institucional puede aprobar/rechazar proyectos
    CONSULTAR: ['ADMIN', 'PLANIF', 'REVISOR', 'AUDITOR'] as string[] // ✅ Todos excepto Autoridad Validadora (sin acceso a proyectos)
  },
  
  // MODULO 4: Reportes
  REPORTES: {
    REGISTRAR_EDITAR: [] as string[], // ❌ No aplica para reportes
    VALIDAR: [] as string[], // ❌ No aplica para reportes
    CONSULTAR: ['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'AUDITOR'] as string[], // ✅ Todos los roles tienen acceso a reportes
    EXPORTAR_COMPLETO: ['ADMIN', 'PLANIF', 'AUDITOR'] as string[], // ✅ Exportacion completa
    EXPORTAR_LIMITADO: ['REVISOR', 'VALID'] as string[] // ✅ Exportacion limitada
  },
  
  // MODULO 5: Auditoria y Trazabilidad
  AUDITORIA: {
    REGISTRAR_EDITAR: [] as string[], // ❌ No aplica
    VALIDAR: [] as string[], // ❌ No aplica
    CONSULTAR: ['AUDITOR'] as string[] // ✅ Solo Auditor tiene acceso completo a auditoria y trazabilidad
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
              // Aplicar mapeo de roles también al cargar desde localStorage
              const roleMapping: { [key: string]: string } = {
                'VALIDADOR': 'VALID'
              };

              const mappedRoles = parsedUser.roles.map((role: string) => 
                roleMapping[role] || role
              );

              const userWithMappedRoles = {
                ...parsedUser,
                roles: mappedRoles
              };

              setToken(storedToken);
              setUser(userWithMappedRoles);
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
    // Mapear roles del sistema para consistencia
    const roleMapping: Record<string, string> = {
      'VALIDADOR': 'VALID',
      'AUDITOR': 'AUDITOR',
      'ADMIN': 'ADMIN',
      'PLANIF': 'PLANIF',
      'REVISOR': 'REVISOR',
      'CONSUL': 'CONSUL'
    };

    const mappedUserData = {
      ...userData,
      roles: userData.roles?.map(role => roleMapping[role] || role) || []
    };

    setUser(mappedUserData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(mappedUserData));
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

  // Funciones especificas por modulo con permisos granulares
  const permissions = {
    configuracionInstitucional: {
      canRegisterEdit: () => canRegisterEdit('CONFIGURACION_INSTITUCIONAL'),
      canValidate: () => canValidate('CONFIGURACION_INSTITUCIONAL'),
      canConsult: () => canConsult('CONFIGURACION_INSTITUCIONAL')
    },
    gestionObjetivos: {
      canRegisterEdit: () => canRegisterEdit('GESTION_OBJETIVOS'),
      canValidate: () => canValidate('GESTION_OBJETIVOS'), // Solo VALID (Autoridad Validadora)
      canConsult: () => canConsult('GESTION_OBJETIVOS')
    },
    proyectosInversion: {
      canRegisterEdit: () => canRegisterEdit('PROYECTOS_INVERSION'),
      canValidate: () => canValidate('PROYECTOS_INVERSION'), // Solo REVISOR (Revisor Institucional)
      canConsult: () => canConsult('PROYECTOS_INVERSION')
    },
    reportes: {
      canRegisterEdit: () => canRegisterEdit('REPORTES'),
      canValidate: () => canValidate('REPORTES'),
      canConsult: () => canConsult('REPORTES'),
      canExportComplete: () => user?.roles?.some(role => ['ADMIN', 'PLANIF', 'AUDITOR'].includes(role)) || false, // Exportacion completa
      canExportLimited: () => user?.roles?.some(role => ['REVISOR', 'VALID'].includes(role)) || false // Exportacion limitada
    },
    auditoria: {
      canRegisterEdit: () => canRegisterEdit('AUDITORIA'),
      canValidate: () => canValidate('AUDITORIA'),
      canConsult: () => canConsult('AUDITORIA') // Solo AUDITOR
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
