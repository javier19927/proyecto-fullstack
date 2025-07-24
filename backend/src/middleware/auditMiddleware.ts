// ================================================================
// MIDDLEWARE DE AUDITORÍA AUTOMÁTICA
// Captura automática de todas las acciones del módulo de reportes
// para garantizar la trazabilidad completa según especificaciones
// ================================================================

import { NextFunction, Request, Response } from 'express';
import pool from '../database/connection';
import logger from '../utils/logger';

interface AuditLog {
  accion: string;
  modulo: string;
  tabla: string;
  registro_id?: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  ip_address?: string;
  user_agent?: string;
  resultado: 'exitoso' | 'error';
  mensaje?: string;
}

/**
 * Middleware para auditoría automática de acciones del módulo de reportes
 * Registra TODAS las acciones para garantizar trazabilidad completa
 */
export const auditReportesMiddleware = (accion: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const inicioTime = Date.now();
    const usuario = (req as any).usuario;
    
    // Información base de la auditoría
    const auditInfo: AuditLog = {
      accion,
      modulo: 'REPORTES',
      tabla: 'reportes_acceso',
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      resultado: 'exitoso',
      datos_nuevos: {
        query_params: req.query,
        body_params: req.body,
        filtros_aplicados: req.body.filtros || req.query,
        timestamp: new Date().toISOString()
      }
    };

    // Interceptar la respuesta para capturar el resultado
    const originalSend = res.send;
    let responseData: any;
    
    res.send = function(data: any) {
      responseData = data;
      return originalSend.call(this, data);
    };

    // Continuar con el siguiente middleware/controlador
    res.on('finish', async () => {
      const tiempoEjecucion = Date.now() - inicioTime;
      
      try {
        // Determinar si la operación fue exitosa
        if (res.statusCode >= 400) {
          auditInfo.resultado = 'error';
          auditInfo.mensaje = `Error ${res.statusCode}`;
        }

        // Agregar información del resultado
        auditInfo.datos_nuevos = {
          ...auditInfo.datos_nuevos,
          status_code: res.statusCode,
          tiempo_ejecucion_ms: tiempoEjecucion,
          response_size: JSON.stringify(responseData || {}).length
        };

        // Registrar en base de datos
        await registrarAuditoriaReportes(usuario, auditInfo);
        
        // Log local para desarrollo
        logger.info('Auditoría de reportes registrada', {
          usuario_id: usuario?.id,
          accion,
          resultado: auditInfo.resultado,
          tiempo_ms: tiempoEjecucion
        });

      } catch (error) {
        logger.error('Error al registrar auditoría de reportes', error as Error);
      }
    });

    next();
  };
};

/**
 * Registra la auditoría específica para el módulo de reportes
 */
async function registrarAuditoriaReportes(usuario: any, auditInfo: AuditLog): Promise<void> {
  try {
    const query = `
      INSERT INTO auditoria_reportes (
        usuario_id, usuario_email, usuario_roles, institucion_id,
        accion, modulo, tabla, registro_id,
        datos_anteriores, datos_nuevos,
        ip_address, user_agent,
        resultado, mensaje, fecha_accion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
    `;

    const values = [
      usuario?.id || null,
      usuario?.email || 'sistema',
      JSON.stringify(usuario?.roles || []),
      usuario?.id_institucion || null,
      auditInfo.accion,
      auditInfo.modulo,
      auditInfo.tabla,
      auditInfo.registro_id || null,
      JSON.stringify(auditInfo.datos_anteriores || {}),
      JSON.stringify(auditInfo.datos_nuevos || {}),
      auditInfo.ip_address,
      auditInfo.user_agent,
      auditInfo.resultado,
      auditInfo.mensaje || null
    ];

    await pool.query(query, values);
  } catch (error) {
    // Fallback a tabla de auditoría general si la específica no existe
    try {
      const fallbackQuery = `
        INSERT INTO auditoria (
          accion, tabla, registro_id, usuario_id, fecha_accion,
          datos_anteriores, datos_nuevos, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
      `;

      const fallbackValues = [
        `REPORTES_${auditInfo.accion}`,
        auditInfo.tabla,
        auditInfo.registro_id || Math.floor(Date.now() / 1000), // Use timestamp in seconds as integer
        usuario?.id || null,
        JSON.stringify(auditInfo.datos_anteriores || {}),
        JSON.stringify(auditInfo.datos_nuevos || {}),
        auditInfo.ip_address,
        auditInfo.user_agent
      ];

      await pool.query(fallbackQuery, fallbackValues);
    } catch (fallbackError) {
      logger.error('Error en fallback de auditoría', fallbackError as Error);
    }
  }
}

