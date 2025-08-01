import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import pool from '../database/connection';

const router = Router();

// Endpoint para obtener notificaciones específicas por rol
router.get('/mis-notificaciones', verifyToken, async (req, res) => {
  try {
    if (!(req as any).usuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const userRoles = (req as any).usuario.roles;
    let notificaciones: any[] = [];

    // Notificaciones para Validadores
    if (userRoles.includes('VALID')) {
      const objetivosResult = await pool.query(`
        SELECT 
          'objetivo' as tipo,
          id,
          codigo,
          descripcion as nombre,
          'Objetivo pendiente de validación' as mensaje,
          created_at as fecha,
          'warning' as prioridad
        FROM objetivo 
        WHERE estado = 'EN_VALIDACION'
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      notificaciones = [...notificaciones, ...objetivosResult.rows];
    }

    // Notificaciones para Revisores
    if (userRoles.includes('REVISOR')) {
      const proyectosResult = await pool.query(`
        SELECT 
          'proyecto' as tipo,
          id,
          codigo,
          nombre,
          'Proyecto pendiente de revisión' as mensaje,
          created_at as fecha,
          'info' as prioridad
        FROM proyecto 
        WHERE estado = 'Enviado'
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      notificaciones = [...notificaciones, ...proyectosResult.rows];
    }

    // Ordenar por fecha más reciente
    notificaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    res.json({
      success: true,
      data: notificaciones,
      message: notificaciones.length > 0 
        ? `${notificaciones.length} notificaciones encontradas`
        : 'No hay notificaciones pendientes'
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

export default router;
