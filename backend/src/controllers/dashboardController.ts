import { Request, Response } from 'express';
import pool from '../database/connection';
import { ApiResponse } from '../models';

// Dashboard general con estadisticas del sistema
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    if (!(req as any).usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no autenticado'
      };
      return res.status(401).json(response);
    }

    const userRoles = (req as any).usuario.roles;
    
    // Estadisticas base que todos pueden ver
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM institucion WHERE estado = true) as total_instituciones,
        (SELECT COUNT(*) FROM usuario WHERE estado = true) as total_usuarios,
        (SELECT COUNT(*) FROM objetivo WHERE estado != 'INACTIVO') as total_objetivos,
        (SELECT COUNT(*) FROM proyecto WHERE estado != 'ELIMINADO') as total_proyectos,
        (SELECT COUNT(*) FROM proyecto WHERE estado = 'Borrador') as proyectos_borrador,
        (SELECT COUNT(*) FROM proyecto WHERE estado = 'Enviado') as proyectos_pendientes,
        (SELECT COUNT(*) FROM proyecto WHERE estado = 'Aprobado') as proyectos_aprobados,
        (SELECT COUNT(*) FROM proyecto WHERE estado = 'Rechazado') as proyectos_rechazados,
        (SELECT COUNT(*) FROM actividad) as total_actividades,
        (SELECT COUNT(*) FROM presupuesto) as total_presupuestos,
        (SELECT COALESCE(SUM(presupuesto_total), 0) FROM proyecto WHERE estado = 'Aprobado') as monto_total_aprobado
    `;

  const baseStats = await pool.query(statsQuery);

    let dashboardData: any = {
      estadisticas: baseStats.rows[0],
      rol_principal: userRoles[0] || 'SIN_ROL',
      roles: userRoles,
      accesos: []
    };

    // Configurar datos especificos segun el rol
    if (userRoles.includes('ADMIN')) {
      dashboardData = await getAdminDashboard(dashboardData);
    } else if (userRoles.includes('PLANIF')) {
      dashboardData = await getPlanificadorDashboard(dashboardData);
    } else if (userRoles.includes('VALID')) {
      dashboardData = await getValidadorDashboard(dashboardData);
    } else if (userRoles.includes('REVISOR')) {
      dashboardData = await getRevisorDashboard(dashboardData);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: dashboardData
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Dashboard específico por rol (formato para RoleDashboard component)
export const getRoleSpecificStats = async (req: Request, res: Response) => {
  try {
    if (!(req as any).usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no autenticado'
      };
      return res.status(401).json(response);
    }

    const userRoles = (req as any).usuario.roles;
    const requestedRole = req.query.role as string || userRoles[0];

    // Estadísticas base
    const baseStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM institucion WHERE estado = true) as total_instituciones,
        (SELECT COUNT(*) FROM usuario WHERE estado = true) as total_usuarios,
        (SELECT COUNT(*) FROM objetivo WHERE estado != 'INACTIVO') as total_objetivos,
        (SELECT COUNT(*) FROM proyecto WHERE estado != 'ELIMINADO') as total_proyectos
    `;

    const baseStats = await pool.query(baseStatsQuery);
    const baseData = baseStats.rows[0];

    let roleSpecificData: any = {
      totalInstituciones: parseInt(baseData.total_instituciones) || 0,
      totalUsuarios: parseInt(baseData.total_usuarios) || 0,
      totalObjetivos: parseInt(baseData.total_objetivos) || 0,
      totalProyectos: parseInt(baseData.total_proyectos) || 0,
    };

    // Datos específicos por rol
    switch (requestedRole) {
      case 'ADMIN':
        const adminQuery = `
          SELECT 
            (SELECT COUNT(*) FROM auditoria WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_audit_events,
            (SELECT COUNT(*) FROM usuario WHERE estado = true) as active_users
        `;
        const adminResult = await pool.query(adminQuery);
        const adminData = adminResult.rows[0];
        
        roleSpecificData = {
          ...roleSpecificData,
          recentAuditEvents: parseInt(adminData.recent_audit_events) || 0,
          systemHealth: {
            status: 'healthy',
            activeUsers: parseInt(adminData.active_users) || 0,
            lastBackup: new Date().toISOString()
          }
        };
        break;

      case 'PLANIF':
        const planifQuery = `
          SELECT 
            (SELECT COUNT(*) FROM objetivo WHERE estado = 'ACTIVO') as my_objectives,
            (SELECT COUNT(*) FROM proyecto WHERE estado = 'FORMULACION') as my_projects,
            (SELECT COUNT(*) FROM objetivo WHERE estado = 'PENDIENTE_VALIDACION') as sent_for_validation,
            (SELECT COUNT(*) FROM proyecto WHERE estado = 'Enviado') as sent_for_review,
            (SELECT COUNT(*) FROM objetivo WHERE estado = 'RECHAZADO') + 
            (SELECT COUNT(*) FROM proyecto WHERE estado = 'Rechazado') as rejected_items
        `;
        const planifResult = await pool.query(planifQuery);
        const planifData = planifResult.rows[0];
        
        roleSpecificData = {
          ...roleSpecificData,
          myObjectives: parseInt(planifData.my_objectives) || 0,
          myProjects: parseInt(planifData.my_projects) || 0,
          sentForValidation: parseInt(planifData.sent_for_validation) || 0,
          sentForReview: parseInt(planifData.sent_for_review) || 0,
          rejectedItems: parseInt(planifData.rejected_items) || 0
        };
        break;

      case 'VALID':
        const validQuery = `
          SELECT 
            (SELECT COUNT(*) FROM objetivo WHERE estado = 'EN_VALIDACION') as objetivos_pendientes_validacion,
            (SELECT COUNT(*) FROM proyecto WHERE estado = 'Enviado') as proyectos_pendientes_revision
        `;
        const validResult = await pool.query(validQuery);
        const validData = validResult.rows[0];
        
        roleSpecificData = {
          ...roleSpecificData,
          objetivos_pendientes_validacion: parseInt(validData.objetivos_pendientes_validacion) || 0,
          proyectos_pendientes_revision: parseInt(validData.proyectos_pendientes_revision) || 0
        };
        break;

      case 'REVISOR':
        const revisorQuery = `
          SELECT 
            (SELECT COUNT(*) FROM proyecto WHERE estado = 'Enviado') as proyectos_pendientes_revision,
            (SELECT COUNT(*) FROM proyecto WHERE estado = 'Aprobado') as proyectos_aprobados
        `;
        const revisorResult = await pool.query(revisorQuery);
        const revisorData = revisorResult.rows[0];
        
        roleSpecificData = {
          ...roleSpecificData,
          proyectos_pendientes_revision: parseInt(revisorData.proyectos_pendientes_revision) || 0,
          proyectos_aprobados: parseInt(revisorData.proyectos_aprobados) || 0
        };
        break;

      case 'AUDITOR':
        const auditorQuery = `
          SELECT 
            (SELECT COUNT(*) FROM auditoria WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_audit_events,
            85 as compliance_rate,
            12 as budget_variance,
            (SELECT COUNT(*) FROM auditoria) as total_audits
        `;
        const auditorResult = await pool.query(auditorQuery);
        const auditorData = auditorResult.rows[0];
        
        roleSpecificData = {
          ...roleSpecificData,
          recentAuditEvents: parseInt(auditorData.recent_audit_events) || 0,
          complianceRate: parseInt(auditorData.compliance_rate) || 0,
          budgetVariance: parseInt(auditorData.budget_variance) || 0,
          totalAudits: parseInt(auditorData.total_audits) || 0
        };
        break;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: roleSpecificData
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener estadísticas por rol:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};

