// ================================================================
// CONTROLADOR DE REPORTES - MÓDULO 4
// Gestión de consultas, generación y exportación de reportes
// Implementa la matriz de permisos según documentación
// ================================================================

import * as ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import pool from '../database/connection';
import { PERMISOS, tienePermiso } from '../middleware/rolePermissions';
import logger from '../utils/logger';

interface ReporteObjetivo {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado';
  area: string;
  prioridad: 'alta' | 'media' | 'baja';
  alineacion_pnd: string;
  alineacion_ods: string;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  responsable: string;
  validado_por?: string;
  fecha_validacion?: Date;
}

interface ReporteProyecto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'registrado' | 'en_revision' | 'aprobado' | 'rechazado';
  fecha_inicio: Date;
  fecha_fin: Date;
  responsable: string;
  presupuesto_asignado: number;
  presupuesto_ejecutado: number;
  porcentaje_avance: number;
  institucion: string;
  validado_por?: string;
  fecha_validacion?: Date;
}

interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  responsable?: string;
  area?: string;
  institucion?: string;
  tipo?: string;
  año?: string;
}

export class ReportesController {
  /**
   * ACCIÓN 1: Consultar reportes
   * Ver listados con datos de objetivos, proyectos, metas, indicadores, presupuestos
   * Accesible por: Todos los roles habilitados
   */
  static async consultarReportes(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;

      // Verificar permisos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.CONSULTAR_REPORTES)) {
        logger.warn('Acceso denegado a consultar reportes', { 
          usuario: usuario.id, 
          roles: usuario.roles 
        });
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para consultar reportes'
        });
      }

      const reportesDisponibles: any = {
        objetivos: tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS),
        proyectos: tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS),
        presupuestario: tienePermiso(usuario.roles, PERMISOS.REPORTES.VISUALIZAR_RESUMEN_PRESUPUESTARIO),
        comparativo: tienePermiso(usuario.roles, PERMISOS.REPORTES.REPORTE_DINAMICO_COMPARATIVO)
      };

      // Obtener estadísticas básicas
      const estadisticas: any = {};

      if (reportesDisponibles.objetivos) {
        const queryObjetivos = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN o.estado = 'Borrador' THEN 1 END) as borrador,
            COUNT(CASE WHEN o.estado = 'Enviado' THEN 1 END) as enviado,
            COUNT(CASE WHEN o.estado = 'Validado' THEN 1 END) as validado,
            COUNT(CASE WHEN o.estado = 'Rechazado' THEN 1 END) as rechazado
          FROM objetivo o
          LEFT JOIN usuario u ON o.responsable_id = u.id
          WHERE 1=1
          ${!usuario.roles.includes('ADMIN') && 
            !usuario.roles.includes('PLANIF') && 
            !usuario.roles.includes('TECNICO') &&
            !usuario.roles.includes('AUDITOR') 
            ? 'AND u.institucion_id = $1' : ''}
        `;
        
        const parametros = !usuario.roles.includes('ADMIN') && 
                           !usuario.roles.includes('PLANIF') && 
                           !usuario.roles.includes('TECNICO') &&
                           !usuario.roles.includes('AUDITOR') 
          ? [usuario.institucion_id] : [];
          
        const resultObjetivos = await pool.query(queryObjetivos, parametros);
        const objResult = resultObjetivos.rows[0];
        
        estadisticas.objetivos = {
          total: parseInt(objResult.total),
          por_estado: {
            borrador: parseInt(objResult.borrador),
            enviado: parseInt(objResult.enviado),
            validado: parseInt(objResult.validado),
            rechazado: parseInt(objResult.rechazado)
          },
          por_institucion: {},
          alineacion_pnd: {},
          alineacion_ods: {},
          validados: parseInt(objResult.validado)
        };
      }

      if (reportesDisponibles.proyectos) {
        const queryProyectos = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN p.estado = 'Borrador' THEN 1 END) as borrador,
            COUNT(CASE WHEN p.estado = 'Pendiente' THEN 1 END) as pendiente,
            COUNT(CASE WHEN p.estado = 'Aprobado' THEN 1 END) as aprobado,
            COUNT(CASE WHEN p.estado = 'Rechazado' THEN 1 END) as rechazado,
            COALESCE(SUM(p.presupuesto_total), 0) as presupuesto_total,
            COALESCE(SUM(p.presupuesto_ejecutado), 0) as presupuesto_ejecutado
          FROM proyecto p
          LEFT JOIN usuario u ON p.responsable_id = u.id
          WHERE 1=1
          ${!usuario.roles.includes('ADMIN') && 
            !usuario.roles.includes('PLANIF') && 
            !usuario.roles.includes('TECNICO') &&
            !usuario.roles.includes('AUDITOR') 
            ? 'AND u.institucion_id = $1' : ''}
        `;
        
        const parametros = !usuario.roles.includes('ADMIN') && 
                           !usuario.roles.includes('PLANIF') && 
                           !usuario.roles.includes('TECNICO') &&
                           !usuario.roles.includes('AUDITOR') 
          ? [usuario.institucion_id] : [];
          
        const resultProyectos = await pool.query(queryProyectos, parametros);
        const projResult = resultProyectos.rows[0];
        
        estadisticas.proyectos = {
          total: parseInt(projResult.total),
          por_estado: {
            borrador: parseInt(projResult.borrador),
            pendiente: parseInt(projResult.pendiente),
            aprobado: parseInt(projResult.aprobado),
            rechazado: parseInt(projResult.rechazado)
          },
          monto_total_asignado: parseFloat(projResult.presupuesto_total),
          presupuesto_por_ano: {},
          presupuesto_por_tipo: {},
          validados: parseInt(projResult.aprobado)
        };
      }

      // Agregar estadísticas comparativas básicas
      estadisticas.comparativo = {
        cumplimiento_promedio: 0,
        metas_planificadas: 0,
        metas_ejecutadas: 0,
        instituciones_reportando: 0
      };

      // Agregar estadísticas de validaciones
      estadisticas.validaciones = {
        total: (estadisticas.objetivos?.validados || 0) + (estadisticas.proyectos?.validados || 0),
        objetivos: estadisticas.objetivos?.validados || 0,
        proyectos: estadisticas.proyectos?.validados || 0,
        por_revisor: {}
      };

      logger.info('Consulta de reportes realizada', {
        usuario: usuario.id,
        reportes_disponibles: reportesDisponibles
      });

      res.json({
        success: true,
        data: {
          reportes_disponibles: reportesDisponibles,
          estadisticas,
          puede_exportar: tienePermiso(usuario.roles, PERMISOS.REPORTES.EXPORTAR_REPORTES),
          puede_filtrar: tienePermiso(usuario.roles, PERMISOS.REPORTES.FILTRAR_REPORTES),
          rol_usuario: usuario.roles[0] // Para mostrar en frontend
        }
      });

    } catch (error) {
      logger.error('Error al consultar reportes', error as Error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * ACCIÓN 2: Filtrar reportes
   * Aplicar filtros por institución, estado, año, tipo de meta/indicador, etc.
   * Accesible por: Todos los roles habilitados
   */
  static async filtrarReportes(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const filtros: FiltrosReporte = req.body;

      // Verificar permisos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.FILTRAR_REPORTES)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para filtrar reportes'
        });
      }

      // Validar filtros según el rol
      const filtrosValidos: any = {};

      if (filtros.fechaInicio) filtrosValidos.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) filtrosValidos.fechaFin = filtros.fechaFin;
      if (filtros.estado) filtrosValidos.estado = filtros.estado;
      if (filtros.año) filtrosValidos.año = filtros.año;

      // Solo admin, planificadores, técnicos y auditores pueden filtrar por institución
      if (filtros.institucion && (usuario.roles.includes('ADMIN') || 
                                   usuario.roles.includes('PLANIF') || 
                                   usuario.roles.includes('TECNICO') ||
                                   usuario.roles.includes('AUDITOR'))) {
        filtrosValidos.institucion = filtros.institucion;
      }

      // Área solo para reportes de objetivos
      if (filtros.area && tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS)) {
        filtrosValidos.area = filtros.area;
      }

      res.json({
        success: true,
        data: {
          filtros_aplicados: filtrosValidos,
          mensaje: 'Filtros validados correctamente'
        }
      });

    } catch (error) {
      logger.error('Error al filtrar reportes', error as Error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * ACCIÓN 3: Exportar reportes
   * Descargar en PDF o Excel los reportes generados
   * ADMIN, Técnico (completo); Revisor, Validador (limitado); Auditor (completo)
   */
  static async exportarReportes(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const { tipo, formato, filtros } = req.body;

      logger.info('Solicitud de exportación recibida', {
        usuario: usuario.id,
        roles: usuario.roles,
        tipo,
        formato,
        filtros
      });

      // Verificar permisos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.EXPORTAR_REPORTES)) {
        logger.warn('Permisos insuficientes para exportar reportes', {
          usuario: usuario.id,
          roles: usuario.roles
        });
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para exportar reportes'
        });
      }

      // Validar que puede generar el tipo de reporte solicitado
      if (tipo === 'objetivos' && !tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para exportar reportes de objetivos'
        });
      }

      if (tipo === 'proyectos' && !tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para exportar reportes de proyectos'
        });
      }

      // Determinar el nivel de exportación según el rol
      let nivelExportacion = 'limitada';
      if (usuario.roles.includes('ADMIN') || 
          usuario.roles.includes('PLANIF') || 
          usuario.roles.includes('TECNICO') ||
          usuario.roles.includes('AUDITOR')) {
        nivelExportacion = 'completa';
      }

      // Validaciones específicas por rol según la matriz de la imagen
      if (usuario.roles.includes('VALID')) {
        // Validador: solo reportes de objetivos con exportación limitada
        if (tipo !== 'objetivos') {
          return res.status(403).json({
            success: false,
            message: 'Los Validadores solo pueden exportar reportes de objetivos estratégicos'
          });
        }
      }

      if (usuario.roles.includes('REVISOR')) {
        // Revisor: solo reportes de proyectos con exportación limitada
        if (tipo !== 'proyectos') {
          return res.status(403).json({
            success: false,
            message: 'Los Revisores solo pueden exportar reportes de proyectos de inversión'
          });
        }
      }

      logger.info('Solicitud de exportación de reporte', {
        usuario: usuario.id,
        tipo,
        formato,
        nivel: nivelExportacion
      });

      // Obtener datos según el tipo de reporte
      let datos: any[] = [];
      
      logger.info('Obteniendo datos para el reporte', { tipo });
      
      if (tipo === 'objetivos') {
        const query = `
          SELECT 
            o.id,
            o.codigo,
            o.descripcion,
            o.estado,
            o.tipo,
            o.created_at as fecha_registro,
            i.nombre as institucion_nombre,
            CONCAT(u.nombre, ' ', u.apellido) as usuario_creador
          FROM objetivo o
          LEFT JOIN plan_institucional pi ON o.plan_institucional_id = pi.id
          LEFT JOIN institucion i ON pi.institucion_id = i.id
          LEFT JOIN usuario u ON o.responsable_id = u.id
          WHERE 1=1
          ${!usuario.roles.includes('ADMIN') && 
            !usuario.roles.includes('PLANIF') && 
            !usuario.roles.includes('TECNICO') &&
            !usuario.roles.includes('AUDITOR') 
            ? 'AND u.institucion_id = $1' : ''}
          ORDER BY o.created_at DESC
        `;
        
        const parametros = !usuario.roles.includes('ADMIN') && 
                           !usuario.roles.includes('PLANIF') && 
                           !usuario.roles.includes('TECNICO') &&
                           !usuario.roles.includes('AUDITOR') 
          ? [usuario.institucion_id] : [];
        
        const result = await pool.query(query, parametros);
        datos = result.rows;
        logger.info('Datos de objetivos obtenidos', { cantidad: datos.length });
      } else if (tipo === 'proyectos') {
        const query = `
          SELECT 
            p.id,
            p.codigo,
            p.nombre,
            p.estado,
            p.presupuesto_total as monto_total,
            p.presupuesto_ejecutado,
            EXTRACT(YEAR FROM p.created_at) as ano_presupuesto,
            p.tipo as tipo_presupuesto,
            p.created_at as fecha_registro,
            i.nombre as institucion_nombre,
            CONCAT(u.nombre, ' ', u.apellido) as usuario_creador,
            CONCAT(s.nombre, ' ', s.apellido) as supervisor
          FROM proyecto p
          LEFT JOIN institucion i ON p.institucion_id = i.id
          LEFT JOIN usuario u ON p.responsable_id = u.id
          LEFT JOIN usuario s ON p.supervisor_id = s.id
          WHERE 1=1
          ${!usuario.roles.includes('ADMIN') && 
            !usuario.roles.includes('PLANIF') && 
            !usuario.roles.includes('TECNICO') &&
            !usuario.roles.includes('AUDITOR') 
            ? 'AND p.institucion_id = $1' : ''}
          ORDER BY p.created_at DESC
        `;
        
        const parametros = !usuario.roles.includes('ADMIN') && 
                           !usuario.roles.includes('PLANIF') && 
                           !usuario.roles.includes('TECNICO') &&
                           !usuario.roles.includes('AUDITOR') 
          ? [usuario.institucion_id] : [];
        
        const result = await pool.query(query, parametros);
        datos = result.rows;
        logger.info('Datos de proyectos obtenidos', { cantidad: datos.length });
      } else {
        // Para tipos no soportados directamente (presupuestario, comparativo)
        datos = [
          {
            id: 1,
            tipo: tipo,
            mensaje: `Datos de ejemplo para reporte ${tipo}`,
            fecha_generacion: new Date().toISOString(),
            total_registros: 0
          }
        ];
      }

      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte_${tipo}_${fechaActual}`;

      if (formato === 'csv') {
        // Generar CSV
        logger.info('Generando archivo CSV', { cantidadDatos: datos.length });
        const csv = await generarCSV(datos, tipo);
        logger.info('CSV generado', { tamaño: csv.length });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.csv"`);
        res.send(csv);
      } else if (formato === 'excel') {
        // Generar Excel
        logger.info('Generando archivo Excel', { cantidadDatos: datos.length });
        const buffer = await generarExcel(datos, tipo);
        logger.info('Excel generado', { tamaño: buffer.length });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.xlsx"`);
        res.send(buffer);
      } else if (formato === 'pdf') {
        // Generar PDF
        logger.info('Generando archivo PDF', { cantidadDatos: datos.length });
        const buffer = await generarPDF(datos, tipo);
        logger.info('PDF generado', { tamaño: buffer.length });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.pdf"`);
        res.send(buffer);
      }

    } catch (error) {
      logger.error('Error al exportar reporte', error as Error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * ACCIÓN 4: Generar reporte técnico de objetivos
   * Mostrar objetivos con sus alineaciones, metas, indicadores y estado de validación
   * Accesible por: Admin, Técnico, Auditor
   */
  static async generarReporteObjetivos(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const filtros: FiltrosReporte = req.query;

      // Verificar permisos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para generar reportes de objetivos'
        });
      }

      let query = `
        SELECT 
          o.id,
          o.codigo as nombre,
          o.descripcion,
          o.estado,
          o.tipo as area,
          o.prioridad,
          o.resultado_esperado as alineacion_pnd,
          o.indicador_cumplimiento as alineacion_ods,
          o.created_at as fecha_creacion,
          o.updated_at as fecha_modificacion,
          CONCAT(u.nombre, ' ', u.apellido) as responsable,
          NULL as validado_por,
          NULL as fecha_validacion,
          NULL as comentarios_validacion,
          i.nombre as institucion,
          0 as total_metas,
          0 as total_indicadores
        FROM objetivo o
        LEFT JOIN usuario u ON o.responsable_id = u.id
        LEFT JOIN institucion i ON u.institucion_id = i.id
        WHERE 1=1
      `;

      const parametros: any[] = [];
      let contadorParametros = 1;

      // Aplicar filtros según el rol del usuario
      if (usuario.roles.includes('VALID')) {
        // Autoridad Validante: solo objetivos enviados para validación
        query += ` AND o.estado IN ('enviado', 'aprobado', 'rechazado')`;
      } else if (!usuario.roles.includes('ADMIN') && 
                 !usuario.roles.includes('PLANIF') && 
                 !usuario.roles.includes('TECNICO') &&
                 !usuario.roles.includes('AUDITOR')) {
        // Otros roles: solo objetivos de su institución
        query += ` AND u.institucion_id = $${contadorParametros}`;
        parametros.push(usuario.institucion_id);
        contadorParametros++;
      }

      // Aplicar filtros adicionales
      if (filtros.estado) {
        query += ` AND o.estado = $${contadorParametros}`;
        parametros.push(filtros.estado);
        contadorParametros++;
      }

      if (filtros.area) {
        query += ` AND o.area ILIKE $${contadorParametros}`;
        parametros.push(`%${filtros.area}%`);
        contadorParametros++;
      }

      if (filtros.fechaInicio) {
        query += ` AND o.created_at >= $${contadorParametros}`;
        parametros.push(filtros.fechaInicio);
        contadorParametros++;
      }

      if (filtros.fechaFin) {
        query += ` AND o.created_at <= $${contadorParametros}`;
        parametros.push(filtros.fechaFin);
        contadorParametros++;
      }

      query += ` 
        ORDER BY o.created_at DESC
      `;

      const result = await pool.query(query, parametros);

      logger.info('Reporte técnico de objetivos generado', {
        usuario: usuario.id,
        filtros,
        total_registros: result.rows.length
      });

      res.json({
        success: true,
        data: {
          tipo: 'objetivos',
          registros: result.rows,
          total: result.rows.length,
          filtros_aplicados: filtros,
          generado_por: usuario.roles[0],
          fecha_generacion: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error al generar reporte de objetivos', error as Error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * ACCIÓN 5: Generar reporte técnico de proyectos
   * Mostrar proyectos con presupuesto, actividades y estado de validación
   * Accesible por: Admin, Técnico, Auditor
   */
  static async generarReporteProyectos(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const filtros: FiltrosReporte = req.query;

      // Verificar permisos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para generar reportes de proyectos'
        });
      }

      let query = `
        SELECT 
          p.id,
          p.nombre,
          p.descripcion,
          p.estado,
          p.fecha_inicio,
          p.fecha_fin,
          p.presupuesto_total as presupuesto_asignado,
          p.presupuesto_ejecutado,
          ROUND((p.presupuesto_ejecutado::numeric / NULLIF(p.presupuesto_total::numeric, 0)) * 100, 2) as porcentaje_presupuesto,
          p.porcentaje_avance,
          CONCAT(u.nombre, ' ', u.apellido) as responsable,
          CONCAT(v.nombre, ' ', v.apellido) as validado_por,
          NULL as fecha_validacion,
          NULL as comentarios_validacion,
          i.nombre as institucion,
          0 as total_actividades,
          0 as actividades_completadas
        FROM proyecto p
        LEFT JOIN usuario u ON p.responsable_id = u.id
        LEFT JOIN usuario v ON p.supervisor_id = v.id
        LEFT JOIN institucion i ON p.institucion_id = i.id
        WHERE 1=1
      `;

      const parametros: any[] = [];
      let contadorParametros = 1;

      // Aplicar filtros según el rol del usuario
      if (usuario.roles.includes('REVISOR')) {
        // Revisor: acceso limitado a proyectos en revisión/validados
        query += ` AND p.estado IN ('en_revision', 'aprobado', 'rechazado')`;
      } else if (!usuario.roles.includes('ADMIN') && 
                 !usuario.roles.includes('PLANIF') && 
                 !usuario.roles.includes('TECNICO') &&
                 !usuario.roles.includes('AUDITOR')) {
        // Otros roles: solo proyectos de su institución
        query += ` AND p.institucion_id = $${contadorParametros}`;
        parametros.push(usuario.institucion_id);
        contadorParametros++;
      }

      // Aplicar filtros adicionales
      if (filtros.estado) {
        query += ` AND p.estado = $${contadorParametros}`;
        parametros.push(filtros.estado);
        contadorParametros++;
      }

      if (filtros.fechaInicio) {
        query += ` AND p.fecha_inicio >= $${contadorParametros}`;
        parametros.push(filtros.fechaInicio);
        contadorParametros++;
      }

      if (filtros.fechaFin) {
        query += ` AND p.fecha_fin <= $${contadorParametros}`;
        parametros.push(filtros.fechaFin);
        contadorParametros++;
      }

      query += ` 
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, parametros);

      logger.info('Reporte técnico de proyectos generado', {
        usuario: usuario.id,
        filtros,
        total_registros: result.rows.length
      });

      res.json({
        success: true,
        data: {
          tipo: 'proyectos',
          registros: result.rows,
          total: result.rows.length,
          filtros_aplicados: filtros,
          generado_por: usuario.roles[0],
          fecha_generacion: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error al generar reporte de proyectos', error as Error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * ACCIÓN 6: Visualizar resumen presupuestario
   * Mostrar total de presupuestos, monto aprobado y estado de ejecución
   * Accesible por: Admin, Técnico, Auditor
   */
  static async visualizarResumenPresupuestario(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const filtros: FiltrosReporte = req.query;

      // Verificar permisos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.VISUALIZAR_RESUMEN_PRESUPUESTARIO)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para visualizar resumen presupuestario'
        });
      }

      let whereClause = 'WHERE 1=1';
      const parametros: any[] = [];
      let contadorParametros = 1;

            // Filtrar por institución si no es admin/planif/tecnico/auditor
      if (!usuario.roles.includes('ADMIN') && 
          !usuario.roles.includes('PLANIF') && 
          !usuario.roles.includes('TECNICO') &&
          !usuario.roles.includes('AUDITOR')) {
        whereClause += ` AND p.institucion_id = $${contadorParametros}`;
        parametros.push(usuario.institucion_id);
        contadorParametros++;
      }

      // Aplicar filtros de fecha si se proporcionan
      if (filtros.año) {
        whereClause += ` AND EXTRACT(YEAR FROM p.created_at) = $${contadorParametros}`;
        parametros.push(parseInt(filtros.año));
        contadorParametros++;
      }

      const queryResumen = `
        SELECT 
          COUNT(*) as total_proyectos,
          COALESCE(SUM(p.presupuesto_total), 0) as presupuesto_total_asignado,
          COALESCE(SUM(p.presupuesto_ejecutado), 0) as presupuesto_total_ejecutado,
          COALESCE(SUM(CASE WHEN p.estado = 'Aprobado' THEN p.presupuesto_total ELSE 0 END), 0) as presupuesto_aprobado,
          COUNT(CASE WHEN p.estado = 'Aprobado' THEN 1 END) as proyectos_aprobados,
          COUNT(CASE WHEN p.estado = 'Enviado' THEN 1 END) as proyectos_en_revision,
          COUNT(CASE WHEN p.estado = 'Rechazado' THEN 1 END) as proyectos_rechazados,
          ROUND(
            COALESCE(SUM(p.presupuesto_ejecutado), 0) * 100.0 / 
            NULLIF(COALESCE(SUM(p.presupuesto_total), 0), 0), 
            2
          ) as porcentaje_ejecucion_global
        FROM proyecto p
        ${whereClause}
      `;

      const queryPorInstitucion = `
        SELECT 
          i.nombre as institucion,
          COUNT(p.id) as proyectos,
          COALESCE(SUM(p.presupuesto_total), 0) as presupuesto_asignado,
          COALESCE(SUM(p.presupuesto_ejecutado), 0) as presupuesto_ejecutado,
          ROUND(
            COALESCE(SUM(p.presupuesto_ejecutado), 0) * 100.0 / 
            NULLIF(COALESCE(SUM(p.presupuesto_total), 0), 0), 
            2
          ) as porcentaje_ejecucion
        FROM proyecto p
        LEFT JOIN institucion i ON p.institucion_id = i.id
        ${whereClause}
        GROUP BY i.id, i.nombre
        ORDER BY presupuesto_asignado DESC
      `;

      const [resumenGeneral, resumenPorInstitucion] = await Promise.all([
        pool.query(queryResumen, parametros),
        pool.query(queryPorInstitucion, parametros)
      ]);

      logger.info('Resumen presupuestario generado', {
        usuario: usuario.id,
        filtros
      });

      res.json({
        success: true,
        data: {
          resumen_general: resumenGeneral.rows[0],
          por_institucion: resumenPorInstitucion.rows,
          filtros_aplicados: filtros,
          generado_por: usuario.roles[0],
          fecha_generacion: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error al generar resumen presupuestario', error as Error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * ACCIÓN 7: Reporte dinámico comparativo
   * Comparar metas planificadas vs ejecutadas, estado por año/institución
   * Accesible por: Técnico, Auditor
   */
  static async reporteDinamicoComparativo(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const filtros: FiltrosReporte = req.query;

      // Verificar permisos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.REPORTE_DINAMICO_COMPARATIVO)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para generar reportes dinámicos comparativos'
        });
      }

      const año = filtros.año || new Date().getFullYear().toString();

      // Comparativo de objetivos: planificados vs ejecutados
      const queryObjetivos = `
        SELECT 
          o.tipo as area,
          COUNT(o.id) as objetivos_planificados,
          COUNT(CASE WHEN o.estado = 'Validado' THEN 1 END) as objetivos_aprobados,
          0 as metas_planificadas,
          0 as metas_completadas,
          ROUND(
            COUNT(CASE WHEN o.estado = 'Validado' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(o.id), 0), 
            2
          ) as porcentaje_objetivos_logrados
        FROM objetivo o
        LEFT JOIN usuario u ON o.responsable_id = u.id
        WHERE EXTRACT(YEAR FROM o.created_at) = $1
        ${!usuario.roles.includes('ADMIN') && 
          !usuario.roles.includes('PLANIF') && 
          !usuario.roles.includes('TECNICO') &&
          !usuario.roles.includes('AUDITOR') 
          ? 'AND u.institucion_id = $2' : ''}
        GROUP BY o.tipo
        ORDER BY objetivos_planificados DESC
      `;

      // Comparativo de proyectos: presupuesto planificado vs ejecutado
      const queryProyectos = `
        SELECT 
          i.nombre as institucion,
          COUNT(p.id) as proyectos_planificados,
          COUNT(CASE WHEN p.estado = 'Aprobado' THEN 1 END) as proyectos_aprobados,
          COALESCE(SUM(p.presupuesto_total), 0) as presupuesto_planificado,
          COALESCE(SUM(p.presupuesto_ejecutado), 0) as presupuesto_ejecutado,
          ROUND(
            COALESCE(SUM(p.presupuesto_ejecutado), 0) * 100.0 / 
            NULLIF(COALESCE(SUM(p.presupuesto_total), 0), 0), 
            2
          ) as porcentaje_ejecucion_presupuestal
        FROM proyecto p
        LEFT JOIN institucion i ON p.institucion_id = i.id
        WHERE EXTRACT(YEAR FROM p.created_at) = $1
        ${!usuario.roles.includes('ADMIN') && 
          !usuario.roles.includes('PLANIF') && 
          !usuario.roles.includes('TECNICO') &&
          !usuario.roles.includes('AUDITOR') 
          ? 'AND p.institucion_id = $2' : ''}
        GROUP BY i.id, i.nombre
        ORDER BY presupuesto_planificado DESC
      `;

      const parametros = !usuario.roles.includes('ADMIN') && 
                         !usuario.roles.includes('PLANIF') && 
                         !usuario.roles.includes('TECNICO') &&
                         !usuario.roles.includes('AUDITOR') 
        ? [año, usuario.institucion_id] : [año];

      const [comparativoObjetivos, comparativoProyectos] = await Promise.all([
        pool.query(queryObjetivos, parametros),
        pool.query(queryProyectos, parametros)
      ]);

      logger.info('Reporte dinámico comparativo generado', {
        usuario: usuario.id,
        año: año
      });

      res.json({
        success: true,
        data: {
          año: año,
          comparativo_objetivos: comparativoObjetivos.rows,
          comparativo_proyectos: comparativoProyectos.rows,
          generado_por: usuario.roles[0],
          fecha_generacion: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error al generar reporte dinámico comparativo', error as Error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener opciones disponibles para filtros según el rol del usuario
   */
  static async obtenerOpcionesFiltros(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;

      // Verificar permisos básicos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.CONSULTAR_REPORTES)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a opciones de filtros'
        });
      }

      const opciones: any = {
        estados: {
          objetivos: ['borrador', 'enviado', 'aprobado', 'rechazado'],
          proyectos: ['registrado', 'en_revision', 'aprobado', 'rechazado']
        },
        años: [],
        areas: [],
        responsables: [],
        instituciones: []
      };

      // Obtener años disponibles
      const queryAños = `
        SELECT DISTINCT EXTRACT(YEAR FROM created_at) as año
        FROM (
          SELECT created_at FROM objetivo
          UNION ALL
          SELECT created_at FROM proyecto
        ) AS fechas
        ORDER BY año DESC
      `;
      const resultAños = await pool.query(queryAños);
      opciones.años = resultAños.rows.map((row: any) => row.año);

      // Obtener áreas (solo si puede ver objetivos)
      if (tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS)) {
        const queryAreas = `
          SELECT DISTINCT tipo as area
          FROM objetivo 
          WHERE tipo IS NOT NULL AND tipo != ''
          ORDER BY tipo
        `;
        const resultAreas = await pool.query(queryAreas);
        opciones.areas = resultAreas.rows.map((row: any) => row.area);
      }

      // Obtener responsables según permisos
      let queryResponsables = `
        SELECT DISTINCT u.id, CONCAT(u.nombre, ' ', u.apellido) as nombre_completo
        FROM usuario u
        WHERE u.estado = true
      `;

      if (!usuario.roles.includes('ADMIN') && 
          !usuario.roles.includes('PLANIF') && 
          !usuario.roles.includes('TECNICO') &&
          !usuario.roles.includes('AUDITOR')) {
        queryResponsables += ` AND u.institucion_id = $1`;
        const resultResponsables = await pool.query(queryResponsables, [usuario.institucion_id]);
        opciones.responsables = resultResponsables.rows;
      } else {
        const resultResponsables = await pool.query(queryResponsables);
        opciones.responsables = resultResponsables.rows;
      }

      // Obtener instituciones (solo para admin, planificadores, técnicos y auditores)
      if (usuario.roles.includes('ADMIN') || 
          usuario.roles.includes('PLANIF') || 
          usuario.roles.includes('TECNICO') ||
          usuario.roles.includes('AUDITOR')) {
        const queryInstituciones = `
          SELECT id, nombre 
          FROM institucion 
          WHERE estado = true
          ORDER BY nombre
        `;
        const resultInstituciones = await pool.query(queryInstituciones);
        opciones.instituciones = resultInstituciones.rows;
      }

      res.json({
        success: true,
        data: opciones
      });

    } catch (error) {
      logger.error('Error al obtener opciones de filtros', error as Error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

// ================================================================
// FUNCIONES AUXILIARES PARA GENERACIÓN DE ARCHIVOS
// ================================================================

/**
 * Genera un archivo CSV con los datos proporcionados
 */
async function generarCSV(datos: any[], tipo: string): Promise<string> {
  if (datos.length === 0) {
    return 'No hay datos disponibles para exportar';
  }

  // Obtener las columnas del primer registro
  const columnas = Object.keys(datos[0]);
  
  // Crear el encabezado CSV
  let csv = columnas.join(',') + '\n';
  
  // Agregar los datos
  datos.forEach(fila => {
    const valores = columnas.map(col => {
      let valor = fila[col];
      if (valor === null || valor === undefined) {
        return '';
      }
      // Escapar comillas y envolver en comillas si contiene comas
      valor = String(valor).replace(/"/g, '""');
      if (valor.includes(',') || valor.includes('\n') || valor.includes('"')) {
        valor = `"${valor}"`;
      }
      return valor;
    });
    csv += valores.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Genera un archivo Excel con los datos proporcionados
 */
async function generarExcel(datos: any[], tipo: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Reporte ${tipo}`);
  
  if (datos.length === 0) {
    worksheet.addRow(['No hay datos disponibles para exportar']);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // Configurar encabezados
  const columnas = Object.keys(datos[0]);
  const encabezados = columnas.map(col => ({
    header: col.replace(/_/g, ' ').toUpperCase(),
    key: col,
    width: 20
  }));
  
  worksheet.columns = encabezados;
  
  // Estilo para encabezados
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Agregar datos
  datos.forEach(fila => {
    worksheet.addRow(fila);
  });
  
  // Aplicar bordes a todas las celdas
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Genera un archivo PDF con los datos proporcionados
 */
async function generarPDF(datos: any[], tipo: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
    
    // Encabezado del documento
    doc.fontSize(20).text(`Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, { align: 'center' });
    doc.fontSize(12).text(`Generado el: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    if (datos.length === 0) {
      doc.text('No hay datos disponibles para exportar');
      doc.end();
      return;
    }
    
    // Configurar tabla
    const columnas = Object.keys(datos[0]);
    const anchoColumna = (doc.page.width - 100) / columnas.length;
    let posicionY = doc.y;
    
    // Encabezados de tabla
    doc.fontSize(10);
    columnas.forEach((col, index) => {
      const x = 50 + (index * anchoColumna);
      doc.rect(x, posicionY, anchoColumna, 20).stroke();
      doc.text(col.replace(/_/g, ' ').toUpperCase(), x + 2, posicionY + 5, {
        width: anchoColumna - 4,
        height: 15,
        ellipsis: true
      });
    });
    
    posicionY += 20;
    
    // Datos de tabla
    datos.forEach((fila, filaIndex) => {
      // Verificar si necesitamos una nueva página
      if (posicionY > doc.page.height - 100) {
        doc.addPage();
        posicionY = 50;
        
        // Re-dibujar encabezados en la nueva página
        columnas.forEach((col, index) => {
          const x = 50 + (index * anchoColumna);
          doc.rect(x, posicionY, anchoColumna, 20).stroke();
          doc.text(col.replace(/_/g, ' ').toUpperCase(), x + 2, posicionY + 5, {
            width: anchoColumna - 4,
            height: 15,
            ellipsis: true
          });
        });
        posicionY += 20;
      }
      
      columnas.forEach((col, index) => {
        const x = 50 + (index * anchoColumna);
        doc.rect(x, posicionY, anchoColumna, 20).stroke();
        const valor = fila[col] || '';
        doc.text(String(valor), x + 2, posicionY + 5, {
          width: anchoColumna - 4,
          height: 15,
          ellipsis: true
        });
      });
      
      posicionY += 20;
    });
    
    doc.end();
  });
} 
