// Configuracion centralizada de URLs para la API
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001',
  ENDPOINTS: {
    // Autenticacion
    LOGIN: '/api/auth/login',
    
    // Dashboard
    DASHBOARD: '/api/dashboard',
    
    // Configuracion
    CONFIGURACION: '/api/configuracion',
    
    // Objetivos
    OBJETIVOS: '/api/objetivos',
    OBJETIVOS_CREAR: '/api/objetivos/crear',
    OBJETIVOS_FILTRAR: '/api/objetivos/filtrar',
    OBJETIVOS_PND: '/api/objetivos/pnd',
    OBJETIVOS_ODS: '/api/objetivos/ods',
    
    // Proyectos
    PROYECTOS: '/api/proyectos',
    PROYECTOS_CREAR: '/api/proyectos/crear',
    
    // Usuarios
    USUARIOS: '/api/usuarios',
    
    // Roles
    ROLES: '/api/roles',
    
    // Instituciones
    INSTITUCIONES: '/api/instituciones',
    
    // Health check
    HEALTH: '/health'
  }
} as const;

// Helper function para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function para construir headers comunes
export const buildHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
