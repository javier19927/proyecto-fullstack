import { Request, Response } from 'express';
import pool from '../database/connection';
import { ApiResponse, CreateProyectoDTO, ProyectoFilter } from '../models';

// ============================================
// MODULO 3: PROYECTOS DE INVERSION
// ============================================

// ============================================
// METODOS ESPECIFICOS SEGUN ESPECIFICACIONES
// ============================================

// Metodo: crearProyecto() (alias de createProyecto)
// Se definira al final del archivo

// Metodo: eliminarProyecto() (alias de deleteProyecto)
// Se definira al final del archivo

// Metodo: actualizarActividad()
export const actualizarActividad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      idActividad, 
      nombreActividad, 
      fechaProgramada, 
      descripcion, 
      tipo, 
      estado, 
      porcentaje_avance,
      codigo,
      nombre
    } = req.body;

    // Mapear campos del frontend al esquema de la base de datos
    const actividadCodigo = codigo || idActividad;
    const actividadNombre = nombre || nombreActividad;

    const result = await pool.query(`
      UPDATE actividad 
      SET codigo = $1, nombre = $2, descripcion = $3, tipo = $4, 
          estado = $5, porcentaje_avance = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, codigo, nombre, descripcion, tipo, estado, 
                porcentaje_avance, updated_at
    `, [actividadCodigo, actividadNombre, descripcion, tipo, estado, porcentaje_avance || 0, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Actividad no encontrada'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Actividad actualizada exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ Error en actualizarActividad:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: `Error interno del servidor: ${error.message}`
    };
    res.status(500).json(response);
  }
};

// Metodo: registrarActividad()
export const registrarActividad = async (req: Request, res: Response) => {
  try {
    const { proyectoId } = req.params;
    const { 
      idActividad, 
      nombreActividad, 
      fechaProgramada, 
      descripcion, 
      tipo, 
      actividad_padre_id, 
      responsable_id,
      codigo,
      nombre
    } = req.body;

    // Mapear campos del frontend al esquema real de la base de datos
    const actividadCodigo = codigo || idActividad || `ACT-${proyectoId}-${Date.now()}`;
    const actividadNombre = nombre || nombreActividad;
    
    console.log('🔹 Registrando actividad:', {
      proyectoId,
      codigo: actividadCodigo,
      nombre: actividadNombre,
      idactividad: idActividad,
      nombreactividad: nombreActividad,
      fechaprogramada: fechaProgramada,
      descripcion,
      tipo,
      actividad_padre_id,
      responsable_id
    });

    // Validar campos requeridos según el esquema real de la base de datos
    if (!actividadCodigo || !actividadNombre) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Faltan campos requeridos: codigo, nombre'
      };
      return res.status(400).json(response);
    }

    // 🔹 3. Registrar actividades del POA para el proyecto
    // Usar los campos que realmente existen en la base de datos
    const result = await pool.query(`
      INSERT INTO actividad (
        codigo, nombre, idactividad, nombreactividad, fechaprogramada, 
        descripcion, tipo, estado, proyecto_id, actividad_padre_id, responsable_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PLANIFICADA', $8, $9, $10)
      RETURNING id, codigo, nombre, idactividad, nombreactividad, fechaprogramada, 
                descripcion, tipo, estado, created_at
    `, [
      actividadCodigo, 
      actividadNombre, 
      idActividad || actividadCodigo,
      nombreActividad || actividadNombre,
      fechaProgramada, 
      descripcion, 
      tipo || 'PRINCIPAL', 
      proyectoId, 
      actividad_padre_id || null, 
      responsable_id || null
    ]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Actividad del POA registrada exitosamente al proyecto'
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    console.error('❌ Error en registrarActividad:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: `Error interno del servidor: ${error.message}`
    };
    res.status(500).json(response);
  }
};

// Metodo: asignarPresupuesto()
export const asignarPresupuesto = async (req: Request, res: Response) => {
  try {
    const { proyectoId } = req.params;
    const { idPresupuesto, anio, monto, tipo } = req.body;

    // Validar campos requeridos según el esquema real de la base de datos
    if (!idPresupuesto || !monto || !anio) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Faltan campos requeridos: idPresupuesto, monto, anio'
      };
      return res.status(400).json(response);
    }

    console.log('🔹 Asignando presupuesto:', {
      proyectoId,
      idPresupuesto,
      anio,
      monto,
      tipo
    });

    // 🔹 4. Asignar presupuesto al proyecto usando el esquema real
    const result = await pool.query(`
      INSERT INTO presupuesto (idpresupuesto, anio, monto, proyecto_id, tipo, estado)
      VALUES ($1, $2, $3, $4, $5, 'ASIGNADO')
      RETURNING id, idpresupuesto, anio, monto, tipo, estado, created_at
    `, [idPresupuesto, anio, monto, proyectoId, tipo || 'INICIAL']);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Presupuesto asignado exitosamente al proyecto'
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    console.error('❌ Error en asignarPresupuesto:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: `Error interno del servidor: ${error.message}`
    };
    res.status(500).json(response);
  }
};