// Dashboard especifico para Administrador del Sistema
const getAdminDashboard = async (baseData: any) => {
  const adminStats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM auditoria WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as acciones_semana,
      (SELECT COUNT(*) FROM bitacora WHERE fecha_evento >= CURRENT_DATE - INTERVAL '7 days') as eventos_semana,
      (SELECT COUNT(*) FROM rol WHERE estado = true) as total_roles,
      (SELECT COUNT(*) FROM usuario_rol WHERE estado = true) as total_asignaciones
  `);

  return {
    ...baseData,
    tipo_dashboard: 'ADMINISTRADOR',
    titulo: 'Dashboard - Administrador del Sistema',
    descripcion: 'Panel de control con estadisticas generales del sistema',
    estadisticas_admin: adminStats.rows[0],
    accesos: [
      { modulo: 'Gestion de Objetivos', descripcion: 'Revision de objetivos estrategicos', permisos: ['revisar'] },
      { modulo: 'Proyectos de Inversion', descripcion: 'Revision y aprobacion de proyectos', permisos: ['revisar', 'aprobar'] },
      { modulo: 'Validaciones', descripcion: 'Gestion de procesos de validacion', permisos: ['validar'] },
      { modulo: 'Consultas', descripcion: 'Acceso a informacion institucional', permisos: ['ver'] }
    ],
    menu_disponible: ['configuracion', 'objetivos', 'proyectos', 'usuarios'],
  };
};

// Dashboard especifico para Tecnico Planificador
const getPlanificadorDashboard = async (baseData: any) => {
  const planificadorStats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM objetivo WHERE estado = 'ACTIVO') as objetivos_activos,
      (SELECT COUNT(*) FROM objetivo WHERE estado = 'BORRADOR') as objetivos_borrador,
      (SELECT COUNT(*) FROM proyecto WHERE estado = 'FORMULACION') as proyectos_formulacion,
      (SELECT COUNT(*) FROM meta WHERE estado = 'ACTIVO') as total_metas
  `);

  return {
    ...baseData,
    tipo_dashboard: 'PLANIFICADOR',
    titulo: 'Dashboard - Tecnico Planificador',
    descripcion: 'Panel de seguimiento de objetivos y proyectos de planificacion',
    estadisticas_planificador: planificadorStats.rows[0],
    accesos: [
      { modulo: 'Objetivos Estrategicos', descripcion: 'Creacion y edicion de objetivos estrategicos', permisos: ['crear', 'editar', 'eliminar'] },
      { modulo: 'Asociacion PND/ODS', descripcion: 'Vinculacion con Plan Nacional y ODS', permisos: ['asociar', 'consultar'] },
      { modulo: 'Proyectos de Inversion', descripcion: 'Creacion y edicion de proyectos', permisos: ['crear', 'editar'] },
      { modulo: 'Actividades POA', descripcion: 'Registro y gestion de actividades', permisos: ['registrar', 'editar'] },
      { modulo: 'Presupuestos', descripcion: 'Asignacion de presupuestos a proyectos', permisos: ['asignar'] },
      { modulo: 'Instituciones', descripcion: 'Consulta de informacion institucional', permisos: ['ver'] }
    ],
    menu_disponible: ['objetivos', 'proyectos', 'validaciones'],
    restricciones: ['No puede gestionar usuarios ni roles', 'No puede aprobar ni validar']
  };
};

