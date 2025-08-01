import { Router } from 'express';
import pool from '../database/connection';
import {
  agregarIndicador,
  aprobarObjetivo,
  asociarPNDyODS,
  consultarODS,
  consultarPND,
  crearObjetivo,
  createMeta,
  createObjetivo,
  deleteObjetivo,
  editarIndicador,
  editarObjetivo,
  enviarAValidacion,
  filtrarObjetivosPorEstado,
  getIndicadoresByMeta,
  getMetasByObjetivo,
  getODS,
  getObjetivoById,
  getObjetivos,
  rechazarObjetivo,
  registrarMeta,
  updateMeta,
  updateMetaValue,
  updateObjetivo,
  validarObjetivo
} from '../controllers/objetivosController';
import { verifyToken } from '../middleware/authMiddleware';
import { verificarPermiso } from '../middleware/permissionMiddleware';
import { PERMISOS } from '../middleware/rolePermissions';

const router = Router();

// ============================================
// MIDDLEWARE DE AUTENTICACION GLOBAL
// ============================================
router.use(verifyToken);

// Middleware de debugging para todas las rutas de objetivos
router.use((req, res, next) => {
  console.log('🔍 [OBJETIVOS-ROUTE] Nueva peticion:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : 'N/A',
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : 'No Auth'
    },
    usuario: (req as any).usuario ? {
      id: (req as any).usuario.id,
      email: (req as any).usuario.email,
      roles: (req as any).usuario.roles
    } : 'No User'
  });
  next();
});

// ============================================
// RUTAS MODULO 2: GESTION DE OBJETIVOS ESTRATEGICOS
// ============================================

// PND (Plan Nacional de Desarrollo)
router.get('/pnd', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.CONSULTAR_PND), consultarPND);

// ODS (Objetivos de Desarrollo Sostenible)
router.get('/ods', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.CONSULTAR_ODS), getODS);
router.get('/ods/consultar', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.CONSULTAR_ODS), consultarODS);

// Objetivos - Rutas especificas primero
router.post('/crear', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.CREAR_OBJETIVO), crearObjetivo);
router.get('/filtrar', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS), filtrarObjetivosPorEstado);

// ============================================
// RUTAS ESPECIFICAS PARA AUTORIDAD VALIDADORA
// ============================================

