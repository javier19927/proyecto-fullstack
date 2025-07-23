import { Router } from 'express';
import { AuditoriaController } from '../controllers/auditoriaController';
import { BitacoraController } from '../controllers/bitacoraController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// 🛡️ Aplicar middleware de autenticacion a todas las rutas
router.use(verifyToken);

// 📝 RUTAS PARA AUDITORIA

// Registrar accion en auditoria
router.post('/', AuditoriaController.registrarAuditoria);

// Listar auditorias (con filtros)
router.get('/', AuditoriaController.listarAuditorias);

// Consultar accion especifica por ID
router.get('/:id', AuditoriaController.consultarAccion);

// Obtener estadisticas de auditoria
router.get('/estadisticas/resumen', AuditoriaController.obtenerEstadisticas);

// 📋 RUTAS PARA BITACORA

// Registrar evento en bitacora
router.post('/bitacora', BitacoraController.registrarEvento);

// Listar eventos de bitacora (con filtros)
router.get('/bitacora', BitacoraController.listarEventos);

// Consultar evento especifico de bitacora por ID
router.get('/bitacora/:id', BitacoraController.consultarAccion);

// Obtener estadisticas de bitacora
router.get('/bitacora/estadisticas/resumen', BitacoraController.obtenerEstadisticas);

export default router;