// Dashboard especifico para Autoridad Validadora
const getValidadorDashboard = async (baseData: any) => {
  const validadorStats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM objetivo WHERE estado = 'EN_VALIDACION') as objetivos_pendientes_validacion,
      (SELECT COUNT(*) FROM objetivo WHERE estado = 'VALIDADO') as objetivos_validados,
      (SELECT COUNT(*) FROM objetivo WHERE estado = 'RECHAZADO') as objetivos_rechazados,
      (SELECT COUNT(*) FROM validacion WHERE tipo = 'OBJETIVO' AND estado = 'PENDIENTE') as validaciones_pendientes,
      (SELECT COALESCE(AVG(EXTRACT(DAY FROM (updated_at - created_at))), 0) 
       FROM objetivo 
       WHERE estado IN ('VALIDADO', 'RECHAZADO')) as tiempo_promedio_validacion
  `);

  return {
    ...baseData,
    tipo_dashboard: 'VALIDADOR',
    titulo: 'Dashboard - Autoridad Validadora',
    descripcion: 'Panel de validacion de objetivos estrategicos',
    estadisticas_validador: validadorStats.rows[0],
    accesos: [
      { modulo: 'Validar Objetivos', descripcion: 'Aprobar o rechazar objetivos estrategicos', permisos: ['validar', 'aprobar', 'rechazar'] },
      { modulo: 'Configuracion Institucional', descripcion: 'Consultar informacion institucional para validacion', permisos: ['consultar'] },
      { modulo: 'Alineacion PND/ODS', descripcion: 'Verificar alineacion estrategica de objetivos', permisos: ['consultar'] },
      { modulo: 'Reportes de Objetivos', descripcion: 'Acceso limitado a reportes de objetivos', permisos: ['ver_limitado', 'exportar_limitado'] }
    ],
    menu_disponible: ['validar_objetivos', 'reportes_limitados'],
    restricciones: ['No puede crear ni editar objetivos', 'No accede a proyectos de inversion', 'No gestiona usuarios ni instituciones'],
    alertas: {
      objetivos_pendientes: validadorStats.rows[0].objetivos_pendientes_validacion,
      mensaje: validadorStats.rows[0].objetivos_pendientes_validacion > 0 ? 
        `Tienes ${validadorStats.rows[0].objetivos_pendientes_validacion} objetivos pendientes de validacion` : 
        'No hay objetivos pendientes de validacion'
    }
  };
};

// Dashboard especifico para Revisor Institucional
const getRevisorDashboard = async (baseData: any) => {
  const revisorStats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM proyecto WHERE estado = 'Enviado') as proyectos_pendientes_revision,
      (SELECT COUNT(*) FROM proyecto WHERE estado = 'Aprobado') as proyectos_aprobados,
      (SELECT COUNT(*) FROM proyecto WHERE estado = 'Rechazado') as proyectos_rechazados,
      (SELECT COUNT(*) FROM presupuesto WHERE estado = 'PENDIENTE_VALIDACION') as presupuestos_pendientes
  `);

  return {
    ...baseData,
    tipo_dashboard: 'REVISOR',
    titulo: 'Dashboard - Revisor Institucional',
    descripcion: 'Panel de revision de proyectos de inversion',
    estadisticas_revisor: revisorStats.rows[0],
    accesos: [
      { modulo: 'Revisar Proyectos', descripcion: 'Aprobar o rechazar proyectos de inversion', permisos: ['revisar', 'aprobar', 'rechazar'] },
      { modulo: 'Validar Presupuestos', descripcion: 'Validacion de presupuestos asignados', permisos: ['validar_presupuesto'] },
      { modulo: 'Actividades POA', descripcion: 'Ver detalle de actividades POA', permisos: ['ver_detalle'] },
      { modulo: 'Reportes Institucionales', descripcion: 'Acceso a reportes institucionales', permisos: ['ver', 'exportar'] }
    ],
    menu_disponible: ['revisar_proyectos', 'validar_proyectos', 'reportes'],
    restricciones: ['No puede crear ni editar proyectos', 'No accede a objetivos, usuarios ni instituciones'],
    alertas: {
      proyectos_pendientes: revisorStats.rows[0].proyectos_pendientes_revision,
      presupuestos_pendientes: revisorStats.rows[0].presupuestos_pendientes,
      mensaje: revisorStats.rows[0].proyectos_pendientes_revision > 0 ? 
        `Tienes ${revisorStats.rows[0].proyectos_pendientes_revision} proyectos pendientes de revision` : 
        'No hay proyectos pendientes de revision'
    }
  };
};

