// ================================================================
// RUTAS DEL MODULO DE REPORTES
// Endpoints para consulta, generación y exportación de reportes
// ================================================================

import { Router } from 'express';
import { ReportesController } from '../controllers/reportesController';
import { verifyToken } from '../middleware/authMiddleware';
import { verificarPermiso } from '../middleware/permissionMiddleware';
import { PERMISOS } from '../middleware/rolePermissions';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/reportes/test
 * @desc Endpoint de prueba para diagnóstico
 * @access Solo autenticación
 */
router.get('/test', (req, res) => {
  const usuario = (req as any).usuario;
  res.json({
    success: true,
    message: 'Reportes endpoint funcionando',
    usuario: {
      id: usuario.id,
      email: usuario.email,
      roles: usuario.roles
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/reportes/consultar
 * @desc Consultar reportes disponibles y estadísticas básicas
 * @access Requiere permisos de consulta de reportes
 * @roles Todos los roles habilitados
 */
router.get('/consultar',
  verificarPermiso(PERMISOS.REPORTES.CONSULTAR_REPORTES),
  ReportesController.consultarReportes
);

/**
 * @route POST /api/reportes/filtrar
 * @desc Aplicar filtros a los reportes
 * @access Requiere permisos de filtrado de reportes
 * @roles Todos los roles habilitados
 */
router.post('/filtrar',
  verificarPermiso(PERMISOS.REPORTES.FILTRAR_REPORTES),
  ReportesController.filtrarReportes
);

/**
 * @route GET /api/reportes/objetivos
 * @desc Generar reporte técnico de objetivos estratégicos
 * @access Requiere permisos específicos
 * @roles ADMIN, PLANIF, AUDITOR
 */
router.get('/objetivos',
  verificarPermiso(PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS),
  ReportesController.generarReporteObjetivos
);

/**
 * @route GET /api/reportes/proyectos
 * @desc Generar reporte técnico de proyectos de inversión
 * @access Requiere permisos específicos
 * @roles ADMIN, PLANIF, AUDITOR
 */
router.get('/proyectos',
  verificarPermiso(PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS),
  ReportesController.generarReporteProyectos
);

/**
 * @route GET /api/reportes/presupuestario
 * @desc Visualizar resumen presupuestario
 * @access Requiere permisos específicos
 * @roles ADMIN, PLANIF, AUDITOR
 */
router.get('/presupuestario',
  verificarPermiso(PERMISOS.REPORTES.VISUALIZAR_RESUMEN_PRESUPUESTARIO),
  ReportesController.visualizarResumenPresupuestario
);

/**
 * @route GET /api/reportes/comparativo
 * @desc Generar reporte dinámico comparativo
 * @access Requiere permisos específicos
 * @roles PLANIF, AUDITOR
 */
router.get('/comparativo',
  verificarPermiso(PERMISOS.REPORTES.REPORTE_DINAMICO_COMPARATIVO),
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
 * @body { tipo: 'objetivos'|'proyectos'|'presupuestario'|'comparativo', formato: 'pdf'|'excel'|'csv', filtros: {} }
 */
router.post('/exportar',
  // Nota: La validación de permisos específicos se hace en el controlador
  // porque depende del formato solicitado
  ReportesController.exportarReportes
);

export default router;