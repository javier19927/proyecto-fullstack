import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../models';

interface AuthenticatedRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    roles: string[];
    institucion_id?: number;
  };
}

// Middleware para verificar JWT token
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 [AUTH] Verificando token:', {
    authHeader: authHeader ? 'Bearer ***' : 'No header',
    method: req.method,
    url: req.originalUrl
  });

  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ [AUTH] No token provided');
    const response: ApiResponse<null> = {
      success: false,
      error: 'Token de acceso requerido'
    };
    return res.status(401).json(response);
  }

  try {
    console.log('🔍 [AUTH] Decodificando token...');
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    console.log('🔍 [AUTH] JWT Secret configurado:', jwtSecret ? 'Si' : 'No');
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log('🔍 [AUTH] Token decodificado:', {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
      institucion_id: decoded.institucion_id
    });

    req.usuario = {
      id: decoded.userId,
      email: decoded.email,
      roles: decoded.roles || [],
      institucion_id: decoded.institucion_id
    };
    
    console.log('✅ [AUTH] Token valido, usuario autenticado');
    next();
  } catch (error) {
    console.error('❌ [AUTH] Error verificando token:', error);
    console.error('❌ [AUTH] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Token invalido'
    };
    return res.status(403).json(response);
  }
};

// Middleware para verificar roles especificos
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no autenticado'
      };
      return res.status(401).json(response);
    }

    const userRoles = req.usuario.roles || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No tienes permisos para acceder a este recurso'
      };
      return res.status(403).json(response);
    }

    next();
  };
};

// Middlewares especificos para cada rol
export const requireAdmin = requireRole(['ADMIN']);
export const requirePlanificador = requireRole(['ADMIN', 'PLANIF']);
export const requireValidador = requireRole(['ADMIN', 'VALID']);
export const requireRevisor = requireRole(['ADMIN', 'REVISOR']);

// Middleware que permite solo lectura a ciertos roles
export const requireReadAccess = requireRole(['ADMIN', 'PLANIF', 'VALID', 'REVISOR']);
