import { NextFunction, Request, Response } from 'express';
import { PERMISOS, tieneAccesoModulo, tienePermiso } from './rolePermissions';

interface AuthenticatedRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    roles: string[];
  };
}

// Middleware para verificar permisos especificos
export const verificarPermiso = (permisoRequerido: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    console.log('🔍 [PERMISSION] Verificando permiso:', {
      permisoRequerido,
      usuario: usuario ? {
        id: usuario.id,
        email: usuario.email,
        roles: usuario.roles
      } : null
    });

    if (!usuario) {
      console.log('❌ [PERMISSION] Usuario no autenticado');
      return res.status(401).json({
        success: false,
        message: '❌ No autenticado'
      });
    }

    // Verificar si el usuario tiene el permiso especifico
    const tieneElPermiso = tienePermiso(usuario.roles, permisoRequerido);
    console.log('🔍 [PERMISSION] Resultado verificacion:', {
      tieneElPermiso,
      rolesUsuario: usuario.roles,
      permisoRequerido
    });

    if (!tieneElPermiso) {
      console.log('❌ [PERMISSION] Permiso denegado');
      return res.status(403).json({
        success: false,
        message: '🚫 No tienes permisos para realizar esta accion',
        permiso_requerido: permisoRequerido,
        roles_usuario: usuario.roles
      });
    }

    console.log('✅ [PERMISSION] Permiso concedido, continuando...');
    next();
  };
};

// Middleware para verificar multiples permisos (cualquiera)
export const verificarCualquierPermiso = (permisosRequeridos: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: '❌ No autenticado'
      });
    }

    // Verificar si tiene al menos uno de los permisos
    const tieneAlgunPermiso = permisosRequeridos.some(permiso => 
      tienePermiso(usuario.roles, permiso)
    );

    if (!tieneAlgunPermiso) {
      return res.status(403).json({
        success: false,
        message: '🚫 No tienes permisos para realizar esta accion',
        permisos_requeridos: permisosRequeridos,
        roles_usuario: usuario.roles
      });
    }

    next();
  };
};

// Middleware para verificar todos los permisos
export const verificarTodosLosPermisos = (permisosRequeridos: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: '❌ No autenticado'
      });
    }

    // Verificar si tiene todos los permisos
    const tieneTodosLosPermisos = permisosRequeridos.every(permiso => 
      tienePermiso(usuario.roles, permiso)
    );

    if (!tieneTodosLosPermisos) {
      return res.status(403).json({
        success: false,
        message: '🚫 No tienes todos los permisos necesarios para realizar esta accion',
        permisos_requeridos: permisosRequeridos,
        roles_usuario: usuario.roles
      });
    }

    next();
  };
};

// Middleware solo para administradores
export const soloAdministradores = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const usuario = req.usuario;

  if (!usuario) {
    return res.status(401).json({
      success: false,
      message: '❌ No autenticado'
    });
  }

  if (!usuario.roles.includes('ADMIN')) {
    return res.status(403).json({
      success: false,
      message: '🚫 Esta funcionalidad esta restringida solo para administradores',
      rol_requerido: 'ADMIN',
      roles_usuario: usuario.roles
    });
  }

  next();
};

// Middleware para verificar acceso a modulo especifico
export const verificarAccesoModulo = (modulo: keyof typeof PERMISOS) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: '❌ No autenticado'
      });
    }

    if (!tieneAccesoModulo(usuario.roles, modulo)) {
      return res.status(403).json({
        success: false,
        message: `🚫 No tienes acceso al modulo de ${modulo.replace('_', ' ')}`,
        modulo_requerido: modulo,
        roles_usuario: usuario.roles
      });
    }

    next();
  };
};

// Middlewares especificos para modulos
export const accesoConfiguracionInstitucional = verificarAccesoModulo('CONFIGURACION_INSTITUCIONAL');
export const accesoGestionObjetivos = verificarAccesoModulo('GESTION_OBJETIVOS');
export const accesoProyectosInversion = verificarAccesoModulo('PROYECTOS_INVERSION');

// Middlewares especificos para operaciones de usuarios
export const puedeCrearUsuarios = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.CREAR_USUARIO);
export const puedeModificarUsuarios = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.MODIFICAR_USUARIO);
export const puedeVerUsuarios = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_USUARIOS);
export const puedeAsignarRoles = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.ASIGNAR_ROL);
export const puedeCambiarPasswords = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.CAMBIAR_PASSWORD);
export const puedeActivarUsuarios = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.ACTIVAR_USUARIO);

// Middlewares especificos para operaciones de instituciones
export const puedeRegistrarInstituciones = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.REGISTRAR_INSTITUCION);
export const puedeEditarInstituciones = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.EDITAR_INSTITUCION);
export const puedeActivarInstituciones = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.ACTIVAR_INSTITUCION);
export const puedeInactivarInstituciones = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.INACTIVAR_INSTITUCION);
export const puedeVerInstituciones = verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_INSTITUCIONES);
