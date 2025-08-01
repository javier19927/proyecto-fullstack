import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { ApiResponse } from '../models';

interface AuthenticatedRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    roles: string[];
    nombre?: string;
    permisos?: string[];
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: number;
    nombre: string;
    email: string;
    roles: string[];
  };
  token: string;
  expiresIn: string;
}

// Login del usuario
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    console.log('🔐 Login attempt:', { email, passwordProvided: !!password });

    // Validaciones basicas
    if (!email || !password) {
      console.log('❌ Missing email or password');
      const response: ApiResponse<null> = {
        success: false,
        error: 'Email y contrasena son requeridos'
      };
      return res.status(400).json(response);
    }

    // Buscar usuario con roles e institucion
    const userResult = await pool.query(`
      SELECT 
        u.id, 
        CONCAT(u.nombre, ' ', u.apellido) as nombre, 
        u.email, 
        u.password, 
        u.estado, 
        u.institucion_id,
        ARRAY_AGG(DISTINCT r.codigo) FILTER (WHERE r.codigo IS NOT NULL) as roles
      FROM usuario u
      LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id AND ur.estado = true
      LEFT JOIN rol r ON ur.rol_id = r.id AND r.estado = true
      WHERE u.email = $1 AND u.estado = true
      GROUP BY u.id, u.nombre, u.apellido, u.email, u.password, u.estado, u.institucion_id
    `, [email]);

    console.log('👤 User query result:', { 
      found: userResult.rows.length > 0,
      userCount: userResult.rows.length 
    });

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      const response: ApiResponse<null> = {
        success: false,
        error: 'Credenciales invalidas'
      };
      return res.status(401).json(response);
    }

    const user = userResult.rows[0];
    console.log('👤 User found:', { 
      id: user.id, 
      email: user.email, 
      hasPassword: !!user.password,
      roles: user.roles 
    });

    // Verificar contrasena usando crypt de PostgreSQL
    const passwordCheck = await pool.query(`
      SELECT u.id
      FROM usuario u 
      WHERE u.email = $1 AND u.password = crypt($2, u.password) AND u.estado = true
    `, [email, password]);
    
    const isValidPassword = passwordCheck.rows.length > 0;
    
    console.log('🔑 Password validation:', { isValid: isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      const response: ApiResponse<null> = {
        success: false,
        error: 'Credenciales invalidas'
      };
      return res.status(401).json(response);
    }

    // Mapear roles del sistema para consistencia frontend
    const roleMapping: Record<string, string> = {
      'VALIDADOR': 'VALID',
      'AUDITOR': 'AUDITOR',
      'ADMIN': 'ADMIN',
      'PLANIF': 'PLANIF',
      'REVISOR': 'REVISOR',
      'CONSUL': 'CONSUL'
    };

    const mappedRoles = (user.roles || []).map((role: string) => 
      roleMapping[role] || role
    );

    // Generar JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roles: mappedRoles,
      institucion_id: user.institucion_id
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '8h' }
    );

    // Actualizar ultimo acceso
    await pool.query(
      'UPDATE usuario SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Respuesta exitosa
    const loginResponse: LoginResponse = {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        roles: mappedRoles
      },
      token,
      expiresIn: '8h'
    };

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: loginResponse,
      message: 'Login exitoso'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error en login:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Obtener informacion del usuario autenticado
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no autenticado'
      };
      return res.status(401).json(response);
    }

    // Obtener informacion completa del perfil
    const profileResult = await pool.query(`
      SELECT 
        u.id, (u.nombre || ' ' || u.apellido) as nombre, u.email, u.telefono, u.cargo, u.ultimo_acceso,
        u.created_at,
        i.nombre as institucion_nombre,
        ARRAY_AGG(DISTINCT r.codigo) FILTER (WHERE r.codigo IS NOT NULL) as roles,
        ARRAY_AGG(DISTINCT r.nombre) FILTER (WHERE r.nombre IS NOT NULL) as roles_nombres,
        ARRAY_AGG(DISTINCT p.codigo) FILTER (WHERE p.codigo IS NOT NULL) as permisos
      FROM usuario u
      LEFT JOIN institucion i ON u.institucion_id = i.id
      LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id AND ur.estado = true
      LEFT JOIN rol r ON ur.rol_id = r.id AND r.estado = true
      LEFT JOIN rol_permiso rp ON r.id = rp.rol_id
      LEFT JOIN permiso p ON rp.permiso_id = p.id
      WHERE u.id = $1 AND u.estado = true
      GROUP BY u.id, u.nombre, u.apellido, u.email, u.telefono, u.cargo, u.ultimo_acceso, u.created_at, i.nombre
    `, [req.usuario.id]);

    if (profileResult.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no encontrado'
      };
      return res.status(404).json(response);
    }

    const profile = profileResult.rows[0];

    // Mapear roles del sistema para consistencia frontend
    const roleMapping: Record<string, string> = {
      'VALIDADOR': 'VALID',
      'AUDITOR': 'AUDITOR',
      'ADMIN': 'ADMIN',
      'PLANIF': 'PLANIF',
      'REVISOR': 'REVISOR',
      'CONSUL': 'CONSUL'
    };

    const mappedRoles = (profile.roles || []).map((role: string) => 
      roleMapping[role] || role
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: profile.id,
        nombre: profile.nombre,
        email: profile.email,
        telefono: profile.telefono,
        cargo: profile.cargo,
        institucion: profile.institucion_nombre,
        ultimoAcceso: profile.ultimo_acceso,
        fechaRegistro: profile.created_at,
        roles: mappedRoles,
        rolesNombres: profile.roles_nombres || [],
        permisos: profile.permisos || []
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Renovar token
export const refreshToken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no autenticado'
      };
      return res.status(401).json(response);
    }

    // Generar nuevo token
    const tokenPayload = {
      userId: req.usuario.id,
      email: req.usuario.email,
      roles: req.usuario.roles
    };

    const newToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '8h' }
    );

    const response: ApiResponse<{ token: string; expiresIn: string }> = {
      success: true,
      data: {
        token: newToken,
        expiresIn: '8h'
      },
      message: 'Token renovado exitosamente'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al renovar token:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Logout (en este caso solo confirma logout del lado cliente)
export const logout = async (req: Request, res: Response) => {
  try {
    const response: ApiResponse<null> = {
      success: true,
      message: 'Logout exitoso'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error en logout:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Validar token (endpoint para verificar si el token es valido)
export const validateToken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Token invalido'
      };
      return res.status(401).json(response);
    }

    const response: ApiResponse<{ valid: boolean; user: any }> = {
      success: true,
      data: {
        valid: true,
        user: {
          id: req.usuario.id,
          nombre: req.usuario.nombre,
          email: req.usuario.email,
          roles: req.usuario.roles,
          permisos: req.usuario.permisos
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};
