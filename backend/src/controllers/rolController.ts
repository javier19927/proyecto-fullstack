import { Request, Response } from 'express';
import pool from '../database/connection';
import { obtenerPermisosUsuario, PERMISOS, ROLES_PERMISOS } from '../middleware/rolePermissions';

interface AuthenticatedRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    roles: string[];
  };
}

export class RolController {
  
  // 🔍 Obtener todos los roles disponibles
  static async listarRoles(req: Request, res: Response) {
    try {
      const query = `
        SELECT 
          id, codigo, nombre, descripcion, nivel, estado, 
          created_at as fecha_creacion, updated_at as fecha_actualizacion
        FROM rol 
        WHERE estado = true
        ORDER BY nivel, nombre
      `;

      const result = await pool.query(query);
      
      // Agregar informacion de permisos para cada rol
      const rolesConPermisos = result.rows.map(rol => ({
        ...rol,
        permisos: ROLES_PERMISOS[rol.codigo] || [],
        total_permisos: (ROLES_PERMISOS[rol.codigo] || []).length
      }));
      
      res.json({
        success: true,
        message: '📋 Roles obtenidos exitosamente',
        data: rolesConPermisos,
        total: result.rows.length
      });
    } catch (error) {
      console.error('Error al listar roles:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener los roles',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🆕 Crear nuevo rol
  static async crearRol(req: Request, res: Response) {
    const { codigo, nombre, descripcion, nivel } = req.body;

    try {
      // Validaciones requeridas segun especificacion
      if (!descripcion || !nivel) {
        return res.status(400).json({
          success: false,
          message: '❌ Los campos descripcion y nivel son obligatorios'
        });
      }

      // Generar codigo unico si no se proporciona
      const codigoRol = codigo || nombre.toUpperCase().replace(/\s+/g, '_').substring(0, 10);

      // Verificar que el codigo no este en uso
      const codigoCheck = await pool.query(
        'SELECT id FROM rol WHERE codigo = $1', 
        [codigoRol]
      );

      if (codigoCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '❌ Ya existe un rol con ese codigo'
        });
      }

      const query = `
        INSERT INTO rol (codigo, nombre, descripcion, nivel, estado)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id, codigo, nombre, descripcion, nivel, estado, 
                 created_at, updated_at
      `;
      
      const values = [codigoRol, nombre, descripcion, nivel];
      const result = await pool.query(query, values);

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_nuevos)
        VALUES ('INSERT', 'rol', $1, $2, NOW(), $3)
      `, [result.rows[0].id, 1, JSON.stringify(result.rows[0])]);
      
      res.status(201).json({
        success: true,
        message: '✅ Rol creado exitosamente',
        data: {
          ...result.rows[0],
          permisos: ROLES_PERMISOS[codigoRol] || [],
          total_permisos: (ROLES_PERMISOS[codigoRol] || []).length
        }
      });
    } catch (error) {
      console.error('Error al crear rol:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al crear el rol',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 👥 Obtener permisos de un usuario
  static async obtenerPermisosUsuario(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const usuarioSolicitante = req.usuario;

    try {
      // Verificar que el usuario tenga permisos para ver esta informacion
      if (!usuarioSolicitante || 
          (!usuarioSolicitante.roles.includes('ADMIN') && 
           usuarioSolicitante.id !== parseInt(id))) {
        return res.status(403).json({
          success: false,
          message: '🚫 No tienes permisos para ver los permisos de este usuario'
        });
      }

      // Obtener roles del usuario
      const rolesQuery = `
        SELECT r.codigo, r.nombre, r.descripcion, r.nivel
        FROM usuario_rol ur
        JOIN rol r ON ur.rol_id = r.id
        WHERE ur.usuario_id = $1 AND ur.estado = true AND r.estado = true
        ORDER BY r.nivel
      `;

      const rolesResult = await pool.query(rolesQuery, [id]);
      const rolesUsuario = rolesResult.rows.map(rol => rol.codigo);
      
      // Obtener permisos basados en los roles
      const permisos = obtenerPermisosUsuario(rolesUsuario);
      
      res.json({
        success: true,
        message: '🔍 Permisos de usuario obtenidos exitosamente',
        data: {
          usuario_id: parseInt(id),
          roles: rolesResult.rows,
          permisos: permisos,
          total_permisos: permisos.length
        }
      });
    } catch (error) {
      console.error('Error al obtener permisos del usuario:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener los permisos del usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🔗 Asignar rol a usuario
  static async asignarRol(req: Request, res: Response) {
    const { usuario_id, rol_id } = req.body;

    try {
      // Verificar que el usuario existe
      const usuarioCheck = await pool.query(
        'SELECT id, nombre, apellido FROM usuario WHERE id = $1 AND estado = true',
        [usuario_id]
      );

      if (usuarioCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Usuario no encontrado'
        });
      }

      // Verificar que el rol existe
      const rolCheck = await pool.query(
        'SELECT id, codigo, nombre FROM rol WHERE id = $1 AND estado = true',
        [rol_id]
      );

      if (rolCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Rol no encontrado'
        });
      }

      // Asignar rol (usar UPSERT para evitar duplicados)
      const query = `
        INSERT INTO usuario_rol (usuario_id, rol_id, estado, fecha_asignacion)
        VALUES ($1, $2, true, NOW())
        ON CONFLICT (usuario_id, rol_id) 
        DO UPDATE SET estado = true, fecha_asignacion = NOW()
        RETURNING *
      `;

      const result = await pool.query(query, [usuario_id, rol_id]);
      
      res.json({
        success: true,
        message: `✅ Rol "${rolCheck.rows[0].nombre}" asignado exitosamente a ${usuarioCheck.rows[0].nombre} ${usuarioCheck.rows[0].apellido}`,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al asignar rol:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al asignar el rol',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ❌ Remover rol de usuario
  static async removerRol(req: Request, res: Response) {
    const { usuario_id, rol_id } = req.body;

    try {
      const query = `
        UPDATE usuario_rol 
        SET estado = false
        WHERE usuario_id = $1 AND rol_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [usuario_id, rol_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Asignacion de rol no encontrada'
        });
      }

