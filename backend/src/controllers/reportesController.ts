// ================================================================
// CONTROLADOR DE REPORTES - MÓDULO 4
// Gestión de consultas, generación y exportación de reportes
// Implementa la matriz de permisos según documentación
// ================================================================

import { Request, Response } from 'express';
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
            COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
            COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as rechazados,
            COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as en_revision
          FROM objetivos o
          LEFT JOIN usuarios u ON o.id_responsable = u.id
          WHERE 1=1
          ${!usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR') 
            ? 'AND u.id_institucion = $1' : ''}
        `;
        
        const parametros = !usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR') 
          ? [usuario.id_institucion] : [];
          
        const resultObjetivos = await pool.query(queryObjetivos, parametros);
        estadisticas.objetivos = resultObjetivos.rows[0];
      }

      if (reportesDisponibles.proyectos) {
        const queryProyectos = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
            COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as rechazados,
            COUNT(CASE WHEN estado = 'en_revision' THEN 1 END) as en_revision,
            COALESCE(SUM(presupuesto_asignado), 0) as presupuesto_total,
            COALESCE(SUM(presupuesto_ejecutado), 0) as presupuesto_ejecutado
          FROM proyectos p
          LEFT JOIN usuarios u ON p.id_responsable = u.id
          WHERE 1=1
          ${!usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR') 
            ? 'AND u.id_institucion = $1' : ''}
        `;
        
        const parametros = !usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR') 
          ? [usuario.id_institucion] : [];
          
        const resultProyectos = await pool.query(queryProyectos, parametros);
        estadisticas.proyectos = resultProyectos.rows[0];
      }

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

      // Solo admin, planificadores y auditores pueden filtrar por institución
      if (filtros.institucion && (usuario.roles.includes('ADMIN') || usuario.roles.includes('PLANIF') || usuario.roles.includes('AUDITOR'))) {
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

      // Verificar permisos
      if (!tienePermiso(usuario.roles, PERMISOS.REPORTES.EXPORTAR_REPORTES)) {
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
      if (usuario.roles.includes('ADMIN') || usuario.roles.includes('PLANIF') || usuario.roles.includes('AUDITOR')) {
        nivelExportacion = 'completa';
      }

      logger.info('Solicitud de exportación de reporte', {
        usuario: usuario.id,
        tipo,
        formato,
        nivel: nivelExportacion
      });

      // Simular generación de archivo
      const nombreArchivo = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.${formato}`;

      res.json({
        success: true,
        data: {
          mensaje: `Reporte ${tipo} preparado para exportación`,
          archivo: nombreArchivo,
          formato,
          nivel_exportacion: nivelExportacion,
          disponible_en: 'En desarrollo - próximamente disponible'
        }
      });

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
          o.nombre,
          o.descripcion,
          o.estado,
          o.area,
          o.prioridad,
          o.alineacion_pnd,
          o.alineacion_ods,
          o.fecha_creacion,
          o.fecha_modificacion,
          CONCAT(u.nombre, ' ', u.apellido) as responsable,
          CONCAT(v.nombre, ' ', v.apellido) as validado_por,
          o.fecha_validacion,
          o.comentarios_validacion,
          i.nombre as institucion,
          COUNT(m.id) as total_metas,
          COUNT(ind.id) as total_indicadores
        FROM objetivos o
        LEFT JOIN usuarios u ON o.id_responsable = u.id
        LEFT JOIN usuarios v ON o.validado_por = v.id
        LEFT JOIN instituciones i ON u.id_institucion = i.id
        LEFT JOIN metas m ON o.id = m.id_objetivo
        LEFT JOIN indicadores ind ON m.id = ind.id_meta
        WHERE 1=1
      `;

      const parametros: any[] = [];
      let contadorParametros = 1;

      // Aplicar filtros según el rol del usuario
      if (usuario.roles.includes('VALID')) {
        // Autoridad Validante: solo objetivos enviados para validación
        query += ` AND o.estado IN ('enviado', 'aprobado', 'rechazado')`;
      } else if (!usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR')) {
        // Otros roles: solo objetivos de su institución
        query += ` AND u.id_institucion = $${contadorParametros}`;
        parametros.push(usuario.id_institucion);
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
        query += ` AND o.fecha_creacion >= $${contadorParametros}`;
        parametros.push(filtros.fechaInicio);
        contadorParametros++;
      }

      if (filtros.fechaFin) {
        query += ` AND o.fecha_creacion <= $${contadorParametros}`;
        parametros.push(filtros.fechaFin);
        contadorParametros++;
      }

      query += ` 
        GROUP BY o.id, u.nombre, u.apellido, v.nombre, v.apellido, i.nombre
        ORDER BY o.fecha_creacion DESC
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
          p.presupuesto_asignado,
          p.presupuesto_ejecutado,
          ROUND((p.presupuesto_ejecutado::numeric / NULLIF(p.presupuesto_asignado::numeric, 0)) * 100, 2) as porcentaje_presupuesto,
          p.porcentaje_avance,
          CONCAT(u.nombre, ' ', u.apellido) as responsable,
          CONCAT(v.nombre, ' ', v.apellido) as validado_por,
          p.fecha_validacion,
          p.comentarios_validacion,
          i.nombre as institucion,
          COUNT(a.id) as total_actividades,
          COUNT(CASE WHEN a.estado = 'completada' THEN 1 END) as actividades_completadas
        FROM proyectos p
        LEFT JOIN usuarios u ON p.id_responsable = u.id
        LEFT JOIN usuarios v ON p.validado_por = v.id
        LEFT JOIN instituciones i ON u.id_institucion = i.id
        LEFT JOIN actividades a ON p.id = a.id_proyecto
        WHERE 1=1
      `;

      const parametros: any[] = [];
      let contadorParametros = 1;

      // Aplicar filtros según el rol del usuario
      if (usuario.roles.includes('REVISOR')) {
        // Revisor: acceso limitado a proyectos en revisión/validados
        query += ` AND p.estado IN ('en_revision', 'aprobado', 'rechazado')`;
      } else if (!usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR')) {
        // Otros roles: solo proyectos de su institución
        query += ` AND u.id_institucion = $${contadorParametros}`;
        parametros.push(usuario.id_institucion);
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
        GROUP BY p.id, u.nombre, u.apellido, v.nombre, v.apellido, i.nombre
        ORDER BY p.fecha_creacion DESC
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

      // Filtrar por institución si no es admin/planif/auditor
      if (!usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR')) {
        whereClause += ` AND u.id_institucion = $${contadorParametros}`;
        parametros.push(usuario.id_institucion);
        contadorParametros++;
      }

      // Aplicar filtros de fecha si se proporcionan
      if (filtros.año) {
        whereClause += ` AND EXTRACT(YEAR FROM p.fecha_creacion) = $${contadorParametros}`;
        parametros.push(parseInt(filtros.año));
        contadorParametros++;
      }

      const queryResumen = `
        SELECT 
          COUNT(*) as total_proyectos,
          COALESCE(SUM(p.presupuesto_asignado), 0) as presupuesto_total_asignado,
          COALESCE(SUM(p.presupuesto_ejecutado), 0) as presupuesto_total_ejecutado,
          COALESCE(SUM(CASE WHEN p.estado = 'aprobado' THEN p.presupuesto_asignado ELSE 0 END), 0) as presupuesto_aprobado,
          COUNT(CASE WHEN p.estado = 'aprobado' THEN 1 END) as proyectos_aprobados,
          COUNT(CASE WHEN p.estado = 'en_revision' THEN 1 END) as proyectos_en_revision,
          COUNT(CASE WHEN p.estado = 'rechazado' THEN 1 END) as proyectos_rechazados,
          ROUND(
            COALESCE(SUM(p.presupuesto_ejecutado), 0) * 100.0 / 
            NULLIF(COALESCE(SUM(p.presupuesto_asignado), 0), 0), 
            2
          ) as porcentaje_ejecucion_global
        FROM proyectos p
        LEFT JOIN usuarios u ON p.id_responsable = u.id
        ${whereClause}
      `;

      const queryPorInstitucion = `
        SELECT 
          i.nombre as institucion,
          COUNT(p.id) as proyectos,
          COALESCE(SUM(p.presupuesto_asignado), 0) as presupuesto_asignado,
          COALESCE(SUM(p.presupuesto_ejecutado), 0) as presupuesto_ejecutado,
          ROUND(
            COALESCE(SUM(p.presupuesto_ejecutado), 0) * 100.0 / 
            NULLIF(COALESCE(SUM(p.presupuesto_asignado), 0), 0), 
            2
          ) as porcentaje_ejecucion
        FROM proyectos p
        LEFT JOIN usuarios u ON p.id_responsable = u.id
        LEFT JOIN instituciones i ON u.id_institucion = i.id
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
          o.area,
          COUNT(o.id) as objetivos_planificados,
          COUNT(CASE WHEN o.estado = 'aprobado' THEN 1 END) as objetivos_aprobados,
          COUNT(m.id) as metas_planificadas,
          COUNT(CASE WHEN m.estado = 'completada' THEN 1 END) as metas_completadas,
          ROUND(
            COUNT(CASE WHEN o.estado = 'aprobado' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(o.id), 0), 
            2
          ) as porcentaje_objetivos_logrados
        FROM objetivos o
        LEFT JOIN metas m ON o.id = m.id_objetivo
        LEFT JOIN usuarios u ON o.id_responsable = u.id
        WHERE EXTRACT(YEAR FROM o.fecha_creacion) = $1
        ${!usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR') 
          ? 'AND u.id_institucion = $2' : ''}
        GROUP BY o.area
        ORDER BY objetivos_planificados DESC
      `;

      // Comparativo de proyectos: presupuesto planificado vs ejecutado
      const queryProyectos = `
        SELECT 
          i.nombre as institucion,
          COUNT(p.id) as proyectos_planificados,
          COUNT(CASE WHEN p.estado = 'aprobado' THEN 1 END) as proyectos_aprobados,
          COALESCE(SUM(p.presupuesto_asignado), 0) as presupuesto_planificado,
          COALESCE(SUM(p.presupuesto_ejecutado), 0) as presupuesto_ejecutado,
          ROUND(
            COALESCE(SUM(p.presupuesto_ejecutado), 0) * 100.0 / 
            NULLIF(COALESCE(SUM(p.presupuesto_asignado), 0), 0), 
            2
          ) as porcentaje_ejecucion_presupuestal
        FROM proyectos p
        LEFT JOIN usuarios u ON p.id_responsable = u.id
        LEFT JOIN instituciones i ON u.id_institucion = i.id
        WHERE EXTRACT(YEAR FROM p.fecha_creacion) = $1
        ${!usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR') 
          ? 'AND u.id_institucion = $2' : ''}
        GROUP BY i.id, i.nombre
        ORDER BY presupuesto_planificado DESC
      `;

      const parametros = !usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR') 
        ? [año, usuario.id_institucion] : [año];

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
        SELECT DISTINCT EXTRACT(YEAR FROM fecha_creacion) as año
        FROM (
          SELECT fecha_creacion FROM objetivos
          UNION ALL
          SELECT fecha_creacion FROM proyectos
        ) AS fechas
        ORDER BY año DESC
      `;
      const resultAños = await pool.query(queryAños);
      opciones.años = resultAños.rows.map((row: any) => row.año);

      // Obtener áreas (solo si puede ver objetivos)
      if (tienePermiso(usuario.roles, PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS)) {
        const queryAreas = `
          SELECT DISTINCT area 
          FROM objetivos 
          WHERE area IS NOT NULL AND area != ''
          ORDER BY area
        `;
        const resultAreas = await pool.query(queryAreas);
        opciones.areas = resultAreas.rows.map((row: any) => row.area);
      }

      // Obtener responsables según permisos
      let queryResponsables = `
        SELECT DISTINCT u.id, CONCAT(u.nombre, ' ', u.apellido) as nombre_completo
        FROM usuarios u
        WHERE u.activo = true
      `;

      if (!usuario.roles.includes('ADMIN') && !usuario.roles.includes('PLANIF') && !usuario.roles.includes('AUDITOR')) {
        queryResponsables += ` AND u.id_institucion = $1`;
        const resultResponsables = await pool.query(queryResponsables, [usuario.id_institucion]);
        opciones.responsables = resultResponsables.rows;
      } else {
        const resultResponsables = await pool.query(queryResponsables);
        opciones.responsables = resultResponsables.rows;
      }

      // Obtener instituciones (solo para admin, planificadores y auditores)
      if (usuario.roles.includes('ADMIN') || usuario.roles.includes('PLANIF') || usuario.roles.includes('AUDITOR')) {
        const queryInstituciones = `
          SELECT id, nombre 
          FROM instituciones 
          WHERE activa = true
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