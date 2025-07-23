import { Router } from 'express';
import { RolController } from '../controllers/rolController';
import { verifyToken } from '../middleware/authMiddleware';
import {
    accesoConfiguracionInstitucional,
    verificarPermiso
} from '../middleware/permissionMiddleware';
import { PERMISOS } from '../middleware/rolePermissions';

const router = Router();

// 🛡️ Aplicar middleware de autenticacion a todas las rutas
router.use(verifyToken);

// 🛡️ Verificar acceso al modulo de configuracion institucional
router.use(accesoConfiguracionInstitucional);

// 🔐 RUTAS PARA GESTION DE ROLES

// Listar todos los roles (requiere permiso VER_ROLES)
router.get('/', verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_ROLES), RolController.listarRoles);

// Obtener rol por ID (requiere permiso VER_ROLES)
router.get('/:id', verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_ROLES), RolController.obtenerRol);

// Crear nuevo rol (requiere permiso CREAR_ROL)
router.post('/', verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.CREAR_ROL), RolController.crearRol);

// Asignar permiso a rol (requiere permiso ASIGNAR_PERMISO)
router.post('/:rolId/permisos', verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.ASIGNAR_PERMISO), RolController.asignarPermiso);

// Obtener permisos de un usuario (requiere permiso VER_USUARIOS o ser el mismo usuario)
router.get('/usuarios/:id/permisos', RolController.obtenerPermisosUsuario);

// Asignar rol a usuario (requiere permiso ASIGNAR_ROL)
router.post('/asignar', verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.ASIGNAR_ROL), RolController.asignarRol);

// Remover rol de usuario (requiere permiso ASIGNAR_ROL)
router.post('/remover', verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.ASIGNAR_ROL), RolController.removerRol);

// Obtener informacion de permisos del sistema (requiere permiso VER_ROLES)
router.get('/sistema/permisos', verificarPermiso(PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_ROLES), RolController.obtenerInfoPermisos);

export default router;
