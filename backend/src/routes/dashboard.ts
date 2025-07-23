import { Router } from 'express';
import { getDashboardStats, getMenuByRole } from '../controllers/dashboardController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// ============================================
// RUTAS DE DASHBOARD POR ROL
// ============================================

// GET /api/dashboard/stats - Estadisticas del dashboard
router.get('/stats', verifyToken, getDashboardStats);

// GET /api/dashboard/menu - Menu basado en roles
router.get('/menu', verifyToken, getMenuByRole);

export default router;