// Obtener menu de navegacion basado en el rol
export const getMenuByRole = async (req: Request, res: Response) => {
  try {
    if (!(req as any).usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no autenticado'
      };
      return res.status(401).json(response);
    }

    const userRoles = (req as any).usuario.roles;
    let menu: any[] = [];

    if (userRoles.includes('ADMIN')) {
      menu = [
        { id: 'dashboard', nombre: 'Dashboard', icono: 'dashboard', ruta: '/dashboard' },
        { id: 'instituciones', nombre: 'Instituciones', icono: 'business', ruta: '/configuracion/instituciones' },
        { id: 'usuarios', nombre: 'Usuarios', icono: 'people', ruta: '/configuracion/usuarios' },
        { id: 'objetivos', nombre: 'Objetivos Estrategicos', icono: 'target', ruta: '/objetivos' },
        { id: 'proyectos', nombre: 'Proyectos de Inversion', icono: 'assignment', ruta: '/proyectos' },
        { id: 'auditoria', nombre: 'Auditoria', icono: 'history', ruta: '/auditoria' },
        { id: 'reportes', nombre: 'Reportes', icono: 'assessment', ruta: '/reportes' }
      ];
    } else if (userRoles.includes('PLANIF')) {
      menu = [
        { id: 'dashboard', nombre: 'Dashboard', icono: 'dashboard', ruta: '/dashboard' },
        { id: 'objetivos', nombre: 'Objetivos Estrategicos', icono: 'target', ruta: '/objetivos' },
        { id: 'proyectos', nombre: 'Proyectos de Inversion', icono: 'assignment', ruta: '/proyectos' },
        { id: 'instituciones', nombre: 'Consulta Instituciones', icono: 'business', ruta: '/instituciones/consulta' }
      ];
    } else if (userRoles.includes('VALIDADOR')) {
      menu = [
        { id: 'dashboard', nombre: 'Dashboard', icono: 'dashboard', ruta: '/dashboard' },
        { id: 'validar-objetivos', nombre: 'Validar Objetivos', icono: 'check_circle', ruta: '/validacion/objetivos' },
        { id: 'reportes', nombre: 'Reportes', icono: 'assessment', ruta: '/reportes' }
      ];
    } else if (userRoles.includes('REVISOR')) {
      menu = [
        { id: 'dashboard', nombre: 'Dashboard', icono: 'dashboard', ruta: '/dashboard' },
        { id: 'revisar-proyectos', nombre: 'Revisar Proyectos', icono: 'rate_review', ruta: '/revision/proyectos' },
        { id: 'reportes', nombre: 'Reportes', icono: 'assessment', ruta: '/reportes' }
      ];
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        menu,
        rol_principal: userRoles[0] || 'SIN_ROL',
        roles: userRoles
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener menu:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error interno del servidor'
    };
    res.status(500).json(response);
  }
};
