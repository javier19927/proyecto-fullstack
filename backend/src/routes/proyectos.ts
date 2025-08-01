import { Router } from 'express';
import pool from '../database/connection';
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
    getEstadisticasProyectos,
    getProyectoById,
    getProyectos,
    getProyectosConActividades,
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

// 🔹 Nuevas rutas para ejemplos POA e inversión
router.get('/con-actividades', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS), getProyectosConActividades);
router.get('/estadisticas', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS), getEstadisticasProyectos);

// ============================================
// RUTAS ESPECIFICAS PARA REVISOR INSTITUCIONAL
// ============================================

// Obtener proyectos pendientes de revisión (solo para REVISOR)
router.get('/pendientes-revision', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), async (req, res) => {
  try {
    console.log('🔍 [PROYECTOS] Obteniendo proyectos pendientes de revisión');
    
    // Solo proyectos en estado 'Enviado' o 'EN_REVISION'
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.descripcion, p.estado,
        p.presupuesto_total, p.fecha_inicio, p.fecha_fin, p.created_at,
        i.nombre as institucion_nombre,
        u.nombre as responsable_nombre,
        o.descripcion as objetivo_asociado,
        COUNT(a.id) as actividades_count,
        p.created_at as fecha_envio
      FROM proyecto p
      LEFT JOIN institucion i ON p.institucion_id = i.id
      LEFT JOIN usuario u ON p.responsable_id = u.id
      LEFT JOIN objetivo o ON p.objetivo_id = o.id
      LEFT JOIN actividad a ON p.id = a.proyecto_id
      WHERE p.estado IN ('Enviado', 'EN_REVISION')
      GROUP BY p.id, i.nombre, u.nombre, o.descripcion
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      message: '✅ Proyectos pendientes de revisión obtenidos',
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error obteniendo proyectos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo proyectos pendientes de revisión'
    });
  }
});

// Obtener historial de revisiones (solo para REVISOR)
router.get('/revision/historial', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_VALIDACIONES_PROYECTO), async (req, res) => {
  try {
    console.log('🔍 [PROYECTOS] Obteniendo historial de revisiones');
    
    const pool = (global as any).pool;
    const usuario = (req as any).usuario;
    
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.descripcion, p.estado,
        p.presupuesto_total, p.fecha_revision, p.observaciones_revision,
        i.nombre as institucion_nombre,
        u.nombre as responsable_nombre,
        ur.nombre as revisor_nombre
      FROM proyecto p
      LEFT JOIN institucion i ON p.institucion_id = i.id
      LEFT JOIN usuario u ON p.responsable_id = u.id
      LEFT JOIN usuario ur ON p.revisado_por = ur.id
      WHERE p.estado IN ('Aprobado', 'Rechazado') 
      AND p.revisado_por = $1
      ORDER BY p.fecha_revision DESC
    `;
    
    const result = await pool.query(query, [usuario.id]);
    
    res.json({
      success: true,
      message: '✅ Historial de revisiones obtenido',
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial de revisiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de revisiones'
    });
  }
});

// Obtener todos los proyectos para revisión (solo para REVISOR)
router.get('/revision/todos', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS), async (req, res) => {
  try {
    console.log('🔍 [PROYECTOS] Obteniendo todos los proyectos para revisión');
    
    const pool = (global as any).pool;
    
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.descripcion, p.estado,
        p.presupuesto_total, p.fecha_inicio, p.fecha_fin, p.created_at,
        i.nombre as institucion_nombre,
        u.nombre as responsable_nombre,
        o.nombre as objetivo_asociado,
        COUNT(a.id) as actividades_count
      FROM proyecto p
      LEFT JOIN institucion i ON p.institucion_id = i.id
      LEFT JOIN usuario u ON p.responsable_id = u.id
      LEFT JOIN objetivo o ON p.objetivo_id = o.id
      LEFT JOIN actividad a ON p.id = a.proyecto_id
      WHERE p.estado IN ('Borrador', 'Enviado', 'EN_REVISION', 'Aprobado', 'Rechazado')
      GROUP BY p.id, i.nombre, u.nombre, o.nombre
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      message: '✅ Todos los proyectos obtenidos',
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error obteniendo proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo proyectos'
    });
  }
});

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

// Rutas específicas para workflows de revisión
router.post('/:id/aprobar-revision', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const usuario = (req as any).usuario;
    
    console.log('✅ [PROYECTOS] Aprobando proyecto en revisión:', { id, usuario: usuario.id });
    
    // Actualizar estado del proyecto
    const updateQuery = `
      UPDATE proyecto 
      SET estado = 'Aprobado', 
          observaciones = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado IN ('Enviado', 'EN_REVISION')
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [observaciones || '', id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado o no está en estado de revisión'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Proyecto aprobado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error aprobando proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error aprobando proyecto'
    });
  }
});

router.post('/:id/rechazar-revision', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const usuario = (req as any).usuario;
    
    if (!observaciones || !observaciones.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Las observaciones son obligatorias para rechazar un proyecto'
      });
    }
    
    console.log('❌ [PROYECTOS] Rechazando proyecto en revisión:', { id, usuario: usuario.id });
    
    // Actualizar estado del proyecto
    const updateQuery = `
      UPDATE proyecto 
      SET estado = 'Rechazado', 
          observaciones = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado IN ('Enviado', 'EN_REVISION')
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [observaciones, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado o no está en estado de revisión'
      });
    }
    
    res.json({
      success: true,
      message: '❌ Proyecto rechazado',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error rechazando proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error rechazando proyecto'
    });
  }
});

// Alias de metodos segun especificaciones exactas (con permisos)
router.put('/:id/editar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO), editarProyecto);

// Metodos de validacion segun especificaciones (con permisos)
router.post('/:id/validar', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), validarProyecto);
router.post('/:id/comentarios', verifyToken, verificarPermiso(PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO), agregarComentario);

export default router;