      res.json({
        success: true,
        message: '✅ Rol removido exitosamente del usuario',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al remover rol:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al remover el rol',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 📊 Obtener informacion de permisos del sistema
  static async obtenerInfoPermisos(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: '📊 Informacion de permisos del sistema',
        data: {
          permisos_disponibles: PERMISOS,
          roles_permisos: ROLES_PERMISOS,
          modulos: [
            {
              nombre: 'CONFIGURACION_INSTITUCIONAL',
              descripcion: 'Gestion de instituciones, usuarios y roles',
              permisos: Object.values(PERMISOS.CONFIGURACION_INSTITUCIONAL)
            },
            {
              nombre: 'GESTION_OBJETIVOS',
              descripcion: 'Gestion de objetivos estrategicos, metas e indicadores',
              permisos: Object.values(PERMISOS.GESTION_OBJETIVOS)
            },
            {
              nombre: 'PROYECTOS_INVERSION',
              descripcion: 'Gestion de proyectos de inversion y actividades',
              permisos: Object.values(PERMISOS.PROYECTOS_INVERSION)
            },
            {
              nombre: 'AUDITORIA',
              descripcion: 'Auditoria y bitacora del sistema',
              permisos: Object.values(PERMISOS.AUDITORIA)
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error al obtener informacion de permisos:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener informacion de permisos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🔍 Obtener rol por ID
  static async obtenerRol(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const query = `
        SELECT 
          id, codigo, nombre, descripcion, nivel, estado, 
          created_at as fecha_creacion, updated_at as fecha_actualizacion
        FROM rol 
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Rol no encontrado'
        });
      }

      const rol = result.rows[0];
      
      res.json({
        success: true,
        message: '🔍 Rol encontrado',
        data: {
          ...rol,
          permisos: ROLES_PERMISOS[rol.codigo] || [],
          total_permisos: (ROLES_PERMISOS[rol.codigo] || []).length
        }
      });
    } catch (error) {
      console.error('Error al obtener rol:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al obtener el rol',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // 🔒 Asignar permiso a rol (metodo requerido por especificacion)
  static async asignarPermiso(req: Request, res: Response) {
    const { rolId } = req.params;
    const { permiso, usuario_id } = req.body;

    try {
      // Verificar que el rol exista
      const rolCheck = await pool.query(
        'SELECT codigo, nombre FROM rol WHERE id = $1 AND estado = true', 
        [rolId]
      );

      if (rolCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '❌ Rol no encontrado'
        });
      }

      const rol = rolCheck.rows[0];

      // Obtener todos los permisos disponibles
      const todosLosPermisos: string[] = [];
      Object.values(PERMISOS).forEach(modulo => {
        if (typeof modulo === 'object') {
          Object.values(modulo).forEach(perm => {
            if (typeof perm === 'string') {
              todosLosPermisos.push(perm);
            }
          });
        }
      });

      // Verificar que el permiso sea valido
      if (!todosLosPermisos.includes(permiso)) {
        return res.status(400).json({
          success: false,
          message: '❌ El permiso especificado no es valido',
          permisos_disponibles: todosLosPermisos
        });
      }

      // Encontrar la descripcion del permiso
      let permisoDescripcion = '';
      for (const [modulo, permisos] of Object.entries(PERMISOS)) {
        if (typeof permisos === 'object') {
          for (const [nombre, valor] of Object.entries(permisos)) {
            if (valor === permiso) {
              permisoDescripcion = `${modulo}.${nombre}`;
              break;
            }
          }
        }
      }

      // Registrar en auditoria la asignacion de permiso
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_nuevos)
        VALUES ('UPDATE', 'rol', $1, $2, NOW(), $3)
      `, [rolId, usuario_id, JSON.stringify({
        accion: 'asignar_permiso',
        rol_codigo: rol.codigo,
        permiso: permiso,
        descripcion: permisoDescripcion
      })]);

      res.json({
        success: true,
        message: '✅ Permiso asignado exitosamente',
        data: {
          rol_id: parseInt(rolId),
          rol_codigo: rol.codigo,
          rol_nombre: rol.nombre,
          permiso_asignado: permiso,
          permiso_descripcion: permisoDescripcion,
          nota: 'Los permisos se manejan a nivel de codigo en rolePermissions.ts. Esta asignacion se registro en auditoria.'
        }
      });
    } catch (error) {
      console.error('Error al asignar permiso:', error);
      res.status(500).json({
        success: false,
        message: '❌ Error al asignar el permiso',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
