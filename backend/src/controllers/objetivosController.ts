import { Request, Response } from 'express';
import pool from '../database/connection';
import { ApiResponse, CreateObjetivoDTO, ObjetivoFilter } from '../models';

// ============================================
// HELPERS PARA AUDITORIA Y TRAZABILIDAD
// ============================================

interface AuthenticatedRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    roles: string[];
  };
}

// Funcion para registrar auditoria
const registrarAuditoria = async (
  accion: string,
  tabla: string,
  registro_id: number | string,
  usuario_id: number,
  datos_anteriores: any = null,
  datos_nuevos: any = null,
  req: Request
) => {
  try {
    await pool.query(`
      INSERT INTO auditoria (
        accion, tabla, registro_id, usuario_id, fecha_accion,
        datos_anteriores, datos_nuevos, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
    `, [
      accion,
      tabla,
      registro_id,
      usuario_id,
      JSON.stringify(datos_anteriores),
      JSON.stringify(datos_nuevos),
      req.ip,
      req.get('User-Agent')
    ]);
  } catch (error) {
    console.error('Error al registrar auditoria:', error);
  }
};

// ============================================
// MODULO 2: GESTION DE OBJETIVOS ESTRATEGICOS
// ============================================

// ============================================
// METODOS ESPECIFICOS SEGUN ESPECIFICACIONES
// ============================================

// Metodo: crearObjetivo() (alias de createObjetivo)
// Se definira al final del archivo

// Metodo: editarObjetivo() (alias de updateObjetivo)  
// Se definira al final del archivo