// Obtener objetivos pendientes de validación (solo para VALID)
router.get('/pendientes-validacion', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VALIDAR_OBJETIVO), async (req, res) => {
  try {
    console.log('🔍 [OBJETIVOS] Obteniendo objetivos pendientes de validación');
    
    // Solo objetivos en estado EN_VALIDACION
    const query = `
      SELECT 
        o.id, o.codigo, o.descripcion, o.estado,
        o.prioridad, o.created_at,
        u.nombre as responsable_nombre,
        COUNT(m.id) as metas_count,
        COUNT(ind.id) as indicadores_count,
        o.created_at as fecha_envio
      FROM objetivo o
      LEFT JOIN usuario u ON o.responsable_id = u.id
      LEFT JOIN meta m ON o.id = m.objetivo_id
      LEFT JOIN indicador ind ON m.id = ind.meta_id
      WHERE o.estado = 'EN_VALIDACION'
      GROUP BY o.id, u.nombre
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      message: '✅ Objetivos pendientes de validación obtenidos',
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error obteniendo objetivos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo objetivos pendientes de validación'
    });
  }
});

// Objetivos - Rutas generales
router.get('/', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS), getObjetivos);
router.post('/', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.CREAR_OBJETIVO), createObjetivo);

// Objetivos - Rutas con parametros al final
router.get('/:id', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS), getObjetivoById);
router.put('/:id', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.EDITAR_OBJETIVO), updateObjetivo);
router.delete('/:id', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.ELIMINAR_OBJETIVO), deleteObjetivo);
router.put('/:id/editar', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.EDITAR_OBJETIVO), editarObjetivo);
router.put('/:id/asociar-pnd-ods', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.EDITAR_OBJETIVO), asociarPNDyODS);

// Validacion de objetivos
router.put('/:id/enviar-validacion', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.EDITAR_OBJETIVO), enviarAValidacion);
router.put('/:id/aprobar', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VALIDAR_OBJETIVO), aprobarObjetivo);
router.put('/:id/rechazar', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VALIDAR_OBJETIVO), rechazarObjetivo);
router.post('/:id/validar', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VALIDAR_OBJETIVO), validarObjetivo);

// Rutas específicas para workflows de validación
router.post('/:id/aprobar-validacion', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VALIDAR_OBJETIVO), async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const usuario = (req as any).usuario;
    
    console.log('✅ [OBJETIVOS] Aprobando objetivo en validación:', { 
      id, 
      usuario: usuario ? usuario.id : 'No usuario',
      observaciones: observaciones || 'Sin observaciones',
      method: req.method,
      url: req.originalUrl
    });
    
    if (!usuario) {
      console.log('❌ [OBJETIVOS] Usuario no encontrado en request');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    // Actualizar estado del objetivo
    const updateQuery = `
      UPDATE objetivo 
      SET estado = 'APROBADO', 
          fecha_validacion = NOW(),
          validado_por = $1,
          comentarios_validacion = $2
      WHERE id = $3 AND estado = 'EN_VALIDACION'
      RETURNING *
    `;
    
    console.log('🔍 [OBJETIVOS] Ejecutando query de actualización:', {
      query: updateQuery,
      params: [usuario.id, observaciones || '', id]
    });
    
    const result = await pool.query(updateQuery, [usuario.id, observaciones || '', id]);
    
    console.log('🔍 [OBJETIVOS] Resultado de la query:', {
      rowCount: result.rowCount,
      rows: result.rows.length
    });
    
    if (result.rows.length === 0) {
      console.log('❌ [OBJETIVOS] No se encontró objetivo o no está en validación');
      return res.status(404).json({
        success: false,
        message: 'Objetivo no encontrado o no está en estado de validación'
      });
    }
    
    console.log('✅ [OBJETIVOS] Objetivo aprobado exitosamente:', result.rows[0]);
    
    res.json({
      success: true,
      message: '✅ Objetivo aprobado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error aprobando objetivo:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      message: 'Error aprobando objetivo'
    });
  }
});

router.post('/:id/rechazar-validacion', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VALIDAR_OBJETIVO), async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const usuario = (req as any).usuario;
    
    if (!observaciones || !observaciones.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Las observaciones son obligatorias para rechazar un objetivo'
      });
    }
    
    console.log('❌ [OBJETIVOS] Rechazando objetivo en validación:', { id, usuario: usuario.id });
    
    // Actualizar estado del objetivo
    const updateQuery = `
      UPDATE objetivo 
      SET estado = 'RECHAZADO', 
          fecha_validacion = NOW(),
          validado_por = $1,
          comentarios_validacion = $2
      WHERE id = $3 AND estado = 'EN_VALIDACION'
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [usuario.id, observaciones, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Objetivo no encontrado o no está en estado de validación'
      });
    }
    
    res.json({
      success: true,
      message: '❌ Objetivo rechazado',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error rechazando objetivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error rechazando objetivo'
    });
  }
});

// Metas
router.get('/:objetivoId/metas', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS), getMetasByObjetivo);
router.post('/:objetivoId/metas', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.REGISTRAR_META), createMeta);
router.put('/metas/:metaId', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.REGISTRAR_META), updateMeta);
router.put('/metas/:metaId/actualizar-valor', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.REGISTRAR_META), updateMetaValue);
router.post('/metas/registrar', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.REGISTRAR_META), registrarMeta);

// Indicadores
router.get('/metas/:metaId/indicadores', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.VER_INDICADORES), getIndicadoresByMeta);
router.post('/indicadores', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.AGREGAR_INDICADOR), agregarIndicador);
router.put('/indicadores/:id', verificarPermiso(PERMISOS.GESTION_OBJETIVOS.EDITAR_INDICADOR), editarIndicador);

// Debug route - listar todas las rutas registradas
router.get('/debug/routes', (req, res) => {
  console.log('🔍 [DEBUG] Rutas disponibles en /api/objetivos:');
  router.stack.forEach((layer: any) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      console.log(`   ${methods} ${layer.route.path}`);
    }
  });
  res.json({ 
    message: 'Rutas listadas en consola',
    availableRoutes: router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        methods: Object.keys(layer.route.methods).join(', ').toUpperCase(),
        path: layer.route.path
      }))
  });
});

export default router;
