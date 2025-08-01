import { Request, Response } from 'express';
import pool from '../database/connection';

export class UsuarioController {
  
  // Listar todos los usuarios
  static async listarUsuarios(req: Request, res: Response) {
    try {
      const query = `
        SELECT 
          u.id,
          u.codigo,
          CONCAT(u.nombre, ' ', u.apellido) as nombre,
          u.email,
          u.telefono,
          u.documento,
          u.cargo,
          u.institucion_id,
          u.estado,
          u.ultimo_acceso as last_login,
          u.created_at,
          u.updated_at,
          i.nombre as institucion_nombre
        FROM usuario u
        LEFT JOIN institucion i ON u.institucion_id = i.id
        WHERE u.estado = true
        ORDER BY u.nombre, u.apellido
      `;

      const usuarios = await pool.query(query);

      // Obtener roles para cada usuario
      const usuariosConRoles = await Promise.all(
        usuarios.rows.map(async (usuario) => {
          const rolesQuery = `
            SELECT r.id, r.nombre, r.descripcion
            FROM rol r
            INNER JOIN usuario_rol ur ON r.id = ur.rol_id
            WHERE ur.usuario_id = $1 AND ur.estado = true
          `;
          const rolesResult = await pool.query(rolesQuery, [usuario.id]);
          
          return {
            ...usuario,
            roles: rolesResult.rows.map(rol => rol.id) // Solo los IDs de los roles
          };
        })
      );

      res.json({
        success: true,
        message: '📋 Lista de usuarios obtenida correctamente',
        data: usuariosConRoles,
        total: usuariosConRoles.length
      });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener la lista de usuarios',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
  
  // Crear nuevo usuario
  static async crearUsuario(req: Request, res: Response) {
    const { 
      correo,
      nombreCompleto,
      password,
      rol,
      codigo,
      apellido,
      telefono,
      documento,
      cargo,
      institucion_id
    } = req.body;

    try {
      console.log('🔍 Iniciando creacion de usuario con datos:', {
        correo,
        nombreCompleto,
        rol,
        codigo,
        apellido,
        telefono,
        documento,
        cargo,
        institucion_id
      });

      // Validaciones requeridas segun especificacion
      if (!correo || !nombreCompleto || !password || !rol) {
        console.log('❌ Validacion fallida - campos faltantes:', {
          correo: !!correo,
          nombreCompleto: !!nombreCompleto,
          password: !!password,
          rol: !!rol
        });
        return res.status(400).json({
          success: false,
          message: '❌ Los campos correo, nombreCompleto, password y rol son obligatorios'
        });
      }

      // Verificar que el email no este en uso
      console.log('🔍 Verificando email unico:', correo);
      const emailCheck = await pool.query(
        'SELECT id FROM usuario WHERE email = $1', 
        [correo]
      );

      if (emailCheck.rows.length > 0) {
        console.log('❌ Email ya existe en la base de datos');
        return res.status(400).json({
          success: false,
          message: '❌ El correo ya esta registrado en el sistema'
        });
      }

      // Verificar que el rol exista
      console.log('🔍 Verificando rol existe:', rol);
      const rolCheck = await pool.query(
        'SELECT id FROM rol WHERE id = $1 AND estado = true', 
        [rol]
      );

      if (rolCheck.rows.length === 0) {
        console.log('❌ Rol no existe o esta inactivo:', rol);
        // Obtener roles disponibles para debug
        const rolesDisponibles = await pool.query('SELECT id, nombre FROM rol WHERE estado = true');
        console.log('📋 Roles disponibles:', rolesDisponibles.rows);
        return res.status(400).json({
          success: false,
          message: '❌ El rol especificado no existe o esta inactivo'
        });
      }

      // Generar codigo unico si no se proporciona
      const codigoUsuario = codigo || `USR-${Date.now().toString().slice(-6)}`;

      // Verificar que el codigo no este en uso
      const codigoCheck = await pool.query(
        'SELECT id FROM usuario WHERE codigo = $1', 
        [codigoUsuario]
      );

      if (codigoCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '❌ El codigo ya esta registrado en el sistema'
        });
      }

      // Separar nombre completo en nombre y apellido si no se proporcionan
      const nombreParts = nombreCompleto.split(' ');
      const nombre = nombreParts[0];
      const apellidoFinal = apellido || nombreParts.slice(1).join(' ') || '';

      // Crear usuario con contrasena encriptada
      const query = `
        INSERT INTO usuario (
          codigo, nombre, apellido, email, password, 
          telefono, documento, cargo, institucion_id, estado
        ) VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), $6, $7, $8, $9, true)
        RETURNING id, codigo, nombre, apellido, email, telefono, documento, cargo, 
                 institucion_id, estado, created_at
      `;
      
      const values = [
        codigoUsuario, nombre, apellidoFinal, correo, password,
        telefono || null, documento || null, cargo || null, institucion_id || 1
      ];

      const result = await pool.query(query, values);
      const usuario = result.rows[0];
      
      // Asignar rol al usuario
      await pool.query(
        'INSERT INTO usuario_rol (usuario_id, rol_id, asignado_por, estado, fecha_asignacion) VALUES ($1, $2, $3, true, NOW())',
        [usuario.id, rol, (req as any).usuario?.id || 1]
      );

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_nuevos)
        VALUES ('INSERT', 'usuario', $1, $1, NOW(), $2)
      `, [usuario.id, JSON.stringify(usuario)]);

      // Remover password del resultado
      const usuarioResponse = { ...usuario };
      delete usuarioResponse.password;
      
      res.status(201).json({
        success: true,
        message: '✅ Usuario creado exitosamente',
        data: {
          ...usuarioResponse,
          nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
          rol: rol
        }
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al crear el usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 📝 Modificar usuario existente
  static async modificarUsuario(req: Request, res: Response) {
    const { id } = req.params;
    const { 
      correo,
      nombreCompleto,
      rol,
      codigo,
      apellido,
      telefono,
      documento,
      cargo,
      institucion_id,
      password
    } = req.body;

    try {
      console.log('🔍 Iniciando modificacion de usuario:', {
        id,
        correo,
        nombreCompleto,
        rol,
        codigo,
        apellido,
        telefono,
        documento,
        cargo,
        institucion_id,
        tienePassword: !!password
      });
      // Obtener datos anteriores para auditoria
      const anteriorResult = await pool.query('SELECT * FROM usuario WHERE id = $1', [id]);
      
      if (anteriorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Usuario no encontrado'
        });
      }

      const datosAnteriores = anteriorResult.rows[0];

      // Verificar que el email no este en uso por otro usuario
      if (correo && correo !== datosAnteriores.email) {
        const emailCheck = await pool.query(
          'SELECT id FROM usuario WHERE email = $1 AND id != $2', 
          [correo, id]
        );

        if (emailCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: '❌ El correo ya esta registrado por otro usuario'
          });
        }
      }

      // Verificar que el codigo no este en uso por otro usuario
      if (codigo && codigo !== datosAnteriores.codigo) {
        const codigoCheck = await pool.query(
          'SELECT id FROM usuario WHERE codigo = $1 AND id != $2', 
          [codigo, id]
        );

        if (codigoCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: '❌ El codigo ya esta registrado por otro usuario'
          });
        }
      }

      // Separar nombre completo si se proporciona
      let nombre = datosAnteriores.nombre;
      let apellidoFinal = datosAnteriores.apellido;
      
      if (nombreCompleto) {
        const nombreParts = nombreCompleto.split(' ');
        nombre = nombreParts[0];
        apellidoFinal = apellido || nombreParts.slice(1).join(' ') || '';
      }

      // Construir consulta SQL dinámicamente dependiendo si se actualiza password
      let query, values;
      
      if (password) {
        query = `
          UPDATE usuario SET 
            codigo = $1,
            nombre = $2, 
            apellido = $3, 
            email = $4, 
            telefono = $5, 
            documento = $6,
            cargo = $7,
            institucion_id = $8,
            password = crypt($9, gen_salt('bf')),
            updated_at = NOW()
          WHERE id = $10
          RETURNING id, codigo, nombre, apellido, email, telefono, documento, cargo, 
                   institucion_id, estado, created_at, updated_at
        `;
        
        values = [
          codigo || datosAnteriores.codigo,
          nombre,
          apellidoFinal,
          correo || datosAnteriores.email,
          telefono !== undefined ? telefono : datosAnteriores.telefono,
          documento !== undefined ? documento : datosAnteriores.documento,
          cargo !== undefined ? cargo : datosAnteriores.cargo,
          institucion_id !== undefined ? institucion_id : datosAnteriores.institucion_id,
          password,
          id
        ];
      } else {
        query = `
          UPDATE usuario SET 
            codigo = $1,
            nombre = $2, 
            apellido = $3, 
            email = $4, 
            telefono = $5, 
            documento = $6,
            cargo = $7,
            institucion_id = $8,
            updated_at = NOW()
          WHERE id = $9
          RETURNING id, codigo, nombre, apellido, email, telefono, documento, cargo, 
                   institucion_id, estado, created_at, updated_at
        `;
        
        values = [
          codigo || datosAnteriores.codigo,
          nombre,
          apellidoFinal,
          correo || datosAnteriores.email,
          telefono !== undefined ? telefono : datosAnteriores.telefono,
          documento !== undefined ? documento : datosAnteriores.documento,
          cargo !== undefined ? cargo : datosAnteriores.cargo,
          institucion_id !== undefined ? institucion_id : datosAnteriores.institucion_id,
          id
        ];
      }

      const result = await pool.query(query, values);
      const usuario = result.rows[0];

      // Actualizar rol si se proporciono
      if (rol) {
        // Verificar que el rol exista
        const rolCheck = await pool.query(
          'SELECT id FROM rol WHERE id = $1 AND estado = true', 
          [rol]
        );

        if (rolCheck.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: '❌ El rol especificado no existe o esta inactivo'
          });
        }

        // Primero desactivar roles existentes
        await pool.query(
          'UPDATE usuario_rol SET estado = false WHERE usuario_id = $1',
          [id]
        );
        
        // Luego asignar el nuevo rol
        await pool.query(
          `INSERT INTO usuario_rol (usuario_id, rol_id, estado, fecha_asignacion) 
           VALUES ($1, $2, true, NOW()) 
           ON CONFLICT (usuario_id, rol_id) 
           DO UPDATE SET estado = true, fecha_asignacion = NOW()`,
          [id, rol]
        );
      }

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_anteriores, datos_nuevos)
        VALUES ('UPDATE', 'usuario', $1, $1, NOW(), $2, $3)
      `, [id, JSON.stringify(datosAnteriores), JSON.stringify(usuario)]);

