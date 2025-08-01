import { Router } from 'express';
import { UsuarioController } from '../controllers/usuarioController';
import { verifyToken } from '../middleware/authMiddleware';
import {
    accesoConfiguracionInstitucional,
    puedeActivarUsuarios,
    puedeCambiarPasswords,
    puedeCrearUsuarios,
    puedeModificarUsuarios,
    puedeVerUsuarios
} from '../middleware/permissionMiddleware';

const router = Router();

// 🛡️ Aplicar middleware de autenticacion a todas las rutas
router.use(verifyToken);

// Verificar acceso al modulo de configuracion institucional
router.use(accesoConfiguracionInstitucional);

// 👤 RUTAS PARA GESTION DE USUARIOS

// Listar todos los usuarios (requiere permiso VER_USUARIOS)
router.get('/', puedeVerUsuarios, UsuarioController.listarUsuarios);
router.get('/all', puedeVerUsuarios, UsuarioController.listarUsuarios);

// Obtener usuarios técnicos para filtros (accesible para validadores y auditores)
router.get('/tecnicos', puedeVerUsuarios, UsuarioController.obtenerUsuariosTecnicos);

// Obtener usuario por ID (requiere permiso VER_USUARIOS)
router.get('/:id', puedeVerUsuarios, UsuarioController.obtenerUsuario);

// 🔒 RUTAS QUE REQUIEREN PERMISOS ESPECIFICOS

// Crear nuevo usuario (requiere permiso CREAR_USUARIO)
router.post('/', puedeCrearUsuarios, UsuarioController.crearUsuario);

// Modificar usuario existente (requiere permiso MODIFICAR_USUARIO)
router.put('/:id', puedeModificarUsuarios, UsuarioController.modificarUsuario);

// Cambiar contrasena (requiere permiso CAMBIAR_PASSWORD)
router.put('/:id/password', puedeCambiarPasswords, UsuarioController.cambiarPassword);

// Restablecer contrasena (requiere permiso CAMBIAR_PASSWORD)
router.post('/:id/restablecer-password', puedeCambiarPasswords, UsuarioController.restablecerPassword);

// Activar usuario (requiere permiso ACTIVAR_USUARIO)
router.patch('/:id/activar', puedeActivarUsuarios, UsuarioController.activarUsuario);

// Inactivar usuario (requiere permiso ACTIVAR_USUARIO)
router.patch('/:id/inactivar', puedeActivarUsuarios, UsuarioController.inactivarUsuario);

export default router;
