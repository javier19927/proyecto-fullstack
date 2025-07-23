import { Router } from 'express';
import {
    actualizarActividad,
    actualizarPresupuesto,
    agregarComentario,
    aprobarProyecto,
    asignarPresupuesto,
    consultarProyectosPorEstado,
    crearProyecto,
    createActividad,
    createProyecto,
    deleteProyecto,
    editarProyecto,
    eliminarActividad,
    eliminarProyecto,
    enviarAValidacionProyecto,
    finalizarProyecto,
    getActividadesByProyecto,
    getProyectoById,
    getProyectos,
    getValidacionesByProyecto,
    iniciarEjecucion,
    monitorearProyectos,
    rechazarProyecto,
    registrarActividad,
    revisarPresupuesto,
    updateProyecto,
    validarProyecto
} from '../controllers/proyectosController';
import { verifyToken } from '../middleware/authMiddleware';
import { verificarPermiso } from '../middleware/permissionMiddleware';
import { PERMISOS } from '../middleware/rolePermissions';

const router = Router();

// ============================================
// RUTAS MODULO 3: PROYECTOS DE INVERSION
// ============================================

// 🔹 7. Consultar, filtrar y monitorear proyectos (ANTES de rutas con parametros)
router.get('/consultar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS), consultarProyectosPorEstado);
router.get('/monitorear', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS), monitorearProyectos);

// Proyectos con autenticación y permisos
router.get('/', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS), getProyectos);
router.get('/:id', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS), getProyectoById);
router.post('/', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.CREAR_PROYECTO), createProyecto);
router.put('/:id', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO), updateProyecto);
router.delete('/:id', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.ELIMINAR_PROYECTO), deleteProyecto);

// Metodos especificos segun especificaciones (con permisos)
router.post('/crear', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.CREAR_PROYECTO), crearProyecto);
router.delete('/:id/eliminar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.ELIMINAR_PROYECTO), eliminarProyecto);

// Flujo de validacion de proyectos (con permisos)
router.put('/:id/enviar-validacion', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO), enviarAValidacionProyecto);
router.put('/:id/aprobar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), aprobarProyecto);
router.put('/:id/rechazar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), rechazarProyecto);
router.put('/:id/iniciar-ejecucion', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO), iniciarEjecucion);
router.put('/:id/finalizar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO), finalizarProyecto);

// Gestion de presupuesto (con permisos)
router.put('/:id/presupuesto', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO), actualizarPresupuesto);
router.post('/:proyectoId/presupuesto/asignar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.ASIGNAR_PRESUPUESTO), asignarPresupuesto);
router.get('/presupuesto/revisar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.REVISAR_PRESUPUESTO), revisarPresupuesto);

// Actividades (con permisos)
router.get('/:proyectoId/actividades', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_ACTIVIDADES), getActividadesByProyecto);
router.post('/:proyectoId/actividades', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.REGISTRAR_ACTIVIDAD), createActividad);
router.put('/actividades/:id', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.ACTUALIZAR_ACTIVIDAD), actualizarActividad);
router.post('/:proyectoId/actividades/registrar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.REGISTRAR_ACTIVIDAD), registrarActividad);
router.delete('/actividades/:id', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.ELIMINAR_PROYECTO), eliminarActividad);

// Validaciones (con permisos)
router.get('/:proyectoId/validaciones', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS), getValidacionesByProyecto);

// Alias de metodos segun especificaciones exactas (con permisos)
router.put('/:id/editar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO), editarProyecto);

// Metodos de validacion segun especificaciones (con permisos)
router.post('/:id/validar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), validarProyecto);
router.post('/:id/comentarios', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), agregarComentario);

export default router;
