import { Router } from 'express';
import {
    asignarRelaciones,
    consultarAccion,
    definirJerarquia,
    getPlanesInstitucionales,
    registrarAuditoria,
    registrarEvento
} from '../controllers/configuracionController';
import { verifyToken } from '../middleware/authMiddleware';
import { soloAdministradores } from '../middleware/permissionMiddleware';

const router = Router();

// 🛡️ Aplicar middleware de autenticacion a todas las rutas
router.use(verifyToken);

// ============================================
// RUTAS MODULO 1: CONFIGURACION INSTITUCIONAL
// ============================================

// 🧱 Configuracion de Jerarquias (requiere permisos de administrador)
router.post('/jerarquia/definir', soloAdministradores, definirJerarquia);
router.post('/jerarquia/asignar-relaciones', soloAdministradores, asignarRelaciones);

// Auditoria y Bitacora
router.post('/auditoria', registrarAuditoria);
router.post('/bitacora', registrarEvento);
router.get('/auditoria/consultar', consultarAccion);

// Planes Institucionales
router.get('/planes-institucionales', getPlanesInstitucionales);

export default router;