// Metodo: consultarPND()
export const consultarPND = async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DEBUG] Consultando PND - iniciando consulta...');
    
    const result = await pool.query(`
      SELECT id, idpnd as "idPND", nombre, descripcion, 
             periodo_inicio, periodo_fin, estado 
      FROM pnd 
      WHERE estado = true 
      ORDER BY nombre
    `);
    
    console.log('🔍 [DEBUG] PND Query resultado:', {
      rowCount: result.rowCount,
      rows: result.rows
    });
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    console.log('🔍 [DEBUG] PND Response enviado:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ [ERROR] Error en consultarPND:', error);
    console.error('❌ [ERROR] Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: consultarODS() (alias de getODS)
export const consultarODS = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, idods, numero, objetivo as nombre, descripcion as titulo, descripcion 
      FROM ods 
      ORDER BY idods
    `);
    
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

// Metodo: registrarMeta()
export const registrarMeta = async (req: Request, res: Response) => {
  try {
    const { descripcion, estado, valor_meta, unidad_medida, periodicidad, objetivo_id, responsable_id } = req.body;

    const result = await pool.query(`
      INSERT INTO meta (descripcion, estado, valor_meta, unidad_medida, periodicidad, objetivo_id, responsable_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, descripcion, estado, valor_meta, unidad_medida, periodicidad, created_at
    `, [descripcion, estado, valor_meta, unidad_medida, periodicidad, objetivo_id, responsable_id]);

    // ✅ REGISTRAR AUDITORIA - REGISTRAR META
    const authReq = req as AuthenticatedRequest;
    const usuarioId = authReq.usuario?.id;
    if (usuarioId) {
      await registrarAuditoria(
        'CREAR',
        'meta',
        result.rows[0].id,
        usuarioId,
        null,
        result.rows[0],
        req
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Meta registrada exitosamente'
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

// Metodo: agregarIndicador()
export const agregarIndicador = async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DEBUG] Creando indicador:', req.body);
    
    const { 
      idIndicador, 
      codigo, 
      nombre, 
      descripcion, 
      formula, 
      tipo, 
      unidadMedida, 
      frecuencia_medicion, 
      meta_id, 
      responsable_id 
    } = req.body;

    // Validaciones basicas
    if (!idIndicador || !codigo || !nombre || !meta_id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Los campos idIndicador, codigo, nombre y meta_id son obligatorios'
      };
      return res.status(400).json(response);
    }

    // Verificar que la meta existe
    const metaCheck = await pool.query('SELECT id FROM meta WHERE id = $1', [meta_id]);
    if (metaCheck.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'La meta especificada no existe'
      };
      return res.status(400).json(response);
    }

    const result = await pool.query(`
      INSERT INTO indicador (
        idIndicador, codigo, nombre, descripcion, formula, tipo, 
        unidadMedida, frecuencia_medicion, meta_id, responsable_id, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVO')
      RETURNING 
        id, idIndicador, codigo, nombre, descripcion, formula, tipo,
        unidadMedida, frecuencia_medicion, estado, created_at, responsable_id
    `, [
      idIndicador, 
      codigo, 
      nombre, 
      descripcion, 
      formula || null, 
      tipo || 'CUANTITATIVO', 
      unidadMedida, 
      frecuencia_medicion || 'TRIMESTRAL', 
      meta_id, 
      responsable_id || null
    ]);

    // Obtener el nombre del responsable por separado si existe
    let responsable_nombre = null;
    if (result.rows[0].responsable_id) {
      const responsableResult = await pool.query(
        'SELECT nombre FROM usuario WHERE id = $1', 
        [result.rows[0].responsable_id]
      );
      responsable_nombre = responsableResult.rows[0]?.nombre || null;
    }

    // Agregar el nombre del responsable al resultado
    const indicadorCompleto = {
      ...result.rows[0],
      responsable_nombre
    };

    console.log('✅ [SUCCESS] Indicador creado:', indicadorCompleto);

    const response: ApiResponse<any> = {
      success: true,
      data: indicadorCompleto,
      message: 'Indicador agregado exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ [ERROR] Error al crear indicador:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error && error.message.includes('duplicate') 
        ? 'Ya existe un indicador con ese codigo o ID'
        : 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metodo: editarIndicador()
export const editarIndicador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { idIndicador, nombre, unidadMedida, descripcion, formula, tipo } = req.body;

    const result = await pool.query(`
      UPDATE indicador 
      SET idIndicador = $1, nombre = $2, unidadMedida = $3, descripcion = $4, 
          formula = $5, tipo = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND estado = 'ACTIVO'
      RETURNING id, idIndicador, nombre, unidadMedida, descripcion, formula, tipo, updated_at
    `, [idIndicador, nombre, unidadMedida, descripcion, formula, tipo, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Indicador no encontrado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Indicador editado exitosamente'
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

// Metodo: validarObjetivo()
export const validarObjetivo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comentarios, estado, usuarioValida } = req.body;

    // Insertar validacion
    const validacionResult = await pool.query(`
      INSERT INTO validacion (entidad_tipo, entidad_id, validador_id, tipo_validacion, estado, observaciones, fecha_validacion)
      VALUES ('OBJETIVO', $1, $2, 'TECNICA', $3, $4, CURRENT_TIMESTAMP)
      RETURNING id, observaciones as comentarios, estado, fecha_validacion as fecha
    `, [id, usuarioValida, estado, comentarios]);

    // Actualizar estado del objetivo si esta aprobado
    if (estado === 'APROBADO') {
      await pool.query(`
        UPDATE objetivo 
        SET estado = 'APROBADO', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
    } else if (estado === 'RECHAZADO') {
      await pool.query(`
        UPDATE objetivo 
        SET estado = 'RECHAZADO', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
    }

    // ✅ REGISTRAR AUDITORIA - VALIDAR OBJETIVO
    const authReq = req as AuthenticatedRequest;
    const usuarioId = authReq.usuario?.id;
    if (usuarioId) {
      await registrarAuditoria(
        'VALIDAR',
        'objetivo',
        id,
        usuarioId,
        { estado_anterior: 'EN_VALIDACION' },
        { 
          estado_nuevo: estado, 
          comentarios, 
          validador_id: usuarioValida 
        },
        req
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: validacionResult.rows[0],
      message: `Objetivo ${estado.toLowerCase()} exitosamente`
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

// ODS (Objetivos de Desarrollo Sostenible)
export const getODS = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, idods, numero, objetivo as nombre, descripcion as titulo, descripcion 
      FROM ods 
      ORDER BY numero
    `);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener ODS:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Objetivos
export const getObjetivos = async (req: Request, res: Response) => {
  try {
    const { 
      tipo, 
      estado, 
      plan_institucional_id, 
      responsable_id, 
      ods_id 
    } = req.query as ObjetivoFilter;
    
    let whereConditions = ['1=1'];
    let params: any[] = [];
    let paramCount = 0;

    if (tipo) {
      paramCount++;
      whereConditions.push(`o.tipo = $${paramCount}`);
      params.push(tipo);
    }

    if (estado) {
      paramCount++;
      whereConditions.push(`o.estado = $${paramCount}`);
      params.push(estado);
    }

    if (plan_institucional_id) {
      paramCount++;
      whereConditions.push(`o.plan_institucional_id = $${paramCount}`);
      params.push(plan_institucional_id);
    }

    if (responsable_id) {
      paramCount++;
      whereConditions.push(`o.responsable_id = $${paramCount}`);
      params.push(responsable_id);
    }

    if (ods_id) {
      paramCount++;
      whereConditions.push(`o.ods_id = $${paramCount}`);
      params.push(ods_id);
    }

    const query = `
      SELECT o.id, o.codigo, o.descripcion as nombre, o.descripcion, o.tipo, o.prioridad,
             o.estado, o.porcentaje_avance, o.fecha_inicio, o.fecha_fin, 
             o.presupuesto_asignado as presupuesto, o.created_at, o.updated_at,
             op.descripcion as objetivo_padre_nombre,
             p.nombre as plan_nombre,
             ods.objetivo as ods_nombre, ods.descripcion as ods_titulo,
             u.nombre as responsable_nombre,
             COUNT(m.id) as total_metas
      FROM objetivo o
      LEFT JOIN objetivo op ON o.objetivo_padre_id = op.id
      LEFT JOIN plan_institucional p ON o.plan_institucional_id = p.id
      LEFT JOIN ods ON o.ods_id = ods.id
      LEFT JOIN usuario u ON o.responsable_id = u.id
      LEFT JOIN meta m ON o.id = m.objetivo_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY o.id, op.descripcion, p.nombre, ods.objetivo, ods.descripcion, u.nombre
      ORDER BY o.created_at
    `;
    
    const result = await pool.query(query, params);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener objetivos:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const getObjetivoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT o.id, o.codigo, o.descripcion as nombre, o.descripcion, o.tipo, o.prioridad,
             o.objetivo_padre_id, o.plan_institucional_id, o.ods_id, o.responsable_id,
             o.estado, o.porcentaje_avance, o.fecha_inicio, o.fecha_fin, 
             o.presupuesto_asignado as presupuesto, o.created_at, o.updated_at,
             op.descripcion as objetivo_padre_nombre,
             p.nombre as plan_nombre,
             ods.objetivo as ods_nombre, ods.descripcion as ods_titulo, ods.idods as ods_idODS, ods.numero as ods_numero,
             u.nombre as responsable_nombre, u.email as responsable_email
      FROM objetivo o
      LEFT JOIN objetivo op ON o.objetivo_padre_id = op.id
      LEFT JOIN plan_institucional p ON o.plan_institucional_id = p.id
      LEFT JOIN ods ON o.ods_id = ods.id
      LEFT JOIN usuario u ON o.responsable_id = u.id
      WHERE o.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Objetivo no encontrado'
      };
      return res.status(404).json(response);
    }

    // Obtener metas del objetivo
    const metasResult = await pool.query(`
      SELECT m.id, m.codigo, m.descripcion, m.valor_inicial, m.valor_meta, 
             m.valor_actual, m.unidad_medida, m.periodicidad, m.estado,
             u.nombre as responsable_nombre,
             COUNT(i.id) as total_indicadores
      FROM meta m
      LEFT JOIN usuario u ON m.responsable_id = u.id
      LEFT JOIN indicador i ON m.id = i.meta_id
      WHERE m.objetivo_id = $1
      GROUP BY m.id, u.nombre
      ORDER BY m.created_at
    `, [id]);

    const objetivo = {
      ...result.rows[0],
      metas: metasResult.rows
    };

    const response: ApiResponse<any> = {
      success: true,
      data: objetivo
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener objetivo:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const createObjetivo = async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DEBUG] === INICIO CREAR OBJETIVO ===');
    console.log('🔍 [DEBUG] Received request to create objective');
    console.log('🔍 [DEBUG] Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 [DEBUG] Request usuario:', (req as any).usuario);
    
    const data: CreateObjetivoDTO = req.body;
    
    console.log('🔍 [DEBUG] Datos parseados:', JSON.stringify(data, null, 2));
    
    // Validaciones basicas
    if (!data.codigo || !data.nombre || !data.tipo) {
      console.log('❌ [ERROR] Missing required fields:', { codigo: data.codigo, nombre: data.nombre, tipo: data.tipo });
      const response: ApiResponse<null> = {
        success: false,
        error: 'Codigo, nombre y tipo son obligatorios'
      };
      return res.status(400).json(response);
    }

    console.log('🔍 [DEBUG] Validaciones basicas pasadas');

    // Verificar si el codigo ya existe
    const existingObj = await pool.query(
      'SELECT id FROM objetivo WHERE codigo = $1',
      [data.codigo]
    );

    console.log('🔍 [DEBUG] Verificacion de codigo existente:', existingObj.rows);

    if (existingObj.rows.length > 0) {
      console.log('❌ [ERROR] Codigo ya existe:', data.codigo);
      const response: ApiResponse<null> = {
        success: false,
        error: 'El codigo de objetivo ya existe'
      };
      return res.status(409).json(response);
    }

    console.log('🔍 [DEBUG] Codigo unico confirmado');

    // Si no se proporciona plan_institucional_id, crear o usar uno por defecto
    let planInstitucionalId = data.plan_institucional_id;
    
    if (!planInstitucionalId) {
      console.log('🔍 [DEBUG] No plan institucional proporcionado, buscando plan por defecto...');
      
      // Buscar si existe un plan institucional por defecto
      const existingPlan = await pool.query(
        'SELECT id FROM plan_institucional ORDER BY id LIMIT 1'
      );
      
      console.log('🔍 [DEBUG] Planes institucionales encontrados:', existingPlan.rows);
      
      if (existingPlan.rows.length > 0) {
        planInstitucionalId = existingPlan.rows[0].id;
        console.log('🔍 [DEBUG] Usando plan institucional existente:', planInstitucionalId);
      } else {
        // Asegurar que existe al menos una institucion
        let institucionId = 1;
        const existingInst = await pool.query('SELECT id FROM institucion ORDER BY id LIMIT 1');
        console.log('🔍 [DEBUG] Instituciones encontradas:', existingInst.rows);
        
        if (existingInst.rows.length === 0) {
          console.log('🔍 [DEBUG] Creando institucion por defecto...');
          const newInst = await pool.query(`
            INSERT INTO institucion (codigo, nombre, sigla, tipo, jerarquia, estado)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `, ['INST-001', 'Institucion General', 'IG', 'PUBLICA', 1, true]);
          institucionId = newInst.rows[0].id;
          console.log('🔍 [DEBUG] Institucion creada con ID:', institucionId);
        } else {
          institucionId = existingInst.rows[0].id;
          console.log('🔍 [DEBUG] Usando institucion existente ID:', institucionId);
        }
        
        // Crear un plan institucional por defecto
        console.log('🔍 [DEBUG] Creando plan institucional por defecto...');
        const newPlan = await pool.query(`
          INSERT INTO plan_institucional (nombre, descripcion, institucion_id, periodo_inicio, periodo_fin)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          'Plan Institucional General',
          'Plan institucional creado automaticamente para gestion de objetivos',
          institucionId,
          new Date().toISOString().split('T')[0], // Fecha actual
          new Date(new Date().getFullYear() + 4, 11, 31).toISOString().split('T')[0] // 4 anos despues
        ]);
        
        planInstitucionalId = newPlan.rows[0].id;
        console.log('🔍 [DEBUG] Plan institucional creado con ID:', planInstitucionalId);
      }
    }

    console.log('🔍 [DEBUG] Inserting objective with data:', {
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: data.tipo,
      nivel: data.nivel || 1,
      area_responsable: data.area_responsable,
      prioridad: data.prioridad || 'MEDIA',
      plan_institucional_id: planInstitucionalId,
      pnd_id: data.pnd_id,
      ods_id: data.ods_id,
      responsable_id: data.responsable_id,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      presupuesto: data.presupuesto
    });

    const result = await pool.query(`
      INSERT INTO objetivo (codigo, descripcion, tipo, prioridad,
                           objetivo_padre_id, plan_institucional_id, pnd_id, ods_id, responsable_id, 
                           fecha_inicio, fecha_fin, presupuesto_asignado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, codigo, descripcion, tipo, prioridad,
                estado, porcentaje_avance, fecha_inicio, fecha_fin, presupuesto_asignado, created_at, updated_at
    `, [
      data.codigo, 
      data.descripcion || data.nombre, // Usar descripcion en lugar de nombre
      data.tipo, 
      data.prioridad || 'MEDIA',
      data.objetivo_padre_id, 
      planInstitucionalId, 
      data.pnd_id, 
      data.ods_id, 
      data.responsable_id, 
      data.fecha_inicio, 
      data.fecha_fin, 
      data.presupuesto
    ]);

    console.log('🔍 [DEBUG] Objetivo creado exitosamente:', result.rows[0]);

    // ✅ REGISTRAR AUDITORIA - CREAR OBJETIVO
    const authReq = req as AuthenticatedRequest;
    const usuarioId = authReq.usuario?.id;
    if (usuarioId) {
      console.log('🔍 [DEBUG] Registrando auditoria para usuario ID:', usuarioId);
      await registrarAuditoria(
        'CREAR',
        'objetivo',
        result.rows[0].id,
        usuarioId,
        null,
        result.rows[0],
        req
      );
      console.log('🔍 [DEBUG] Auditoria registrada');
    } else {
      console.log('⚠️ [WARNING] No se registrara auditoria - usuario no identificado');
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Objetivo creado exitosamente'
    };
    
    console.log('🔍 [DEBUG] Enviando respuesta exitosa:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ [ERROR] Error al crear objetivo:', error);
    console.error('❌ [ERROR] Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    console.error('❌ [ERROR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Metas
export const getMetasByObjetivo = async (req: Request, res: Response) => {
  try {
    const { objetivoId } = req.params;
    
    const result = await pool.query(`
      SELECT m.id, m.codigo, m.descripcion, m.valor_inicial, m.valor_meta, 
             m.valor_actual, m.unidad_medida, m.periodicidad, m.estado,
             m.created_at, m.updated_at,
             u.nombre as responsable_nombre,
             COUNT(i.id) as total_indicadores
      FROM meta m
      LEFT JOIN usuario u ON m.responsable_id = u.id
      LEFT JOIN indicador i ON m.id = i.meta_id
      WHERE m.objetivo_id = $1
      GROUP BY m.id, u.nombre
      ORDER BY m.created_at
    `, [objetivoId]);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener metas:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

export const createMeta = async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DEBUG] createMeta - Iniciando...');
    console.log('🔍 [DEBUG] Params:', req.params);
    console.log('🔍 [DEBUG] Body:', req.body);
    console.log('🔍 [DEBUG] Usuario:', (req as any).usuario);
    
    const { objetivoId } = req.params;
    const { codigo, descripcion, valor_inicial, valor_meta, unidad_medida, periodicidad, responsable_id } = req.body;
    
    console.log('🔍 [DEBUG] Datos extraidos:', {
      objetivoId,
      codigo,
      descripcion,
      valor_inicial,
      valor_meta,
      unidad_medida,
      periodicidad,
      responsable_id
    });
    
    if (!codigo || !descripcion || !valor_meta) {
      console.log('❌ [ERROR] Campos obligatorios faltantes');
      const response: ApiResponse<null> = {
        success: false,
        error: 'Codigo, descripcion y valor meta son obligatorios'
      };
      return res.status(400).json(response);
    }

    console.log('🔍 [DEBUG] Verificando que el objetivo existe...');
    const objetivoExists = await pool.query('SELECT id FROM objetivo WHERE id = $1', [objetivoId]);
    if (objetivoExists.rows.length === 0) {
      console.log('❌ [ERROR] Objetivo no encontrado:', objetivoId);
      const response: ApiResponse<null> = {
        success: false,
        error: `Objetivo con ID ${objetivoId} no encontrado`
      };
      return res.status(404).json(response);
    }

    console.log('🔍 [DEBUG] Ejecutando query...');
    const result = await pool.query(`
      INSERT INTO meta (codigo, descripcion, valor_inicial, valor_meta, unidad_medida, 
                       periodicidad, objetivo_id, responsable_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, codigo, descripcion, valor_inicial, valor_meta, valor_actual, 
                unidad_medida, periodicidad, estado, created_at, updated_at
    `, [codigo, descripcion, valor_inicial, valor_meta, unidad_medida, periodicidad, objetivoId, responsable_id]);

    console.log('🔍 [DEBUG] Query ejecutada exitosamente:', result.rows[0]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Meta creada exitosamente'
    };
    
    console.log('🔍 [DEBUG] Enviando respuesta:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ [ERROR] Error al crear meta:', error);
    console.error('❌ [ERROR] Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Funcion para actualizar una meta completa
export const updateMeta = async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DEBUG] updateMeta - Iniciando...');
    console.log('🔍 [DEBUG] Params:', req.params);
    console.log('🔍 [DEBUG] Body:', req.body);
    
    const { metaId } = req.params;
    const { codigo, descripcion, valor_inicial, valor_meta, unidad_medida, periodicidad, estado } = req.body;
    
    console.log('🔍 [DEBUG] Datos extraidos:', {
      metaId,
      codigo,
      descripcion,
      valor_inicial,
      valor_meta,
      unidad_medida,
      periodicidad,
      estado
    });
    
    if (!codigo || !descripcion || !valor_meta) {
      console.log('❌ [ERROR] Campos obligatorios faltantes para actualizar meta');
      const response: ApiResponse<null> = {
        success: false,
        error: 'Codigo, descripcion y valor meta son obligatorios'
      };
      return res.status(400).json(response);
    }

    // Verificar que la meta existe
    console.log('🔍 [DEBUG] Verificando que la meta existe...');
    const metaExists = await pool.query('SELECT id FROM meta WHERE id = $1', [metaId]);
    if (metaExists.rows.length === 0) {
      console.log('❌ [ERROR] Meta no encontrada:', metaId);
      const response: ApiResponse<null> = {
        success: false,
        error: `Meta con ID ${metaId} no encontrada`
      };
      return res.status(404).json(response);
    }

    // Verificar que no haya otro codigo igual (excepto la misma meta)
    const existingMeta = await pool.query(
      'SELECT id FROM meta WHERE codigo = $1 AND id != $2',
      [codigo, metaId]
    );

    if (existingMeta.rows.length > 0) {
      console.log('❌ [ERROR] Codigo de meta ya existe:', codigo);
      const response: ApiResponse<null> = {
        success: false,
        error: 'El codigo de meta ya existe'
      };
      return res.status(409).json(response);
    }

    console.log('🔍 [DEBUG] Ejecutando query de actualizacion...');
    const result = await pool.query(`
      UPDATE meta 
      SET codigo = $1, descripcion = $2, valor_inicial = $3, valor_meta = $4, 
          unidad_medida = $5, periodicidad = $6, estado = COALESCE($7, estado),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, codigo, descripcion, valor_inicial, valor_meta, valor_actual, 
                unidad_medida, periodicidad, estado, created_at, updated_at
    `, [codigo, descripcion, valor_inicial, valor_meta, unidad_medida, periodicidad, estado, metaId]);

    console.log('🔍 [DEBUG] Meta actualizada exitosamente:', result.rows[0]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Meta actualizada exitosamente'
    };
    
    console.log('🔍 [DEBUG] Enviando respuesta:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ [ERROR] Error al actualizar meta:', error);
    console.error('❌ [ERROR] Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Funcion para actualizar solo el valor actual de una meta
export const updateMetaValue = async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DEBUG] updateMetaValue - Iniciando...');
    console.log('🔍 [DEBUG] Params:', req.params);
    console.log('🔍 [DEBUG] Body:', req.body);
    
    const { metaId } = req.params;
    const { valor_actual } = req.body;
    
    console.log('🔍 [DEBUG] Datos extraidos:', {
      metaId,
      valor_actual
    });
    
    if (valor_actual === undefined || valor_actual === null) {
      console.log('❌ [ERROR] Valor actual es obligatorio');
      const response: ApiResponse<null> = {
        success: false,
        error: 'El valor actual es obligatorio'
      };
      return res.status(400).json(response);
    }

    if (isNaN(Number(valor_actual))) {
      console.log('❌ [ERROR] Valor actual debe ser un numero');
      const response: ApiResponse<null> = {
        success: false,
        error: 'El valor actual debe ser un numero valido'
      };
      return res.status(400).json(response);
    }

    // Verificar que la meta existe
    console.log('🔍 [DEBUG] Verificando que la meta existe...');
    const metaExists = await pool.query('SELECT id, valor_meta FROM meta WHERE id = $1', [metaId]);
    if (metaExists.rows.length === 0) {
      console.log('❌ [ERROR] Meta no encontrada:', metaId);
      const response: ApiResponse<null> = {
        success: false,
        error: `Meta con ID ${metaId} no encontrada`
      };
      return res.status(404).json(response);
    }

    const valorMeta = metaExists.rows[0].valor_meta;

    // Determinar el nuevo estado basado en el progreso
    let nuevoEstado = 'ACTIVA';
    if (Number(valor_actual) >= valorMeta) {
      nuevoEstado = 'COMPLETADA';
    } else if (Number(valor_actual) > 0) {
      nuevoEstado = 'ACTIVA';
    } else {
      nuevoEstado = 'BORRADOR';
    }

    console.log('🔍 [DEBUG] Ejecutando query de actualizacion de valor...');
    const result = await pool.query(`
      UPDATE meta 
      SET valor_actual = $1, estado = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, codigo, descripcion, valor_inicial, valor_meta, valor_actual, 
                unidad_medida, periodicidad, estado, created_at, updated_at
    `, [valor_actual, nuevoEstado, metaId]);

    console.log('🔍 [DEBUG] Valor de meta actualizado exitosamente:', result.rows[0]);

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Valor de meta actualizado exitosamente'
    };
    
    console.log('🔍 [DEBUG] Enviando respuesta:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ [ERROR] Error al actualizar valor de meta:', error);
    console.error('❌ [ERROR] Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Funciones adicionales para objetivos
export const updateObjetivo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Verificar si existe otro codigo igual
    const existingObj = await pool.query(
      'SELECT id FROM objetivo WHERE codigo = $1 AND id != $2',
      [data.codigo, id]
    );

    if (existingObj.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'El codigo de objetivo ya existe'
      };
      return res.status(409).json(response);
    }

    const result = await pool.query(`
      UPDATE objetivo 
      SET codigo = $1, nombre = $2, descripcion = $3, tipo = $4, nivel = $5,
          area_responsable = $6, prioridad = $7, objetivo_padre_id = $8, 
          plan_institucional_id = $9, pnd_id = $10, ods_id = $11,
          responsable_id = $12, fecha_inicio = $13, fecha_fin = $14, 
          presupuesto = $15, updated_at = CURRENT_TIMESTAMP
      WHERE id = $16 AND estado != 'INACTIVO'
      RETURNING *
    `, [
      data.codigo, data.nombre, data.descripcion, data.tipo, data.nivel,
      data.area_responsable, data.prioridad, data.objetivo_padre_id || null, 
      data.plan_institucional_id, data.pnd_id || null, data.ods_id || null,
      data.responsable_id, data.fecha_inicio, data.fecha_fin, 
      data.presupuesto || null, id
    ]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Objetivo no encontrado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Objetivo actualizado exitosamente'
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

export const deleteObjetivo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que no tenga objetivos hijos
    const childrenCheck = await pool.query(
      'SELECT id FROM objetivo WHERE objetivo_padre_id = $1 AND estado = $2',
      [id, 'ACTIVO']
    );

    if (childrenCheck.rows.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No se puede eliminar un objetivo que tiene objetivos hijos'
      };
      return res.status(400).json(response);
    }

    const result = await pool.query(`
      UPDATE objetivo 
      SET estado = 'INACTIVO', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado = 'ACTIVO'
      RETURNING id, codigo, nombre
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Objetivo no encontrado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Objetivo desactivado exitosamente'
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

export const enviarAValidacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE objetivo 
      SET estado = 'EN_VALIDACION', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado = 'BORRADOR'
      RETURNING id, codigo, nombre, estado
    `, [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Objetivo no encontrado o no esta en borrador'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Objetivo enviado a validacion exitosamente'
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

export const aprobarObjetivo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const result = await pool.query(`
      UPDATE objetivo 
      SET estado = 'APROBADO', observaciones = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado = 'EN_VALIDACION'
      RETURNING id, codigo, nombre, estado
    `, [observaciones || null, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Objetivo no encontrado o no esta en validacion'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Objetivo aprobado exitosamente'
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

export const rechazarObjetivo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    if (!observaciones || observaciones.trim() === '') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Las observaciones son requeridas para rechazar un objetivo'
      };
      return res.status(400).json(response);
    }

    const result = await pool.query(`
      UPDATE objetivo 
      SET estado = 'RECHAZADO', observaciones = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado = 'EN_VALIDACION'
      RETURNING id, codigo, nombre, estado
    `, [observaciones, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Objetivo no encontrado o no esta en validacion'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Objetivo rechazado exitosamente'
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

// Indicadores
export const getIndicadoresByMeta = async (req: Request, res: Response) => {
  try {
    const { metaId } = req.params;
    
    const result = await pool.query(`
      SELECT i.id, i.idIndicador, i.codigo, i.nombre, i.descripcion, i.formula, i.tipo,
             i.unidadMedida, i.frecuencia_medicion, i.estado,
             i.created_at, i.updated_at,
             u.nombre as responsable_nombre
      FROM indicador i
      LEFT JOIN usuario u ON i.responsable_id = u.id
      WHERE i.meta_id = $1
      ORDER BY i.created_at
    `, [metaId]);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener indicadores:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Alias para compatibilidad con especificaciones
export const crearObjetivo = createObjetivo;
export const editarObjetivo = updateObjetivo;

// Metodo: asociarPNDyODS()
export const asociarPNDyODS = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pnd_id, ods_id } = req.body;

    const result = await pool.query(`
      UPDATE objetivo 
      SET pnd_id = $1, ods_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND estado != 'INACTIVO'
      RETURNING id, codigo, nombre, pnd_id, ods_id
    `, [pnd_id || null, ods_id || null, id]);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Objetivo no encontrado'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: 'Alineacion PND/ODS actualizada exitosamente'
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

// Metodo: filtrarObjetivosPorEstado()
export const filtrarObjetivosPorEstado = async (req: Request, res: Response) => {
  try {
    const { 
      estado,
      area_responsable,
      nivel_alineacion,
      responsable_id,
      pnd_id,
      ods_id,
      tipo
    } = req.query;
    
    let whereConditions = ['o.estado != $1'];
    let params: any[] = ['INACTIVO'];
    let paramCount = 1;

    if (estado) {
      paramCount++;
      whereConditions.push(`o.estado = $${paramCount}`);
      params.push(estado);
    }

    if (area_responsable) {
      paramCount++;
      whereConditions.push(`o.area_responsable ILIKE $${paramCount}`);
      params.push(`%${area_responsable}%`);
    }

    if (responsable_id) {
      paramCount++;
      whereConditions.push(`o.responsable_id = $${paramCount}`);
      params.push(responsable_id);
    }

    if (pnd_id) {
      paramCount++;
      whereConditions.push(`o.pnd_id = $${paramCount}`);
      params.push(pnd_id);
    }

    if (ods_id) {
      paramCount++;
      whereConditions.push(`o.ods_id = $${paramCount}`);
      params.push(ods_id);
    }

    if (tipo) {
      paramCount++;
      whereConditions.push(`o.tipo = $${paramCount}`);
      params.push(tipo);
    }

    const query = `
      SELECT o.id, o.codigo, o.descripcion as nombre, o.descripcion, o.tipo, o.prioridad,
             o.area_responsable, o.prioridad, o.estado, o.porcentaje_avance, 
             o.fecha_inicio, o.fecha_fin, o.presupuesto_asignado as presupuesto, o.created_at, o.updated_at,
             o.observaciones,
             pnd.nombre as pnd_nombre, pnd.numero as pnd_numero,
             ods.objetivo as ods_nombre, ods.numero as ods_numero,
             u.nombre as responsable_nombre, u.email as responsable_email,
             COUNT(m.id) as total_metas,
             COUNT(CASE WHEN m.estado = 'COMPLETADA' THEN 1 END) as metas_completadas
      FROM objetivo o
      LEFT JOIN pnd ON o.pnd_id = pnd.id
      LEFT JOIN ods ON o.ods_id = ods.id
      LEFT JOIN usuario u ON o.responsable_id = u.id
      LEFT JOIN meta m ON o.id = m.objetivo_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY o.id, pnd.nombre, pnd.numero, ods.objetivo, ods.numero, u.nombre, u.email
      ORDER BY o.prioridad DESC, o.created_at DESC
    `;
    
    const result = await pool.query(query, params);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows,
      message: `${result.rows.length} objetivos encontrados`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al filtrar objetivos:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};
