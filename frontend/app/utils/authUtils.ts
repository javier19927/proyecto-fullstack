// Utilidades para validar y limpiar datos de autenticación

export interface User {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  permisos?: string[];
}

export const validateUserData = (userData: any): User | null => {
  try {
    if (!userData || typeof userData !== 'object') {
      return null;
    }

    // Verificar campos obligatorios
    const { id, nombre, email, roles } = userData;
    
    if (!id || typeof id !== 'number') {
      console.warn('ID de usuario inválido');
      return null;
    }

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      console.warn('Nombre de usuario inválido');
      return null;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.warn('Email de usuario inválido');
      return null;
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      console.warn('Roles de usuario inválidos');
      return null;
    }

    // Validar que todos los roles sean strings válidos
    const validRoles = ['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'CONSUL'];
    const userRoles = roles.filter(role => 
      typeof role === 'string' && validRoles.includes(role.toUpperCase())
    );

    if (userRoles.length === 0) {
      console.warn('No se encontraron roles válidos');
      return null;
    }

    return {
      id,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      roles: userRoles.map(role => role.toUpperCase()),
      permisos: Array.isArray(userData.permisos) ? userData.permisos : []
    };
  } catch (error) {
    console.error('Error validando datos de usuario:', error);
    return null;
  }
};

export const validateToken = (token: any): string | null => {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return null;
  }
  
  // Verificar formato básico de JWT
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.warn('Token JWT con formato inválido');
    return null;
  }

  return token.trim();
};

export const clearAuthData = (): void => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('Datos de autenticación limpiados');
  } catch (error) {
    console.error('Error limpiando datos de autenticación:', error);
  }
};

export const getValidAuthData = (): { user: User; token: string } | null => {
  try {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      return null;
    }

    const token = validateToken(storedToken);
    if (!token) {
      clearAuthData();
      return null;
    }

    const parsedUser = JSON.parse(storedUser);
    const user = validateUserData(parsedUser);
    
    if (!user) {
      clearAuthData();
      return null;
    }

    return { user, token };
  } catch (error) {
    console.error('Error obteniendo datos de autenticación:', error);
    clearAuthData();
    return null;
  }
};
