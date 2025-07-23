import { Request, Response } from 'express';
import pool from '../database/connection';
import { IInstitucion, Institucion } from '../models/Institucion';

export class InstitucionController {
  
  // 🏢 Registrar nueva institucion (usando el modelo de clase)
  static async registrarInstitucion(req: Request, res: Response) {
    try {
      const institucionData: IInstitucion = {
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        sigla: req.body.sigla,
        tipo: req.body.tipo,
        mision: req.body.mision,
        vision: req.body.vision,
        direccion: req.body.direccion,
        telefono: req.body.telefono,
        email: req.body.email,
        web: req.body.web,
        jerarquia: parseInt(req.body.jerarquia),
        responsable: req.body.responsable ? parseInt(req.body.responsable) : undefined
      };

      // Crear instancia de la clase Institucion
      const institucion = new Institucion(institucionData);

      // Validar datos
      const validacion = institucion.validar();
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: '❌ Datos de institucion invalidos',
          errores: validacion.errores
        });
      }

      // Usar el metodo de la clase para registrar
      const institucioGuardada = await institucion.registrarInstitucion();
      
      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_nuevos)
        VALUES ('INSERT', 'institucion', $1, $2, NOW(), $3)
      `, [institucioGuardada.id, institucioGuardada.responsable || null, JSON.stringify(institucioGuardada)]);

      res.status(201).json({
        success: true,
        message: '✅ Institucion registrada exitosamente',
        data: institucioGuardada
      });
    } catch (error) {
      console.error('Error al registrar institucion:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al registrar la institucion',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 📝 Actualizar institucion existente
  static async actualizarInstitucion(req: Request, res: Response) {
    const { id } = req.params;
    const { 
      codigo,
      nombre, 
      sigla,
      tipo,
      mision,
      vision,
      direccion, 
      telefono, 
      email, 
      web,
      jerarquia,
      responsable
    } = req.body;

    try {
      // Obtener datos anteriores para auditoria
      const anteriorResult = await pool.query('SELECT * FROM institucion WHERE id = $1', [id]);
      
      if (anteriorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Institucion no encontrada'
        });
      }

      const datosAnteriores = anteriorResult.rows[0];

      // Verificar que el codigo no este en uso por otra institucion
      if (codigo && codigo !== datosAnteriores.codigo) {
        const codigoCheck = await pool.query(
          'SELECT id FROM institucion WHERE codigo = $1 AND id != $2', 
          [codigo, id]
        );

        if (codigoCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: '❌ El codigo ya esta registrado por otra institucion'
          });
        }
      }

      // Verificar que el responsable exista si se proporciona
      if (responsable) {
        const responsableCheck = await pool.query(
          'SELECT id FROM usuario WHERE id = $1 AND estado = true', 
          [responsable]
        );

        if (responsableCheck.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: '❌ El usuario responsable no existe o esta inactivo'
          });
        }
      }

      const query = `
        UPDATE institucion SET 
          codigo = $1,
          nombre = $2, 
          sigla = $3,
          tipo = $4,
          mision = $5,
          vision = $6,
          direccion = $7, 
          telefono = $8, 
          email = $9,
          web = $10,
          jerarquia = $11,
          responsable = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *
      `;
      
      const values = [
        codigo || datosAnteriores.codigo,
        nombre || datosAnteriores.nombre,
        sigla !== undefined ? sigla : datosAnteriores.sigla,
        tipo || datosAnteriores.tipo,
        mision !== undefined ? mision : datosAnteriores.mision,
        vision !== undefined ? vision : datosAnteriores.vision,
        direccion !== undefined ? direccion : datosAnteriores.direccion,
        telefono !== undefined ? telefono : datosAnteriores.telefono,
        email !== undefined ? email : datosAnteriores.email,
        web !== undefined ? web : datosAnteriores.web,
        jerarquia || datosAnteriores.jerarquia,
        responsable || datosAnteriores.responsable,
        id
      ];

      const result = await pool.query(query, values);

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_anteriores, datos_nuevos)
        VALUES ('UPDATE', 'institucion', $1, $2, NOW(), $3, $4)
      `, [id, responsable || datosAnteriores.responsable, JSON.stringify(datosAnteriores), JSON.stringify(result.rows[0])]);

      res.json({
        success: true,
        message: '✅ Institucion actualizada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al actualizar institucion:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al actualizar la institucion',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ✅ Activar institucion (usando el modelo de clase)
  static async activarInstitucion(req: Request, res: Response) {
    const { id } = req.params;
    const { usuario_id } = req.body; // Usuario que realiza la accion

    try {
      // Obtener la institucion
      const institucion = await Institucion.obtenerPorId(parseInt(id));
      
      if (!institucion) {
        return res.status(404).json({
          success: false,
          message: '❌ Institucion no encontrada'
        });
      }

      // Usar el metodo de la clase para activar
      const institucionActivada = await institucion.activarInstitucion(usuario_id);

      res.json({
        success: true,
        message: '✅ Institucion activada exitosamente',
        data: institucionActivada
      });
    } catch (error) {
      console.error('Error al activar institucion:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al activar la institucion',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ❌ Inactivar institucion (usando el modelo de clase)
  static async inactivarInstitucion(req: Request, res: Response) {
    const { id } = req.params;
    const { usuario_id } = req.body; // Usuario que realiza la accion

    try {
      // Obtener la institucion
      const institucion = await Institucion.obtenerPorId(parseInt(id));
      
      if (!institucion) {
        return res.status(404).json({
          success: false,
          message: '❌ Institucion no encontrada'
        });
      }

      // Usar el metodo de la clase para inactivar
      const institucionInactivada = await institucion.inactivarInstitucion(usuario_id);

      res.json({
        success: true,
        message: '⚠️ Institucion inactivada exitosamente',
        data: institucionInactivada
      });
    } catch (error) {
      console.error('Error al inactivar institucion:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al inactivar la institucion',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 📋 Listar todas las instituciones (usando el modelo de clase)
  static async listarInstituciones(req: Request, res: Response) {
    try {
      const instituciones = await Institucion.obtenerTodas();
      
      res.json({
        success: true,
        message: '📋 Instituciones obtenidas exitosamente',
        data: instituciones,
        total: instituciones.length
      });
    } catch (error) {
      console.error('Error al listar instituciones:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener las instituciones',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🔍 Obtener institucion por ID (usando el modelo de clase)
  static async obtenerInstitucion(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const institucion = await Institucion.obtenerPorId(parseInt(id));
      
      if (!institucion) {
        return res.status(404).json({
          success: false,
          message: '❌ Institucion no encontrada'
        });
      }

      res.json({
        success: true,
        message: '🔍 Institucion encontrada',
        data: institucion
      });
    } catch (error) {
      console.error('Error al obtener institucion:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener la institucion',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🧱 Obtener jerarquia institucional
  static async obtenerJerarquia(req: Request, res: Response) {
    try {
      const query = `
        SELECT 
          i.id,
          i.codigo,
          i.nombre,
          i.tipo,
          i.jerarquia,
          i.responsable,
          u.nombre || ' ' || u.apellido as responsable_nombre,
          i.estado,
          i.created_at
        FROM institucion i
        LEFT JOIN usuario u ON i.responsable = u.id
        WHERE i.estado = true
        ORDER BY i.jerarquia, i.nombre
      `;

      const result = await pool.query(query);
      
      res.json({
        success: true,
        message: '🧱 Jerarquia institucional obtenida',
        data: result.rows
      });
    } catch (error) {
      console.error('Error al obtener jerarquia:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener la jerarquia institucional',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
