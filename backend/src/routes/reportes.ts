// ================================================================
// RUTAS DEL MODULO DE REPORTES
// Endpoints para consulta, generación y exportación de reportes
// ================================================================

import { Router } from 'express';
import { ReportesController } from '../controllers/reportesController';
import {
  auditConsultarReportes,
  auditExportarReportes,
  auditFiltrarReportes,
  auditGenerarReporteObjetivos,
  auditGenerarReporteProyectos,
  auditReporteDinamicoComparativo,
  auditVisualizarResumenPresupuestario,
  obtenerEstadisticasAuditoria
} from '../middleware/auditMiddleware';
import { verifyToken } from '../middleware/authMiddleware';
import { verificarPermiso } from '../middleware/permissionMiddleware';
import { PERMISOS } from '../middleware/rolePermissions';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/reportes/consultar
 * @desc Consultar reportes disponibles y estadísticas básicas
 * @access Requiere permisos de consulta de reportes
 * @roles Todos los roles habilitados
 * @audit Registra automáticamente la consulta para trazabilidad
 */
router.get('/consultar',
  verificarPermiso(PERMISOS.REPORTES.CONSULTAR_REPORTES),
  auditConsultarReportes,
  ReportesController.consultarReportes
);

/**
 * @route POST /api/reportes/filtrar
 * @desc Aplicar filtros a los reportes
 * @access Requiere permisos de filtrado de reportes
 * @roles Todos los roles habilitados
 * @audit Registra filtros aplicados para trazabilidad
 */
router.post('/filtrar',
  verificarPermiso(PERMISOS.REPORTES.FILTRAR_REPORTES),
  auditFiltrarReportes,
  ReportesController.filtrarReportes
);

/**
 * @route GET /api/reportes/objetivos
 * @desc Generar reporte técnico de objetivos estratégicos
 * @access Requiere permisos específicos
 * @roles ADMIN, PLANIF, AUDITOR
 * @audit Registra generación de reporte para trazabilidad
 */
router.get('/objetivos',
  verificarPermiso(PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS),
  auditGenerarReporteObjetivos,
  ReportesController.generarReporteObjetivos
);

/**
 * @route GET /api/reportes/proyectos
 * @desc Generar reporte técnico de proyectos de inversión
 * @access Requiere permisos específicos
 * @roles ADMIN, PLANIF, AUDITOR
 * @audit Registra generación de reporte para trazabilidad
 */
router.get('/proyectos',
  verificarPermiso(PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS),
  auditGenerarReporteProyectos,
  ReportesController.generarReporteProyectos
);

/**
 * @route GET /api/reportes/presupuestario
 * @desc Visualizar resumen presupuestario
 * @access Requiere permisos específicos
 * @roles ADMIN, PLANIF, AUDITOR
 * @audit Registra consulta de presupuesto para trazabilidad
 */
router.get('/presupuestario',
  verificarPermiso(PERMISOS.REPORTES.VISUALIZAR_RESUMEN_PRESUPUESTARIO),
  auditVisualizarResumenPresupuestario,
  ReportesController.visualizarResumenPresupuestario
);

/**
 * @route GET /api/reportes/comparativo
 * @desc Generar reporte dinámico comparativo
 * @access Requiere permisos específicos
 * @roles PLANIF, AUDITOR
 * @audit Registra generación de reporte comparativo para trazabilidad
 */
router.get('/comparativo',
  verificarPermiso(PERMISOS.REPORTES.REPORTE_DINAMICO_COMPARATIVO),
  auditReporteDinamicoComparativo,
  ReportesController.reporteDinamicoComparativo
);

/**
 * @route GET /api/reportes/filtros
 * @desc Obtener opciones disponibles para filtros
 * @access Requiere permisos de consulta de reportes
 * @roles Todos los roles habilitados
 */
router.get('/filtros',
  verificarPermiso(PERMISOS.REPORTES.CONSULTAR_REPORTES),
  ReportesController.obtenerOpcionesFiltros
);

/**
 * @route POST /api/reportes/exportar
 * @desc Exportar reportes en formato especificado
 * @access Requiere permisos específicos según formato
 * @roles ADMIN, PLANIF, VALID, REVISOR, AUDITOR
 * @audit Registra exportación para trazabilidad completa
 * @body { tipo: 'objetivos'|'proyectos'|'presupuestario'|'comparativo', formato: 'pdf'|'excel'|'csv', filtros: {} }
 */
router.post('/exportar',
  // Nota: La validación de permisos específicos se hace en el controlador
  // porque depende del formato solicitado
  auditExportarReportes,
  ReportesController.exportarReportes
);

/**
 * @route GET /api/reportes/auditoria/estadisticas
 * @desc Obtener estadísticas de auditoría del módulo de reportes
 * @access Solo auditores y administradores
 * @roles ADMIN, AUDITOR
 */
router.get('/auditoria/estadisticas',
  verificarPermiso(PERMISOS.AUDITORIA.VER_BITACORA),
  obtenerEstadisticasAuditoria
);

export default router;