// Metodo: revisarPresupuesto()
export const revisarPresupuesto = async (req: Request, res: Response) => {
  try {
    const { proyectoId } = req.query;
    
    console.log('🔹 Revisando presupuesto del proyecto:', proyectoId);
    
    const result = await pool.query(`
      SELECT p.id, p.idpresupuesto, p.anio, p.monto, p.tipo, p.estado, 
             p.created_at,
             pr.nombre as proyecto_nombre, pr.codigo as proyecto_codigo
      FROM presupuesto p
      LEFT JOIN proyecto pr ON p.proyecto_id = pr.id
      WHERE p.proyecto_id = $1
      ORDER BY p.anio DESC, p.created_at DESC
    `, [proyectoId]);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows,
      message: `Se encontraron ${result.rows.length} registros de presupuesto`
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ Error en revisarPresupuesto:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: `Error interno del servidor: ${error.message}`
    };
    res.status(500).json(response);
  }
};

// Proyectos
export const getProyectos = async (req: Request, res: Response) => {
  try {
    const { 
      estado, 
      tipo, 
      responsable_id, 
      institucion_id, 
      objetivo_id, 
      prioridad 
    } = req.query as ProyectoFilter;
    
    let whereConditions = ['1=1'];
    let params: any[] = [];
    let paramCount = 0;

    if (estado) {
      paramCount++;
      whereConditions.push(`p.estado = $${paramCount}`);
      params.push(estado);
    }

    if (tipo) {
      paramCount++;
      whereConditions.push(`p.tipo = $${paramCount}`);
      params.push(tipo);
    }

    if (responsable_id) {
      paramCount++;
      whereConditions.push(`p.responsable_id = $${paramCount}`);
      params.push(responsable_id);
    }

    if (institucion_id) {
      paramCount++;
      whereConditions.push(`p.institucion_id = $${paramCount}`);
      params.push(institucion_id);
    }

    if (objetivo_id) {
      paramCount++;
      whereConditions.push(`p.objetivo_id = $${paramCount}`);
      params.push(objetivo_id);
    }

    if (prioridad) {
      paramCount++;
      whereConditions.push(`p.prioridad = $${paramCount}`);
      params.push(prioridad);
    }

    const query = `
      SELECT p.id, p.codigo, p.nombre, p.descripcion, p.tipo, p.estado,
             p.fecha_inicio, p.fecha_fin, p.duracion_meses, p.presupuesto_total,
             p.presupuesto_ejecutado, p.porcentaje_avance, p.prioridad,
             p.ubicacion_geografica, p.beneficiarios_directos, p.beneficiarios_indirectos,
             p.created_at, p.updated_at,
             o.nombre as objetivo_nombre,
             r.nombre as responsable_nombre,
             s.nombre as supervisor_nombre,
             i.nombre as institucion_nombre,
             COUNT(a.id) as total_actividades
      FROM proyecto p
      LEFT JOIN objetivo o ON p.objetivo_id = o.id
      LEFT JOIN usuario r ON p.responsable_id = r.id
      LEFT JOIN usuario s ON p.supervisor_id = s.id
      LEFT JOIN institucion i ON p.institucion_id = i.id
      LEFT JOIN actividad a ON p.id = a.proyecto_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY p.id, o.nombre, r.nombre, s.nombre, i.nombre
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, params);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const getProyectoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT p.id, p.codigo, p.nombre, p.descripcion, p.tipo, p.estado,
             p.fecha_inicio, p.fecha_fin, p.duracion_meses, p.presupuesto_total,
             p.presupuesto_ejecutado, p.porcentaje_avance, p.prioridad,
             p.ubicacion_geografica, p.beneficiarios_directos, p.beneficiarios_indirectos,
             p.objetivo_id, p.responsable_id, p.supervisor_id, p.institucion_id,
             p.created_at, p.updated_at,
             o.nombre as objetivo_nombre, o.codigo as objetivo_codigo,
             r.nombre as responsable_nombre, r.email as responsable_email,
             s.nombre as supervisor_nombre, s.email as supervisor_email,
             i.nombre as institucion_nombre, i.codigo as institucion_codigo
      FROM proyecto p
      LEFT JOIN objetivo o ON p.objetivo_id = o.id
      LEFT JOIN usuario r ON p.responsable_id = r.id
      LEFT JOIN usuario s ON p.supervisor_id = s.id
      LEFT JOIN institucion i ON p.institucion_id = i.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado'
      };
      return res.status(404).json(response);
    }

    // Obtener actividades del proyecto
    const actividadesResult = await pool.query(`
      SELECT a.id, a.codigo, a.nombre, a.descripcion, a.tipo, a.estado,
             a.fecha_inicio_planificada, a.fecha_fin_planificada,
             a.fecha_inicio_real, a.fecha_fin_real, a.porcentaje_avance,
             a.presupuesto, a.presupuesto_ejecutado,
             r.nombre as responsable_nombre,
             ap.nombre as actividad_padre_nombre
      FROM actividad a
      LEFT JOIN usuario r ON a.responsable_id = r.id
      LEFT JOIN actividad ap ON a.actividad_padre_id = ap.id
      WHERE a.proyecto_id = $1
      ORDER BY a.created_at
    `, [id]);

    const proyecto = {
      ...result.rows[0],
      actividades: actividadesResult.rows
    };

    const response: ApiResponse<any> = {
      success: true,
      data: proyecto
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const createProyecto = async (req: Request, res: Response) => {
  try {
    const data: CreateProyectoDTO = req.body;
    const usuario = (req as any).usuario; // Usuario autenticado desde middleware
    
    console.log('🔹 [CREAR PROYECTO] Iniciando creacion de proyecto:', {
      usuario: usuario ? { id: usuario.id, email: usuario.email, roles: usuario.roles, institucion_id: usuario.institucion_id } : null,
      datos: data
    });
    
    // 🔹 1. Registrar un proyecto nuevo
    // El usuario (Tecnico de Planificacion) ingresa la informacion del proyecto:
    // - Descripcion del proyecto, Fecha de inicio y fin, Monto estimado
    // - Estado inicial: Borrador
    
    // Validaciones basicas mejoradas
    if (!data.codigo || !data.nombre || !data.descripcion) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Codigo, nombre y descripcion son obligatorios'
      };
      return res.status(400).json(response);
    }

    if (!data.fecha_inicio || !data.fecha_fin) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Fecha de inicio y fin son obligatorias'
      };
      return res.status(400).json(response);
    }

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = new Date(data.fecha_fin);
    
    if (fechaFin <= fechaInicio) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'La fecha de fin debe ser posterior a la fecha de inicio'
      };
      return res.status(400).json(response);
    }

    // Verificar si el codigo ya existe
    const existingProj = await pool.query(
      'SELECT id FROM proyecto WHERE codigo = $1',
      [data.codigo]
    );

    if (existingProj.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El codigo de proyecto ya existe'
      };
      return res.status(409).json(response);
    }

    // Si no se especifica responsable, usar el usuario actual
    const responsable_id = data.responsable_id || usuario?.id;

    if (!responsable_id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Responsable es obligatorio'
      };
      return res.status(400).json(response);
    }

    console.log('🔹 [CREAR PROYECTO] Insertando en BD con valores:', {
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: data.tipo || 'INVERSION',
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      duracion_meses: data.duracion_meses || Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * 30)),
      presupuesto_total: data.presupuesto_total || data.monto || 0,
      monto: data.monto || data.presupuesto_total || 0,
      objetivo_id: data.objetivo_id || null,
      responsable_id,
      supervisor_id: data.supervisor_id || null,
      prioridad: data.prioridad || 'MEDIA',
      ubicacion_geografica: data.ubicacion_geografica || null,
      beneficiarios_directos: data.beneficiarios_directos || 0,
      beneficiarios_indirectos: data.beneficiarios_indirectos || 0,
      institucion_id: usuario?.institucion_id || null
    });

    const result = await pool.query(`
      INSERT INTO proyecto (codigo, nombre, descripcion, tipo, fecha_inicio, fecha_fin,
                           duracion_meses, presupuesto_total, monto, estado, objetivo_id, responsable_id,
                           supervisor_id, prioridad, ubicacion_geografica, 
                           beneficiarios_directos, beneficiarios_indirectos, institucion_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Borrador', $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, codigo, nombre, descripcion, tipo, estado, fecha_inicio, fecha_fin,
                duracion_meses, presupuesto_total, monto, presupuesto_ejecutado, porcentaje_avance,
                prioridad, ubicacion_geografica, beneficiarios_directos, beneficiarios_indirectos,
                created_at, updated_at
    `, [
      data.codigo, 
      data.nombre, 
      data.descripcion, 
      data.tipo || 'INVERSION', 
      data.fecha_inicio, 
      data.fecha_fin, 
      data.duracion_meses || Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * 30)), // Calcular duracion en meses
      data.presupuesto_total || data.monto || 0,
      data.monto || data.presupuesto_total || 0, // monto estimado
      data.objetivo_id || null, 
      responsable_id, 
      data.supervisor_id || null, 
      data.prioridad || 'MEDIA', 
      data.ubicacion_geografica || null, 
      data.beneficiarios_directos || 0, 
      data.beneficiarios_indirectos || 0,
      usuario?.institucion_id || null // Asignar institucion del usuario actual
    ]);

    console.log('✅ [CREAR PROYECTO] Proyecto creado exitosamente:', result.rows[0]);

    // Registrar en auditoria - Temporalmente comentado para evitar error
    if (usuario) {
      try {
        await pool.query(`
          INSERT INTO auditoria (usuario_id, accion, detalles)
          VALUES ($1, $2, $3)
        `, [
          usuario.id,
          'CREAR_PROYECTO',
          JSON.stringify({
            codigo: data.codigo,
            nombre: data.nombre,
            estado: 'Borrador',
            proyecto_id: result.rows[0].id
          })
        ]);
      } catch (auditError) {
        console.warn('⚠️ Error al registrar auditoría (no crítico):', auditError);
        // No fallar la creación del proyecto por un error de auditoría
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Proyecto creado exitosamente con estado Borrador'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ [CREAR PROYECTO] Error al crear proyecto:', error);
    console.error('❌ [CREAR PROYECTO] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    };
    res.status(500).json(response);
  }
};

// Actividades
export const getActividadesByProyecto = async (req: Request, res: Response) => {
  try {
    const { proyectoId } = req.params;
    
    console.log('🔹 Obteniendo actividades del proyecto:', proyectoId);
    
    const result = await pool.query(`
      SELECT a.id, a.codigo, a.nombre, a.idactividad, a.nombreactividad, 
             a.descripcion, a.tipo, a.estado, a.fechaprogramada,
             a.fecha_inicio_planificada, a.fecha_fin_planificada,
             a.porcentaje_avance, a.presupuesto, a.presupuesto_ejecutado, 
             a.created_at, a.updated_at,
             r.nombre as responsable_nombre,
             ap.nombre as actividad_padre_nombre
      FROM actividad a
      LEFT JOIN usuario r ON a.responsable_id = r.id
      LEFT JOIN actividad ap ON a.actividad_padre_id = ap.id
      WHERE a.proyecto_id = $1 AND (a.estado != 'ELIMINADA' OR a.estado IS NULL)
      ORDER BY a.created_at
    `, [proyectoId]);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows,
      message: `Se encontraron ${result.rows.length} actividades`
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ Error al obtener actividades:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: `Error interno del servidor: ${error.message}`
    };
    res.status(500).json(response);
  }
};

export const createActividad = async (req: Request, res: Response) => {
  try {
    const { proyectoId } = req.params;
    const { 
      codigo, nombre, descripcion, tipo, fecha_inicio_planificada, 
      fecha_fin_planificada, presupuesto, actividad_padre_id, responsable_id 
    } = req.body;
    
    if (!codigo || !nombre) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Codigo y nombre son obligatorios'
      };
      return res.status(400).json(response);
    }

    const result = await pool.query(`
      INSERT INTO actividad (codigo, nombre, descripcion, tipo, fecha_inicio_planificada,
                            fecha_fin_planificada, presupuesto, proyecto_id, 
                            actividad_padre_id, responsable_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, codigo, nombre, descripcion, tipo, estado, 
                fecha_inicio_planificada, fecha_fin_planificada, porcentaje_avance,
                presupuesto, presupuesto_ejecutado, created_at, updated_at
    `, [
      codigo, nombre, descripcion, tipo, fecha_inicio_planificada,
      fecha_fin_planificada, presupuesto, proyectoId, actividad_padre_id, responsable_id
    ]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Actividad creada exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error al crear actividad:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: eliminarActividad() (opcional segun especificacion)
export const eliminarActividad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE actividad 
      SET estado = 'ELIMINADA', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, codigo, nombre
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Actividad no encontrada'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Actividad eliminada exitosamente'
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

// Funciones adicionales para proyectos
export const updateProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    console.log('🔹 Actualizando proyecto:', { id, data });
    console.log('🔹 Tipos de datos recibidos:', {
      monto: typeof data.monto,
      presupuesto_total: typeof data.presupuesto_total,
      fecha_inicio: typeof data.fecha_inicio,
      fecha_fin: typeof data.fecha_fin
    });

    // Verificar que el proyecto existe primero
    const existingProject = await pool.query(
      'SELECT * FROM proyecto WHERE id = $1',
      [id]
    );

    if (existingProject.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado'
      };
      return res.status(404).json(response);
    }

    const currentProject = existingProject.rows[0];

    // Validar campos requeridos básicos solo si se están enviando
    if (data.codigo !== undefined && !data.codigo) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El código no puede estar vacío'
      };
      return res.status(400).json(response);
    }

    if (data.nombre !== undefined && !data.nombre) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El nombre no puede estar vacío'
      };
      return res.status(400).json(response);
    }

    // Calcular duración en meses si no se proporciona
    let duracionMeses = data.duracion_meses;
    if (!duracionMeses && data.fecha_inicio && data.fecha_fin) {
      const fechaInicio = new Date(data.fecha_inicio);
      const fechaFin = new Date(data.fecha_fin);
      const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
      duracionMeses = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // Aproximación
    }

    // Verificar si existe otro codigo igual (solo si se está actualizando el código)
    if (data.codigo && data.codigo !== currentProject.codigo) {
      const existingProj = await pool.query(
        'SELECT id FROM proyecto WHERE codigo = $1 AND id != $2',
        [data.codigo, id]
      );

      if (existingProj.rows.length > 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'El código de proyecto ya existe'
        };
        return res.status(409).json(response);
      }
    }

    // Preparar valores para la actualización - usar valores actuales si no se proporcionan nuevos
    const updateValues = {
      codigo: data.codigo !== undefined ? data.codigo : currentProject.codigo,
      nombre: data.nombre !== undefined ? data.nombre : currentProject.nombre,
      descripcion: data.descripcion !== undefined ? data.descripcion : currentProject.descripcion,
      tipo: data.tipo !== undefined ? data.tipo : currentProject.tipo,
      fecha_inicio: data.fecha_inicio !== undefined ? data.fecha_inicio : currentProject.fecha_inicio,
      fecha_fin: data.fecha_fin !== undefined ? data.fecha_fin : currentProject.fecha_fin,
      duracion_meses: duracionMeses !== undefined ? duracionMeses : currentProject.duracion_meses,
      presupuesto_total: data.presupuesto_total !== undefined ? parseFloat(data.presupuesto_total) || 0 : 
                        data.monto !== undefined ? parseFloat(data.monto) || 0 : currentProject.presupuesto_total,
      monto: data.monto !== undefined ? parseFloat(data.monto) || 0 : 
             data.presupuesto_total !== undefined ? parseFloat(data.presupuesto_total) || 0 : currentProject.monto,
      prioridad: data.prioridad !== undefined ? data.prioridad : currentProject.prioridad,
      ubicacion_geografica: data.ubicacion_geografica !== undefined ? data.ubicacion_geografica : currentProject.ubicacion_geografica,
      beneficiarios_directos: data.beneficiarios_directos !== undefined ? parseInt(data.beneficiarios_directos) || 0 : currentProject.beneficiarios_directos,
      beneficiarios_indirectos: data.beneficiarios_indirectos !== undefined ? parseInt(data.beneficiarios_indirectos) || 0 : currentProject.beneficiarios_indirectos,
      objetivo_id: data.objetivo_id !== undefined ? (data.objetivo_id === null ? null : data.objetivo_id) : currentProject.objetivo_id,
      responsable_id: data.responsable_id !== undefined ? (data.responsable_id === null ? null : data.responsable_id) : currentProject.responsable_id,
      supervisor_id: data.supervisor_id !== undefined ? (data.supervisor_id === null ? null : data.supervisor_id) : currentProject.supervisor_id
    };

    console.log('🔹 Valores preparados para actualización:', updateValues);

    const result = await pool.query(`
      UPDATE proyecto 
      SET codigo = $1, nombre = $2, descripcion = $3, tipo = $4,
          fecha_inicio = $5, fecha_fin = $6, duracion_meses = $7,
          presupuesto_total = $8, monto = $9, prioridad = $10, 
          ubicacion_geografica = $11, beneficiarios_directos = $12, 
          beneficiarios_indirectos = $13, objetivo_id = $14, 
          responsable_id = $15, supervisor_id = $16,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $17 AND estado != 'FINALIZADO'
      RETURNING *
    `, [
      updateValues.codigo, 
      updateValues.nombre, 
      updateValues.descripcion, 
      updateValues.tipo,
      updateValues.fecha_inicio, 
      updateValues.fecha_fin, 
      updateValues.duracion_meses,
      updateValues.presupuesto_total,
      updateValues.monto,
      updateValues.prioridad, 
      updateValues.ubicacion_geografica,
      updateValues.beneficiarios_directos, 
      updateValues.beneficiarios_indirectos,
      updateValues.objetivo_id, 
      updateValues.responsable_id, 
      updateValues.supervisor_id,
      id
    ]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado o no puede ser actualizado (estado FINALIZADO)'
      };
      return res.status(404).json(response);
    }

    console.log('✅ Proyecto actualizado exitosamente:', result.rows[0]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Proyecto actualizado exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ Error en updateProyecto:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Manejo específico de errores de base de datos
    let errorMessage = 'Error interno del servidor';
    if (error.code) {
      switch (error.code) {
        case '23505': // Duplicate key
          errorMessage = 'El código de proyecto ya existe';
          break;
        case '23503': // Foreign key violation
          errorMessage = 'Referencia inválida en uno de los campos relacionados';
          break;
        case '23502': // Not null violation
          errorMessage = 'Faltan campos requeridos';
          break;
        default:
          errorMessage = `Error de base de datos: ${error.message}`;
      }
    } else {
      errorMessage = error.message || 'Error desconocido';
    }
    
    const response: ApiResponse<null> = {
      success: false,
      error: errorMessage
    };
    res.status(500).json(response);
  }
};

export const deleteProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 🔹 2. Editar o eliminar un proyecto existente
    // Tambien puede eliminarse si aun no ha sido enviado (estado Borrador)
    const result = await pool.query(`
      UPDATE proyecto 
      SET estado = 'ELIMINADO', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado = 'Borrador'
      RETURNING id, codigo, nombre, estado
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado o no puede ser eliminado (debe estar en estado Borrador)'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Proyecto eliminado exitosamente'
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

export const enviarAValidacionProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 🔹 5. Enviar el proyecto a validacion
    // El tecnico finaliza el ingreso de informacion
    // El proyecto cambia de estado a "Enviado" para revision
    const result = await pool.query(`
      UPDATE proyecto 
      SET estado = 'Enviado', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado IN ('Borrador', 'PLANIFICACION')
      RETURNING id, codigo, nombre, estado
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado o no esta en estado Borrador'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Proyecto enviado a validacion exitosamente. Estado cambiado a Enviado.'
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

export const aprobarProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    // 🔹 6. Validar o rechazar el proyecto
    // El revisor institucional accede al proyecto
    // Puede aprobar, cambiando el estado a "Aprobado"
    const result = await pool.query(`
      UPDATE proyecto 
      SET estado = 'Aprobado', observaciones = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado = 'Enviado'
      RETURNING id, codigo, nombre, estado
    `, [observaciones || null, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado o no esta en estado Enviado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Proyecto aprobado exitosamente'
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

export const rechazarProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    // 🔹 6. Validar o rechazar el proyecto
    // El revisor institucional accede al proyecto
    // Puede rechazar, cambiando el estado a "Rechazado"
    if (!observaciones || observaciones.trim() === '') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Las observaciones son requeridas para rechazar un proyecto'
      };
      return res.status(400).json(response);
    }

    const result = await pool.query(`
      UPDATE proyecto 
      SET estado = 'Rechazado', observaciones = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado = 'Enviado'
      RETURNING id, codigo, nombre, estado
    `, [observaciones, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado o no esta en estado Enviado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Proyecto rechazado exitosamente'
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

export const iniciarEjecucion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE proyecto 
      SET estado = 'EJECUCION', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado = 'APROBADO'
      RETURNING id, codigo, nombre, estado
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado o no esta aprobado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Ejecucion del proyecto iniciada exitosamente'
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

export const finalizarProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { observaciones_finalizacion } = req.body;

    // Actualizar porcentaje a 100% y finalizar
    const result = await pool.query(`
      UPDATE proyecto 
      SET estado = 'FINALIZADO', 
          porcentaje_avance = 100,
          observaciones = COALESCE($1, observaciones),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado = 'EJECUCION'
      RETURNING id, codigo, nombre, estado, porcentaje_avance
    `, [observaciones_finalizacion || null, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado o no esta en ejecucion'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Proyecto finalizado exitosamente'
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

export const actualizarPresupuesto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { presupuesto_ejecutado, observaciones } = req.body;

    if (presupuesto_ejecutado < 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El presupuesto ejecutado no puede ser negativo'
      };
      return res.status(400).json(response);
    }

    const result = await pool.query(`
      UPDATE proyecto 
      SET presupuesto_ejecutado = $1,
          observaciones = COALESCE($2, observaciones),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND estado IN ('EJECUCION', 'APROBADO')
      RETURNING id, codigo, nombre, presupuesto_total, presupuesto_ejecutado
    `, [presupuesto_ejecutado, observaciones || null, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado o no se puede actualizar el presupuesto'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Presupuesto actualizado exitosamente'
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

// Dashboard/Estadisticas
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Estadisticas generales
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM proyecto WHERE estado != 'FINALIZADO') as proyectos_activos,
        (SELECT COUNT(*) FROM proyecto WHERE estado = 'EJECUCION') as proyectos_ejecucion,
        (SELECT COUNT(*) FROM objetivo WHERE estado = 'ACTIVO') as objetivos_activos,
        (SELECT COUNT(*) FROM meta WHERE estado = 'ACTIVO') as metas_activas,
        (SELECT SUM(presupuesto_total) FROM proyecto WHERE estado != 'FINALIZADO') as presupuesto_total,
        (SELECT SUM(presupuesto_ejecutado) FROM proyecto) as presupuesto_ejecutado
    `);

    // Proyectos por estado
    const proyectosPorEstado = await pool.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM proyecto
      GROUP BY estado
      ORDER BY cantidad DESC
    `);

    // Proyectos por prioridad
    const proyectosPorPrioridad = await pool.query(`
      SELECT prioridad, COUNT(*) as cantidad
      FROM proyecto
      GROUP BY prioridad
      ORDER BY CASE prioridad WHEN 'ALTA' THEN 1 WHEN 'MEDIA' THEN 2 WHEN 'BAJA' THEN 3 END
    `);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        estadisticas: statsResult.rows[0],
        proyectos_por_estado: proyectosPorEstado.rows,
        proyectos_por_prioridad: proyectosPorPrioridad.rows
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener estadisticas del dashboard:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// ============================================
// 🔹 7. CONSULTAR, FILTRAR Y MONITOREAR PROYECTOS
// ============================================

// Metodo especifico para consultar proyectos segun estado: aprobado, pendiente, rechazado
export const consultarProyectosPorEstado = async (req: Request, res: Response) => {
  try {
    const { estado } = req.query;
    
    // Mapear estados del requerimiento a estados de la BD
    let estadoFiltro = '';
    switch (estado) {
      case 'aprobado':
        estadoFiltro = 'Aprobado';
        break;
      case 'pendiente':
        estadoFiltro = 'Enviado';
        break;
      case 'rechazado':
        estadoFiltro = 'Rechazado';
        break;
      case 'borrador':
        estadoFiltro = 'Borrador';
        break;
      default:
        // Si no se especifica estado, devolver todos
        estadoFiltro = '';
    }

    let query = `
      SELECT p.id, p.codigo, p.nombre, p.descripcion, p.estado,
             p.fecha_inicio as "fechaInicio", p.fecha_fin as "fechaFin",
             COALESCE(p.monto, p.presupuesto_total) as monto,
             p.porcentaje_avance, p.prioridad, p.created_at, p.updated_at,
             o.nombre as objetivo_nombre,
             r.nombre as responsable_nombre,
             s.nombre as supervisor_nombre,
             i.nombre as institucion_nombre,
             -- 🔹 7. Consultar actividades, presupuesto, fechas, validaciones
             (SELECT COUNT(*) FROM actividad a WHERE a.proyecto_id = p.id) as total_actividades,
             (SELECT COUNT(*) FROM presupuesto pr WHERE pr.entidad_tipo = 'PROYECTO' AND pr.entidad_id = p.id) as total_presupuestos,
             (SELECT COUNT(*) FROM validacion v WHERE v.entidad_tipo = 'PROYECTO' AND v.entidad_id = p.id) as total_validaciones,
             (SELECT SUM(pr.monto_asignado) FROM presupuesto pr WHERE pr.entidad_tipo = 'PROYECTO' AND pr.entidad_id = p.id) as presupuesto_asignado_total
      FROM proyecto p
      LEFT JOIN objetivo o ON p.objetivo_id = o.id
      LEFT JOIN usuario r ON p.responsable_id = r.id
      LEFT JOIN usuario s ON p.supervisor_id = s.id
      LEFT JOIN institucion i ON p.institucion_id = i.id
    `;

    let params: any[] = [];
    
    if (estadoFiltro) {
      query += ` WHERE p.estado = $1`;
      params.push(estadoFiltro);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows,
      message: `Proyectos consultados ${estado ? `con estado ${estado}` : 'todos'} exitosamente`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al consultar proyectos:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo para monitorear proyectos en tiempo real con detalles completos
export const monitorearProyectos = async (req: Request, res: Response) => {
  try {
    const query = `
      WITH proyecto_stats AS (
        SELECT 
          p.id,
          COUNT(DISTINCT a.id) as actividades_count,
          COUNT(DISTINCT pr.id) as presupuestos_count,
          COUNT(DISTINCT v.id) as validaciones_count,
          SUM(pr.monto_asignado) as presupuesto_total,
          AVG(a.porcentaje_avance) as avance_promedio_actividades
        FROM proyecto p
        LEFT JOIN actividad a ON p.id = a.proyecto_id
        LEFT JOIN presupuesto pr ON p.id = pr.entidad_id AND pr.entidad_tipo = 'PROYECTO'
        LEFT JOIN validacion v ON p.id = v.entidad_id AND v.entidad_tipo = 'PROYECTO'
        GROUP BY p.id
      )
      SELECT 
        p.id, p.codigo, p.nombre, p.descripcion, p.estado,
        p.fecha_inicio as "fechaInicio", p.fecha_fin as "fechaFin",
        COALESCE(p.monto, p.presupuesto_total) as monto,
        p.porcentaje_avance, p.prioridad, p.observaciones,
        p.created_at, p.updated_at,
        o.nombre as objetivo_nombre,
        r.nombre as responsable_nombre,
        i.nombre as institucion_nombre,
        ps.actividades_count,
        ps.presupuestos_count,
        ps.validaciones_count,
        ps.presupuesto_total as presupuesto_asignado_total,
        ROUND(ps.avance_promedio_actividades, 2) as avance_promedio_actividades,
        -- Estado del proyecto para monitoreo
        CASE 
          WHEN p.estado = 'Borrador' THEN 'En elaboracion'
          WHEN p.estado = 'Enviado' THEN 'Pendiente de validacion'
          WHEN p.estado = 'Aprobado' THEN 'Aprobado para ejecucion'
          WHEN p.estado = 'Rechazado' THEN 'Rechazado'
          ELSE p.estado
        END as estado_descripcion
      FROM proyecto p
      LEFT JOIN proyecto_stats ps ON p.id = ps.id
      LEFT JOIN objetivo o ON p.objetivo_id = o.id
      LEFT JOIN usuario r ON p.responsable_id = r.id
      LEFT JOIN institucion i ON p.institucion_id = i.id
      ORDER BY 
        CASE 
          WHEN p.estado = 'Enviado' THEN 1 
          WHEN p.estado = 'Borrador' THEN 2
          WHEN p.estado = 'Aprobado' THEN 3
          WHEN p.estado = 'Rechazado' THEN 4
          ELSE 5
        END,
        p.updated_at DESC
    `;
    
    const result = await pool.query(query);
    
    // Estadisticas de resumen para el monitoreo
    const statsQuery = `
      SELECT 
        COUNT(*) as total_proyectos,
        COUNT(CASE WHEN estado = 'Borrador' THEN 1 END) as borradores,
        COUNT(CASE WHEN estado = 'Enviado' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'Aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as rechazados
      FROM proyecto
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    const response: ApiResponse<any> = {
      success: true,
      data: {
        proyectos: result.rows,
        estadisticas: statsResult.rows[0]
      },
      message: 'Monitoreo de proyectos obtenido exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al monitorear proyectos:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// ============================================
// ALIAS DE METODOS SEGUN ESPECIFICACIONES
// ============================================

// Metodo: crearProyecto() (alias de createProyecto)
export const crearProyecto = createProyecto;

// Metodo: eliminarProyecto() (alias de deleteProyecto)
export const eliminarProyecto = deleteProyecto;

// Metodo: editarProyecto() (alias de updateProyecto) - opcional segun especificacion
export const editarProyecto = updateProyecto;

// ============================================
// METODOS DE VALIDACION SEGUN ESPECIFICACIONES
// ============================================

// Metodo: validarProyecto() - aprueba o rechaza un proyecto
export const validarProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, comentario } = req.body;

    // Obtener el ID del usuario validador desde el token JWT
    const usuarioValidadorId = (req as any).usuario?.id;

    if (!usuarioValidadorId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario validador no identificado'
      };
      return res.status(401).json(response);
    }

    // Validar que el estado sea valido
    if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Estado de validacion invalido. Debe ser APROBADO o RECHAZADO'
      };
      return res.status(400).json(response);
    }

    console.log('🔹 [VALIDACION] Validando proyecto:', {
      proyectoId: id,
      estado,
      comentario,
      validadorId: usuarioValidadorId
    });

    // Insertar registro de validacion
    const validacionResult = await pool.query(`
      INSERT INTO validacion (entidad_tipo, entidad_id, validador_id, estado, observaciones, fecha_validacion)
      VALUES ('PROYECTO', $1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING id, estado, observaciones, fecha_validacion
    `, [id, usuarioValidadorId, estado, comentario]);

    console.log('✅ [VALIDACION] Registro de validacion insertado:', validacionResult.rows[0]);

    // Actualizar estado del proyecto
    let nuevoEstadoProyecto = estado === 'APROBADO' ? 'Aprobado' : 'Rechazado';
    const proyectoResult = await pool.query(`
      UPDATE proyecto 
      SET estado = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, codigo, nombre, estado
    `, [nuevoEstadoProyecto, id]);

    console.log('✅ [VALIDACION] Estado del proyecto actualizado:', proyectoResult.rows[0]);

    if (proyectoResult.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Proyecto no encontrado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        proyecto: proyectoResult.rows[0],
        validacion: validacionResult.rows[0]
      },
      message: `Proyecto ${estado.toLowerCase()} exitosamente`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ [VALIDACION] Error al validar proyecto:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: agregarComentario() - agrega observaciones de validacion
export const agregarComentario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID del proyecto
    const { comentario, usuarioValidador, tipoValidacion } = req.body;

    if (!comentario || comentario.trim() === '') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El comentario es requerido'
      };
      return res.status(400).json(response);
    }

    const result = await pool.query(`
      INSERT INTO validacion (entidad_tipo, entidad_id, validador_id, tipo_validacion, observaciones, estado, fecha_validacion)
      VALUES ('PROYECTO', $1, $2, $3, $4, 'COMENTARIO', CURRENT_TIMESTAMP)
      RETURNING id, observaciones, fecha_validacion, tipo_validacion
    `, [id, usuarioValidador, tipoValidacion || 'TECNICA', comentario]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Comentario agregado exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: getValidacionesByProyecto() - obtiene las validaciones de un proyecto
export const getValidacionesByProyecto = async (req: Request, res: Response) => {
  try {
    const { proyectoId } = req.params;

    console.log('🔹 [VALIDACIONES] Obteniendo validaciones para proyecto:', proyectoId);

    const result = await pool.query(`
      SELECT 
        v.id,
        v.entidad_tipo as tipo,
        v.estado,
        v.observaciones as comentarios,
        v.fecha_validacion,
        u.nombre || ' ' || u.apellido as validador_nombre,
        u.email as validador_email
      FROM validacion v
      LEFT JOIN usuario u ON v.validador_id = u.id
      WHERE v.entidad_tipo = 'PROYECTO' AND v.entidad_id = $1
      ORDER BY v.fecha_validacion DESC
    `, [proyectoId]);

    console.log('✅ [VALIDACIONES] Validaciones encontradas:', result.rows.length);

    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows,
      message: 'Validaciones obtenidas exitosamente'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ [VALIDACIONES] Error al obtener validaciones:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};