/**
 * Middleware específico para diferentes acciones de reportes
 */
export const auditConsultarReportes = auditReportesMiddleware('CONSULTAR_REPORTES');
export const auditFiltrarReportes = auditReportesMiddleware('FILTRAR_REPORTES');
export const auditExportarReportes = auditReportesMiddleware('EXPORTAR_REPORTES');
export const auditGenerarReporteObjetivos = auditReportesMiddleware('GENERAR_REPORTE_OBJETIVOS');
export const auditGenerarReporteProyectos = auditReportesMiddleware('GENERAR_REPORTE_PROYECTOS');
export const auditVisualizarResumenPresupuestario = auditReportesMiddleware('VISUALIZAR_RESUMEN_PRESUPUESTARIO');
export const auditReporteDinamicoComparativo = auditReportesMiddleware('REPORTE_DINAMICO_COMPARATIVO');

/**
 * Validador de permisos con auditoría integrada
 */
export const verificarPermisoConAuditoria = (permiso: string, accionAudit: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuario;
    
    // Registrar intento de acceso
    await registrarIntentoAcceso(usuario, permiso, accionAudit, req);
    
    // Continuar con la validación normal
    next();
  };
};

/**
 * Registra intentos de acceso para análisis de seguridad
 */
async function registrarIntentoAcceso(usuario: any, permiso: string, accion: string, req: Request): Promise<void> {
  try {
    const query = `
      INSERT INTO auditoria_acceso (
        usuario_id, permiso_requerido, accion_solicitada,
        ip_address, user_agent, fecha_intento, resultado
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
    `;

    // Verificar si tiene permiso (lógica simplificada)
    const tienePermiso = usuario?.roles?.includes('ADMIN') || false;

    const values = [
      usuario?.id || null,
      permiso,
      accion,
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent'),
      tienePermiso ? 'permitido' : 'denegado'
    ];

    await pool.query(query, values);
  } catch (error) {
    // Error silencioso para no interrumpir el flujo principal
    logger.warn('No se pudo registrar intento de acceso', error as Error);
  }
}

/**
 * Obtener estadísticas de auditoría para reportes de trazabilidad
 */
export const obtenerEstadisticasAuditoria = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;
    const { fecha_inicio, fecha_fin, accion, institucion } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Filtros de fecha
    if (fecha_inicio) {
      whereClause += ` AND fecha_accion >= $${paramIndex}`;
      params.push(fecha_inicio);
      paramIndex++;
    }

    if (fecha_fin) {
      whereClause += ` AND fecha_accion <= $${paramIndex}`;
      params.push(fecha_fin);
      paramIndex++;
    }

    // Filtro por acción
    if (accion) {
      whereClause += ` AND accion = $${paramIndex}`;
      params.push(accion);
      paramIndex++;
    }

    // Filtro por institución (si no es admin)
    if (!usuario.roles.includes('ADMIN') && !usuario.roles.includes('AUDITOR')) {
      whereClause += ` AND institucion_id = $${paramIndex}`;
      params.push(usuario.id_institucion);
      paramIndex++;
    } else if (institucion) {
      whereClause += ` AND institucion_id = $${paramIndex}`;
      params.push(institucion);
      paramIndex++;
    }

    const statsQuery = `
      SELECT 
        accion,
        COUNT(*) as total_acciones,
        COUNT(CASE WHEN resultado = 'exitoso' THEN 1 END) as exitosas,
        COUNT(CASE WHEN resultado = 'error' THEN 1 END) as errores,
        COUNT(DISTINCT usuario_id) as usuarios_unicos,
        AVG(CAST(datos_nuevos->>'tiempo_ejecucion_ms' AS NUMERIC)) as tiempo_promedio_ms
      FROM auditoria_reportes 
      ${whereClause}
      GROUP BY accion
      ORDER BY total_acciones DESC
    `;

    const result = await pool.query(statsQuery, params);

    res.json({
      success: true,
      data: {
        estadisticas: result.rows,
        filtros_aplicados: { fecha_inicio, fecha_fin, accion, institucion },
        generado_por: usuario.roles[0],
        fecha_consulta: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error al obtener estadísticas de auditoría', error as Error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de auditoría'
    });
  }
};
