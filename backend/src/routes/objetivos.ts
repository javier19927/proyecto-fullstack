import { Router } from 'express';
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
