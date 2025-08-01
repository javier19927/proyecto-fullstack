import { Router } from 'express';
import { InstitucionController } from '../controllers/institucionController';
import { verifyToken } from '../middleware/authMiddleware';
import {
    accesoConfiguracionInstitucional,
    puedeActivarInstituciones,
    puedeEditarInstituciones,
    puedeInactivarInstituciones,
    puedeRegistrarInstituciones,
    puedeVerInstituciones
} from '../middleware/permissionMiddleware';

const router = Router();

// 🛡️ Aplicar middleware de autenticacion a todas las rutas
router.use(verifyToken);

// 🛡️ Verificar acceso al modulo de configuracion institucional
router.use(accesoConfiguracionInstitucional);

// 🏢 RUTAS PARA GESTION DE INSTITUCIONES

// Listar todas las instituciones (requiere solo autenticación para gestión de usuarios)
router.get('/', InstitucionController.listarInstituciones);
router.get('/all', InstitucionController.listarInstituciones);

// Obtener jerarquia institucional (requiere permiso VER_INSTITUCIONES)
router.get('/jerarquia/completa', puedeVerInstituciones, InstitucionController.obtenerJerarquia);

// Obtener institucion por ID (requiere permiso VER_INSTITUCIONES)
router.get('/:id', puedeVerInstituciones, InstitucionController.obtenerInstitucion);

// 🔒 RUTAS QUE REQUIEREN PERMISOS ESPECIFICOS

// Registrar nueva institucion (requiere permiso REGISTRAR_INSTITUCION)
router.post('/', puedeRegistrarInstituciones, InstitucionController.registrarInstitucion);

// Actualizar institucion existente (requiere permiso EDITAR_INSTITUCION)
router.put('/:id', puedeEditarInstituciones, InstitucionController.actualizarInstitucion);

// Activar institucion (requiere permiso ACTIVAR_INSTITUCION)
router.patch('/:id/activar', puedeActivarInstituciones, InstitucionController.activarInstitucion);

// Inactivar institucion (requiere permiso INACTIVAR_INSTITUCION)
router.patch('/:id/inactivar', puedeInactivarInstituciones, InstitucionController.inactivarInstitucion);

export default router;
