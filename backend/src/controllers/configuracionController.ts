import { Request, Response } from 'express';
import pool from '../database/connection';
import { ApiResponse, CreateInstitucionDTO, Institucion } from '../models';

// ============================================
// METODOS ESPECIFICOS PARA INSTITUCION
// ============================================

// Metodo: activarInstitucion()
export const activarInstitucion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE institucion 
      SET estado = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, codigo, nombre, estado
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Institucion no encontrada'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Institucion activada exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: inactivarInstitucion()
export const inactivarInstitucion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE institucion 
      SET estado = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, codigo, nombre, estado
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Institucion no encontrada'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Institucion inactivada exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// ============================================
// METODOS PARA CONFIGURACION DE JERARQUIAS
// ============================================

// Metodo: definirJerarquia() - Definir jerarquias institucionales
export const definirJerarquia = async (req: Request, res: Response) => {
  try {
    const { institucion_id, nivel_jerarquico, institucion_padre_id } = req.body;

    // Validar que la institucion existe
    const institucionExiste = await pool.query(
      'SELECT id, nombre FROM institucion WHERE id = $1 AND estado = true',
      [institucion_id]
    );

    if (institucionExiste.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Institucion no encontrada'
      };
      return res.status(404).json(response);
    }

    // Si hay padre, validar que existe
    if (institucion_padre_id) {
      const padreExiste = await pool.query(
        'SELECT id FROM institucion WHERE id = $1 AND estado = true',
        [institucion_padre_id]
      );

      if (padreExiste.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Institucion padre no encontrada'
        };
        return res.status(404).json(response);
      }
    }

    // Actualizar la jerarquia
    const result = await pool.query(`
      UPDATE institucion 
      SET jerarquia = $1, responsable = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, codigo, nombre, jerarquia, responsable
    `, [nivel_jerarquico, institucion_padre_id, institucion_id]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Jerarquia institucional definida exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al definir jerarquia:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: asignarRelaciones() - Asignar relaciones entre unidades organizativas
export const asignarRelaciones = async (req: Request, res: Response) => {
  try {
    const { institucion_hijo_id, institucion_padre_id, tipo_relacion } = req.body;

    // Validar que ambas instituciones existen
    const validarInstituciones = await pool.query(`
      SELECT COUNT(*) as count FROM institucion 
      WHERE id IN ($1, $2) AND estado = true
    `, [institucion_hijo_id, institucion_padre_id]);

    if (parseInt(validarInstituciones.rows[0].count) !== 2) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Una o ambas instituciones no existen'
      };
      return res.status(404).json(response);
    }

    // Prevenir auto-referencia
    if (institucion_hijo_id === institucion_padre_id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Una institucion no puede ser padre de si misma'
      };
      return res.status(400).json(response);
    }

    // Actualizar la relacion
    const result = await pool.query(`
      UPDATE institucion 
      SET responsable = $1, tipo = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, codigo, nombre, responsable, tipo
    `, [institucion_padre_id, tipo_relacion || 'DEPENDENCIA', institucion_hijo_id]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Relacion organizativa asignada exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al asignar relacion:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// ============================================
// METODOS ESPECIFICOS PARA USUARIO
// ============================================

// ============================================
// METODOS ESPECIFICOS PARA ROL
// ============================================

// Metodo: asignarPermiso()
export const asignarPermiso = async (req: Request, res: Response) => {
  try {
    const { usuario_id, rol_id } = req.body;
    const { asignado_por } = req.body; // ID del usuario que asigna

    // Verificar si ya existe la asignacion
    const existingAssignment = await pool.query(
      'SELECT id FROM usuario_rol WHERE usuario_id = $1 AND rol_id = $2 AND estado = true',
      [usuario_id, rol_id]
    );

    if (existingAssignment.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El rol ya esta asignado al usuario'
      };
      return res.status(409).json(response);
    }

    const result = await pool.query(`
      INSERT INTO usuario_rol (usuario_id, rol_id, asignado_por, fecha_asignacion, estado)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, true)
      RETURNING id, usuario_id, rol_id, fecha_asignacion
    `, [usuario_id, rol_id, asignado_por]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Permiso asignado exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: crearRol()
export const crearRol = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, nivel, codigo } = req.body;

    // Verificar si el codigo ya existe
    const existingRol = await pool.query(
      'SELECT id FROM rol WHERE codigo = $1',
      [codigo]
    );

    if (existingRol.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El codigo de rol ya existe'
      };
      return res.status(409).json(response);
    }

    const result = await pool.query(`
      INSERT INTO rol (nombre, descripcion, nivel, codigo, estado)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, nombre, descripcion, nivel, codigo, estado, created_at
    `, [nombre, descripcion, nivel, codigo]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Rol creado exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// ============================================
// METODOS PARA AUDITORIA Y BITACORA
// ============================================

// Metodo: registrarAuditoria()
export const registrarAuditoria = async (req: Request, res: Response) => {
  try {
    const { accion, tabla, registro_id, usuario_id, datos_anteriores, datos_nuevos } = req.body;

    const result = await pool.query(`
      INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_anteriores, datos_nuevos)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
      RETURNING id, accion, tabla, registro_id, fecha_accion
    `, [accion, tabla, registro_id, usuario_id, datos_anteriores, datos_nuevos]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Auditoria registrada exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: registrarEvento()
export const registrarEvento = async (req: Request, res: Response) => {
  try {
    const { evento, descripcion, usuario_id, modulo, nivel, detalles } = req.body;

    const result = await pool.query(`
      INSERT INTO bitacora (evento, descripcion, usuario_id, modulo, nivel, fecha_evento, detalles)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
      RETURNING id, evento, descripcion, modulo, nivel, fecha_evento
    `, [evento, descripcion, usuario_id, modulo, nivel || 'INFO', detalles]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Evento registrado exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: consultarAccion()
export const consultarAccion = async (req: Request, res: Response) => {
  try {
    const { tabla, registro_id, usuario_id, fecha_inicio, fecha_fin } = req.query;
    
    let query = `
      SELECT a.*, u.nombre as usuario_nombre
      FROM auditoria a
      LEFT JOIN usuario u ON a.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (tabla) {
      query += ` AND a.tabla = $${paramIndex}`;
      params.push(tabla);
      paramIndex++;
    }
    
    if (registro_id) {
      query += ` AND a.registro_id = $${paramIndex}`;
      params.push(registro_id);
      paramIndex++;
    }
    
    if (usuario_id) {
      query += ` AND a.usuario_id = $${paramIndex}`;
      params.push(usuario_id);
      paramIndex++;
    }
    
    if (fecha_inicio) {
      query += ` AND a.fecha_accion >= $${paramIndex}`;
      params.push(fecha_inicio);
      paramIndex++;
    }
    
    if (fecha_fin) {
      query += ` AND a.fecha_accion <= $${paramIndex}`;
      params.push(fecha_fin);
      paramIndex++;
    }
    
    query += ` ORDER BY a.fecha_accion DESC`;
    
    const result = await pool.query(query, params);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Instituciones
export const getInstituciones = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, codigo, nombre, sigla, mision, vision, direccion, 
             telefono, email, web, estado, created_at, updated_at 
      FROM institucion 
      WHERE estado = true 
      ORDER BY nombre
    `);
    
    const response: ApiResponse<Institucion[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener instituciones:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const getInstitucionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT id, codigo, nombre, sigla, mision, vision, direccion, 
             telefono, email, web, estado, created_at, updated_at 
      FROM institucion 
      WHERE id = $1 AND estado = true
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Institucion no encontrada'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Institucion> = {
      success: true,
      data: result.rows[0]
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener institucion:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const createInstitucion = async (req: Request, res: Response) => {
  try {
    const data: CreateInstitucionDTO = req.body;
    
    // Validaciones basicas
    if (!data.codigo || !data.nombre) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Codigo y nombre son obligatorios'
      };
      return res.status(400).json(response);
    }

    // Verificar si el codigo ya existe
    const existingInst = await pool.query(
      'SELECT id FROM institucion WHERE codigo = $1',
      [data.codigo]
    );

    if (existingInst.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El codigo de institucion ya existe'
      };
      return res.status(409).json(response);
    }

    const result = await pool.query(`
      INSERT INTO institucion (codigo, nombre, sigla, mision, vision, direccion, telefono, email, web)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, codigo, nombre, sigla, mision, vision, direccion, telefono, email, web, estado, created_at, updated_at
    `, [data.codigo, data.nombre, data.sigla, data.mision, data.vision, data.direccion, data.telefono, data.email, data.web]);

    const response: ApiResponse<Institucion> = {
      success: true,
      data: result.rows[0],
      message: 'Institucion creada exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error al crear institucion:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const updateInstitucion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: CreateInstitucionDTO = req.body;
    
    // Verificar si existe otro codigo igual
    const existingInst = await pool.query(
      'SELECT id FROM institucion WHERE codigo = $1 AND id != $2',
      [data.codigo, id]
    );

    if (existingInst.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El codigo de institucion ya existe'
      };
      return res.status(409).json(response);
    }

    const result = await pool.query(`
      UPDATE institucion 
      SET codigo = $1, nombre = $2, sigla = $3, mision = $4, vision = $5, 
          direccion = $6, telefono = $7, email = $8, web = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND estado = true
      RETURNING id, codigo, nombre, sigla, mision, vision, direccion, telefono, email, web, estado, created_at, updated_at
    `, [data.codigo, data.nombre, data.sigla, data.mision, data.vision, data.direccion, data.telefono, data.email, data.web, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Institucion no encontrada'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Institucion> = {
      success: true,
      data: result.rows[0],
      message: 'Institucion actualizada exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al actualizar institucion:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const deleteInstitucion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE institucion 
      SET estado = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado = true
      RETURNING id, codigo, nombre
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Institucion no encontrada'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Institucion desactivada exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al desactivar institucion:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, codigo, nombre, descripcion, estado, created_at, updated_at 
      FROM rol 
      WHERE estado = true 
      ORDER BY nombre
    `);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Usuarios
export const createUsuario = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM usuario WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El email ya esta registrado'
      };
      return res.status(409).json(response);
    }

    // Hash de la contrasena
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    const result = await pool.query(`
      INSERT INTO usuario (nombre, email, password, rol_id, institucion_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, email, rol_id, institucion_id, estado, created_at
    `, [data.nombre, data.email, hashedPassword, data.rol_id, data.institucion_id]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Usuario creado exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Verificar si existe otro email igual
    const existingUser = await pool.query(
      'SELECT id FROM usuario WHERE email = $1 AND id != $2',
      [data.email, id]
    );

    if (existingUser.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El email ya esta registrado'
      };
      return res.status(409).json(response);
    }

    let updateQuery = `
      UPDATE usuario 
      SET nombre = $1, email = $2, rol_id = $3, institucion_id = $4, updated_at = CURRENT_TIMESTAMP
    `;
    let params = [data.nombre, data.email, data.rol_id, data.institucion_id];

    // Si se proporciona nueva contrasena
    if (data.password) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateQuery += `, password = $5 WHERE id = $6`;
      params.push(hashedPassword, id);
    } else {
      updateQuery += ` WHERE id = $5`;
      params.push(id);
    }

    updateQuery += ` AND estado = true RETURNING id, nombre, email, rol_id, institucion_id, estado, created_at, updated_at`;

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no encontrado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Usuario actualizado exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE usuario 
      SET estado = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado = true
      RETURNING id, nombre, email
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no encontrado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Usuario desactivado exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(`
      UPDATE usuario 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado = true
      RETURNING id, nombre, email
    `, [hashedPassword, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no encontrado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Contrasena actualizada exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Obtener usuarios con roles
export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.codigo, u.nombre, u.apellido, u.email, u.telefono, u.documento, 
             u.cargo, u.estado, u.ultimo_acceso, u.created_at, u.updated_at,
             i.nombre as institucion_nombre,
             ARRAY_AGG(
               CASE WHEN r.id IS NOT NULL THEN 
                 json_build_object('id', r.id, 'codigo', r.codigo, 'nombre', r.nombre)
               ELSE NULL END
             ) FILTER (WHERE r.id IS NOT NULL) as roles
      FROM usuario u
      LEFT JOIN institucion i ON u.institucion_id = i.id
      LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id AND ur.estado = true
      LEFT JOIN rol r ON ur.rol_id = r.id AND r.estado = true
      WHERE u.estado = true
      GROUP BY u.id, i.nombre
      ORDER BY u.nombre, u.apellido
    `);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Planes institucionales
export const getPlanesInstitucionales = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.nombre, p.descripcion, p.tipo, p.periodo_inicio, p.periodo_fin,
             p.estado, p.version, p.fecha_aprobacion, p.created_at, p.updated_at,
             i.nombre as institucion_nombre,
             c.nombre as creador_nombre,
             a.nombre as aprobador_nombre
      FROM plan_institucional p
      LEFT JOIN institucion i ON p.institucion_id = i.id
      LEFT JOIN usuario c ON p.creado_por = c.id
      LEFT JOIN usuario a ON p.aprobado_por = a.id
      ORDER BY p.created_at DESC
    `);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener planes institucionales:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};