      res.json({
        success: true,
        message: '✅ Usuario actualizado exitosamente',
        data: {
          ...usuario,
          nombreCompleto: `${usuario.nombre} ${usuario.apellido}`
        }
      });
    } catch (error) {
      console.error('Error al modificar usuario:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al modificar el usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🔓 Cambiar contrasena
  static async cambiarPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { password_actual, password_nueva } = req.body;

    try {
      if (!password_actual || !password_nueva) {
        return res.status(400).json({
          success: false,
          message: '❌ Se requiere la contrasena actual y la nueva contrasena'
        });
      }

      // Verificar contrasena actual
      const verificarQuery = `
        SELECT id FROM usuario 
        WHERE id = $1 AND password = crypt($2, password) AND estado = true
      `;
      
      const verificarResult = await pool.query(verificarQuery, [id, password_actual]);
      
      if (verificarResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '❌ La contrasena actual es incorrecta'
        });
      }

      // Actualizar contrasena
      const query = `
        UPDATE usuario SET 
          password = crypt($1, gen_salt('bf')),
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, codigo, nombre, apellido, email
      `;

      const result = await pool.query(query, [password_nueva, id]);

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_nuevos)
        VALUES ('UPDATE', 'usuario', $1, $1, NOW(), '{"accion": "cambio_password"}')
      `, [id]);

      res.json({
        success: true,
        message: '✅ Contrasena actualizada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al cambiar contrasena:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al cambiar la contrasena',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🔄 Restablecer contrasena
  static async restablecerPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { password_nueva } = req.body;

    try {
      if (!password_nueva) {
        return res.status(400).json({
          success: false,
          message: '❌ Se requiere la nueva contrasena'
        });
      }

      // Verificar que el usuario exista
      const usuarioCheck = await pool.query(
        'SELECT id, codigo, nombre, apellido FROM usuario WHERE id = $1 AND estado = true', 
        [id]
      );

      if (usuarioCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Usuario no encontrado'
        });
      }

      // Actualizar contrasena
      const query = `
        UPDATE usuario SET 
          password = crypt($1, gen_salt('bf')),
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, codigo, nombre, apellido, email
      `;

      const result = await pool.query(query, [password_nueva, id]);

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_nuevos)
        VALUES ('UPDATE', 'usuario', $1, $1, NOW(), '{"accion": "restablecimiento_password"}')
      `, [id]);

      res.json({
        success: true,
        message: '✅ Contrasena restablecida exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al restablecer contrasena:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al restablecer la contrasena',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ✅ Activar usuario
  static async activarUsuario(req: Request, res: Response) {
    const { id } = req.params;
    const { usuario_id } = req.body; // Usuario que realiza la accion

    try {
      // Obtener datos anteriores
      const anteriorResult = await pool.query('SELECT * FROM usuario WHERE id = $1', [id]);
      
      if (anteriorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Usuario no encontrado'
        });
      }

      const datosAnteriores = anteriorResult.rows[0];

      const query = `
        UPDATE usuario SET 
          estado = true,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, codigo, nombre, apellido, email, estado, updated_at
      `;

      const result = await pool.query(query, [id]);

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_anteriores, datos_nuevos)
        VALUES ('UPDATE', 'usuario', $1, $2, NOW(), $3, $4)
      `, [id, usuario_id, JSON.stringify(datosAnteriores), JSON.stringify(result.rows[0])]);

      res.json({
        success: true,
        message: '✅ Usuario activado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al activar usuario:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al activar el usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ❌ Inactivar usuario
  static async inactivarUsuario(req: Request, res: Response) {
    const { id } = req.params;
    const { usuario_id } = req.body; // Usuario que realiza la accion

    try {
      // Obtener datos anteriores
      const anteriorResult = await pool.query('SELECT * FROM usuario WHERE id = $1', [id]);
      
      if (anteriorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Usuario no encontrado'
        });
      }

      const datosAnteriores = anteriorResult.rows[0];

      const query = `
        UPDATE usuario SET 
          estado = false,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, codigo, nombre, apellido, email, estado, updated_at
      `;

      const result = await pool.query(query, [id]);

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_anteriores, datos_nuevos)
        VALUES ('UPDATE', 'usuario', $1, $2, NOW(), $3, $4)
      `, [id, usuario_id, JSON.stringify(datosAnteriores), JSON.stringify(result.rows[0])]);

      res.json({
        success: true,
        message: '⚠️ Usuario inactivado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al inactivar usuario:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al inactivar el usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  //  Obtener usuario por ID
  static async obtenerUsuario(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const query = `
        SELECT 
          u.id,
          u.codigo,
          u.nombre,
          u.apellido,
          u.nombre || ' ' || u.apellido as nombreCompleto,
          u.email as correo,
          u.telefono,
          u.documento,
          u.cargo,
          u.institucion_id,
          u.estado,
          u.ultimo_acceso,
          u.created_at,
          u.updated_at,
          i.nombre as institucion_nombre,
          r.id as rol_id,
          r.nombre as rol_nombre,
          r.descripcion as rol_descripcion,
          r.nivel as rol_nivel
        FROM usuario u
        LEFT JOIN institucion i ON u.institucion_id = i.id
        LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id AND ur.estado = true
        LEFT JOIN rol r ON ur.rol_id = r.id
        WHERE u.id = $1
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: '🔍 Usuario encontrado',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener el usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener usuarios técnicos (PLANIF) para filtros
  static async obtenerUsuariosTecnicos(req: Request, res: Response) {
    try {
      const query = `
        SELECT DISTINCT
          u.id,
          CONCAT(u.nombre, ' ', u.apellido) as nombre,
          u.email,
          i.nombre as institucion_nombre
        FROM usuario u
        LEFT JOIN institucion i ON u.institucion_id = i.id
        INNER JOIN usuario_rol ur ON u.id = ur.usuario_id
        INNER JOIN rol r ON ur.rol_id = r.id
        WHERE u.estado = true 
          AND ur.estado = true
          AND r.nombre = 'PLANIF'
        ORDER BY u.nombre, u.apellido
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        message: '✅ Usuarios técnicos obtenidos exitosamente',
        data: result.rows
      });
    } catch (error) {
      console.error('Error al obtener usuarios técnicos:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener usuarios técnicos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
