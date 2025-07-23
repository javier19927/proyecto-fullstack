import { Request, Response } from 'express';
import pool from '../database/connection';

export class BitacoraController {
  
  // 📝 Registrar evento en bitacora (metodo requerido por especificacion)
  static async registrarEvento(req: Request, res: Response) {
    const { 
      evento,
      descripcion,
      modulo,
      nivel = 'INFO',
      detalles
    } = req.body;

    // Obtener usuario desde el token (middleware de autenticacion)
    const usuario_id = (req as any).usuario?.id;

    try {
      // Validaciones requeridas
      if (!evento || !descripcion || !modulo) {
        return res.status(400).json({
          success: false,
          message: '❌ Los campos evento, descripcion y modulo son obligatorios'
        });
      }

      // Validar nivel
      const nivelesValidos = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
      if (!nivelesValidos.includes(nivel)) {
        return res.status(400).json({
          success: false,
          message: '❌ El nivel debe ser uno de: INFO, WARNING, ERROR, DEBUG'
        });
      }

      const query = `
        INSERT INTO bitacora (
          evento, descripcion, usuario_id, modulo, nivel, fecha_evento,
          ip_address, detalles
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
        RETURNING *
      `;
      
      const values = [
        evento,
        descripcion,
        usuario_id,
        modulo,
        nivel,
        req.ip,
        JSON.stringify(detalles || {})
      ];

      const result = await pool.query(query, values);
      
      res.status(201).json({
        success: true,
        message: '✅ Evento registrado en bitacora exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al registrar evento:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al registrar el evento',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🔍 Consultar accion especifica de bitacora (metodo requerido por especificacion)
  static async consultarAccion(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const query = `
        SELECT 
          b.*,
          u.nombre || ' ' || u.apellido as usuario_nombre,
          u.email as usuario_email
        FROM bitacora b
        LEFT JOIN usuario u ON b.usuario_id = u.id
        WHERE b.id = $1
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Registro de bitacora no encontrado'
        });
      }

      res.json({
        success: true,
        message: '🔍 Registro de bitacora encontrado',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al consultar accion de bitacora:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al consultar la accion',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 📋 Listar eventos de bitacora con filtros
  static async listarEventos(req: Request, res: Response) {
    const { 
      modulo,
      nivel,
      evento,
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
      if (modulo) {
        whereConditions.push(`b.modulo = $${paramIndex}`);
        queryParams.push(modulo);
        paramIndex++;
      }

      if (nivel) {
        whereConditions.push(`b.nivel = $${paramIndex}`);
        queryParams.push(nivel);
        paramIndex++;
      }

      if (evento) {
        whereConditions.push(`b.evento ILIKE $${paramIndex}`);
        queryParams.push(`%${evento}%`);
        paramIndex++;
      }

      if (usuario_id) {
        whereConditions.push(`b.usuario_id = $${paramIndex}`);
        queryParams.push(usuario_id);
        paramIndex++;
      }

      if (fecha_inicio) {
        whereConditions.push(`b.fecha_evento >= $${paramIndex}`);
        queryParams.push(fecha_inicio);
        paramIndex++;
      }

      if (fecha_fin) {
        whereConditions.push(`b.fecha_evento <= $${paramIndex}`);
        queryParams.push(fecha_fin);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query para obtener el total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM bitacora b
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Calcular offset
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Query principal
      const query = `
        SELECT 
          b.id,
          b.evento,
          b.descripcion,
          b.modulo,
          b.nivel,
          b.fecha_evento,
          b.ip_address,
          u.nombre || ' ' || u.apellido as usuario_nombre,
          u.email as usuario_email
        FROM bitacora b
        LEFT JOIN usuario u ON b.usuario_id = u.id
        ${whereClause}
        ORDER BY b.fecha_evento DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      const result = await pool.query(query, queryParams);

      res.json({
        success: true,
        message: '📋 Eventos de bitacora obtenidos exitosamente',
        data: result.rows,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error al listar eventos de bitacora:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener los eventos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 📊 Obtener estadisticas de bitacora
  static async obtenerEstadisticas(req: Request, res: Response) {
    try {
      // Estadisticas por nivel
      const nivelesQuery = `
        SELECT 
          nivel,
          COUNT(*) as cantidad
        FROM bitacora
        WHERE fecha_evento >= NOW() - INTERVAL '30 days'
        GROUP BY nivel
        ORDER BY cantidad DESC
      `;

      // Estadisticas por modulo
      const modulosQuery = `
        SELECT 
          modulo,
          COUNT(*) as cantidad
        FROM bitacora
        WHERE fecha_evento >= NOW() - INTERVAL '30 days'
        GROUP BY modulo
        ORDER BY cantidad DESC
      `;

      // Eventos mas frecuentes
      const eventosQuery = `
        SELECT 
          evento,
          COUNT(*) as cantidad
        FROM bitacora
        WHERE fecha_evento >= NOW() - INTERVAL '30 days'
        GROUP BY evento
        ORDER BY cantidad DESC
        LIMIT 10
      `;

      // Actividad por dia (ultimos 7 dias)
      const actividadQuery = `
        SELECT 
          DATE(fecha_evento) as fecha,
          COUNT(*) as cantidad
        FROM bitacora
        WHERE fecha_evento >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(fecha_evento)
        ORDER BY fecha DESC
      `;

      const [nivelesResult, modulosResult, eventosResult, actividadResult] = await Promise.all([
        pool.query(nivelesQuery),
        pool.query(modulosQuery),
        pool.query(eventosQuery),
        pool.query(actividadQuery)
      ]);

      res.json({
        success: true,
        message: '📊 Estadisticas de bitacora obtenidas exitosamente',
        data: {
          niveles: nivelesResult.rows,
          modulos: modulosResult.rows,
          eventos_frecuentes: eventosResult.rows,
          actividad_diaria: actividadResult.rows,
          periodo: 'Ultimos 30 dias'
        }
      });
    } catch (error) {
      console.error('Error al obtener estadisticas de bitacora:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener las estadisticas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
