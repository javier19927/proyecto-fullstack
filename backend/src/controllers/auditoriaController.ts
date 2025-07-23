import { Request, Response } from 'express';
import pool from '../database/connection';

export class AuditoriaController {
  
  // 📝 Registrar accion en auditoria (metodo requerido por especificacion)
  static async registrarAuditoria(req: Request, res: Response) {
    const { 
      accion,
      tabla, 
      registro_id,
      datos_anteriores, 
      datos_nuevos,
      ip_address,
      user_agent
    } = req.body;

    // Obtener usuario desde el token (middleware de autenticacion)
    const usuario_id = (req as any).usuario?.id;

    try {
      // Validaciones requeridas
      if (!accion || !tabla || !registro_id) {
        return res.status(400).json({
          success: false,
          message: '❌ Los campos accion, tabla y registro_id son obligatorios'
        });
      }

      const query = `
        INSERT INTO auditoria (
          accion, tabla, registro_id, usuario_id, fecha_accion,
          datos_anteriores, datos_nuevos, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        accion,
        tabla, 
        registro_id,
        usuario_id,
        JSON.stringify(datos_anteriores || {}),
        JSON.stringify(datos_nuevos || {}),
        ip_address || req.ip,
        user_agent || req.get('User-Agent')
      ];

      const result = await pool.query(query, values);
      
      res.status(201).json({
        success: true,
        message: '✅ Accion registrada en auditoria exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al registrar auditoria:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al registrar la auditoria',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🔍 Consultar accion especifica (metodo requerido por especificacion)
  static async consultarAccion(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const query = `
        SELECT 
          a.*,
          u.nombre || ' ' || u.apellido as usuario_nombre,
          u.email as usuario_email
        FROM auditoria a
        LEFT JOIN usuario u ON a.usuario_id = u.id
        WHERE a.id = $1
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Registro de auditoria no encontrado'
        });
      }

      res.json({
        success: true,
        message: '🔍 Registro de auditoria encontrado',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al consultar accion:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al consultar la accion',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 📋 Listar todas las auditorias con filtros
  static async listarAuditorias(req: Request, res: Response) {
    const { 
      tabla, 
      accion, 
      usuario_id, 
      fecha_inicio, 
      fecha_fin, 
      page = 1, 
      limit = 20 
    } = req.query;

    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Construir filtros dinamicamente
      if (tabla) {
        whereConditions.push(`a.tabla = $${paramIndex}`);
        queryParams.push(tabla);
        paramIndex++;
      }

      if (accion) {
        whereConditions.push(`a.accion = $${paramIndex}`);
        queryParams.push(accion);
        paramIndex++;
      }

      if (usuario_id) {
        whereConditions.push(`a.usuario_id = $${paramIndex}`);
        queryParams.push(usuario_id);
        paramIndex++;
      }

      if (fecha_inicio) {
        whereConditions.push(`a.fecha_accion >= $${paramIndex}`);
        queryParams.push(fecha_inicio);
        paramIndex++;
      }

      if (fecha_fin) {
        whereConditions.push(`a.fecha_accion <= $${paramIndex}`);
        queryParams.push(fecha_fin);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query para obtener el total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM auditoria a
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Calcular offset
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Query principal
      const query = `
        SELECT 
          a.id,
          a.accion,
          a.tabla,
          a.registro_id,
          a.fecha_accion,
          a.ip_address,
          a.user_agent,
          u.nombre || ' ' || u.apellido as usuario_nombre,
          u.email as usuario_email
        FROM auditoria a
        LEFT JOIN usuario u ON a.usuario_id = u.id
        ${whereClause}
        ORDER BY a.fecha_accion DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      const result = await pool.query(query, queryParams);

      res.json({
        success: true,
        message: '📋 Auditorias obtenidas exitosamente',
        data: result.rows,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error al listar auditorias:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener las auditorias',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 📊 Obtener estadisticas de auditoria
  static async obtenerEstadisticas(req: Request, res: Response) {
    try {
      // Estadisticas por accion
      const accionesQuery = `
        SELECT 
          accion,
          COUNT(*) as cantidad
        FROM auditoria
        WHERE fecha_accion >= NOW() - INTERVAL '30 days'
        GROUP BY accion
        ORDER BY cantidad DESC
      `;

      // Estadisticas por tabla
      const tablasQuery = `
        SELECT 
          tabla,
          COUNT(*) as cantidad
        FROM auditoria
        WHERE fecha_accion >= NOW() - INTERVAL '30 days'
        GROUP BY tabla
        ORDER BY cantidad DESC
      `;

      // Estadisticas por usuario
      const usuariosQuery = `
        SELECT 
          u.nombre || ' ' || u.apellido as usuario_nombre,
          u.email,
          COUNT(*) as cantidad
        FROM auditoria a
        LEFT JOIN usuario u ON a.usuario_id = u.id
        WHERE a.fecha_accion >= NOW() - INTERVAL '30 days'
        GROUP BY u.id, u.nombre, u.apellido, u.email
        ORDER BY cantidad DESC
        LIMIT 10
      `;

      // Actividad por dia (ultimos 7 dias)
      const actividadQuery = `
        SELECT 
          DATE(fecha_accion) as fecha,
          COUNT(*) as cantidad
        FROM auditoria
        WHERE fecha_accion >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(fecha_accion)
        ORDER BY fecha DESC
      `;

      const [accionesResult, tablasResult, usuariosResult, actividadResult] = await Promise.all([
        pool.query(accionesQuery),
        pool.query(tablasQuery),
        pool.query(usuariosQuery),
        pool.query(actividadQuery)
      ]);

      res.json({
        success: true,
        message: '📊 Estadisticas de auditoria obtenidas exitosamente',
        data: {
          acciones: accionesResult.rows,
          tablas: tablasResult.rows,
          usuarios_mas_activos: usuariosResult.rows,
          actividad_diaria: actividadResult.rows,
          periodo: 'Ultimos 30 dias'
        }
      });
    } catch (error) {
      console.error('Error al obtener estadisticas:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener las estadisticas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
