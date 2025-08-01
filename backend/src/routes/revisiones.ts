import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Endpoint temporal para historial de revisiones - devuelve array vacío
router.get('/historial', verifyToken, async (req, res) => {
  try {
    // Por ahora retornamos array vacío para que no falle el frontend
    res.json({
      success: true,
      data: [],
      message: 'No hay historial de revisiones disponible'
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo historial de revisiones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Endpoint temporal para estadísticas de revisiones - devuelve objeto vacío
router.get('/estadisticas', verifyToken, async (req, res) => {
  try {
    // Por ahora retornamos estadísticas por defecto para que no falle el frontend
    res.json({
      success: true,
      data: {
        total_revisiones: 0,
        pendientes: 0,
        aprobadas: 0,
        rechazadas: 0,
        tiempo_promedio: 0
      },
      message: 'Estadísticas de revisiones no disponibles temporalmente'
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas de revisiones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

export default router;
