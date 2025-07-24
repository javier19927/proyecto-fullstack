// ================================================================
// SISTEMA DE PERMISOS BASADO EN ROLES
// Mapeo de roles a permisos especificos por modulo
// ================================================================

export interface PermissionModule {
  configuracion_institucional: string[];
  gestion_objetivos: string[];
  proyectos_inversion: string[];
}

// Definicion de permisos por modulo
export const PERMISOS = {
  // MODULO 1: Configuracion Institucional
  CONFIGURACION_INSTITUCIONAL: {
    // Gestion de Instituciones
    REGISTRAR_INSTITUCION: 'config.institucion.crear',
    EDITAR_INSTITUCION: 'config.institucion.editar',
    ACTIVAR_INSTITUCION: 'config.institucion.activar',
    INACTIVAR_INSTITUCION: 'config.institucion.inactivar',
    VER_INSTITUCIONES: 'config.institucion.ver',
    
    // Gestion de Usuarios
    CREAR_USUARIO: 'config.usuario.crear',
    MODIFICAR_USUARIO: 'config.usuario.modificar',
    ASIGNAR_ROL: 'config.usuario.asignar_rol',
    CAMBIAR_PASSWORD: 'config.usuario.cambiar_password',
    ACTIVAR_USUARIO: 'config.usuario.activar',
    INACTIVAR_USUARIO: 'config.usuario.inactivar',
    VER_USUARIOS: 'config.usuario.ver',
    
    // Gestion de Roles
    CREAR_ROL: 'config.rol.crear',
    ASIGNAR_PERMISO: 'config.rol.asignar_permiso',
    VER_ROLES: 'config.rol.ver',
    
    // Configuracion de Jerarquias
    DEFINIR_JERARQUIA: 'config.jerarquia.definir',
    ASIGNAR_RELACIONES: 'config.jerarquia.asignar_relaciones',
    VER_JERARQUIAS: 'config.jerarquia.ver'
  },
  
  // MODULO 2: Gestion de Objetivos Estrategicos
  GESTION_OBJETIVOS: {
    // Objetivos
    CREAR_OBJETIVO: 'objetivos.objetivo.crear',
    EDITAR_OBJETIVO: 'objetivos.objetivo.editar',
    VER_OBJETIVOS: 'objetivos.objetivo.ver',
    ELIMINAR_OBJETIVO: 'objetivos.objetivo.eliminar',
    
    // Metas e Indicadores
    REGISTRAR_META: 'objetivos.meta.registrar',
    AGREGAR_INDICADOR: 'objetivos.indicador.agregar',
    EDITAR_INDICADOR: 'objetivos.indicador.editar',
    VER_INDICADORES: 'objetivos.indicador.ver',
    
    // Validacion
    VALIDAR_OBJETIVO: 'objetivos.validacion.validar',
    VER_VALIDACIONES: 'objetivos.validacion.ver',
    
    // Consulta PND/ODS
    CONSULTAR_PND: 'objetivos.pnd.consultar',
    CONSULTAR_ODS: 'objetivos.ods.consultar'
  },
  
  // MODULO 3: Proyectos de Inversion
  PROYECTOS_INVERSION: {
    // Proyectos
    CREAR_PROYECTO: 'proyectos.proyecto.crear',
    ELIMINAR_PROYECTO: 'proyectos.proyecto.eliminar',
    VER_PROYECTOS: 'proyectos.proyecto.ver',
    EDITAR_PROYECTO: 'proyectos.proyecto.editar',
    
    // Actividades
    REGISTRAR_ACTIVIDAD: 'proyectos.actividad.registrar',
    ACTUALIZAR_ACTIVIDAD: 'proyectos.actividad.actualizar',
    VER_ACTIVIDADES: 'proyectos.actividad.ver',
    
    // Presupuesto
    ASIGNAR_PRESUPUESTO: 'proyectos.presupuesto.asignar',
    REVISAR_PRESUPUESTO: 'proyectos.presupuesto.revisar',
    VER_PRESUPUESTO: 'proyectos.presupuesto.ver',
    
    // Validacion de Proyectos
    VALIDAR_PROYECTO: 'proyectos.validacion.validar',
    VER_VALIDACIONES_PROYECTO: 'proyectos.validacion.ver'
  },
  
  // MODULO 4: Reportes y Analytics
  REPORTES: {
    // Consultar reportes - Ver listados con datos de objetivos, proyectos, metas, indicadores, presupuestos
    CONSULTAR_REPORTES: 'reportes.consultar',
    
    // Filtrar reportes - Aplicar filtros por institución, estado, año, tipo de meta/indicador, etc.
    FILTRAR_REPORTES: 'reportes.filtrar',
    
    // Exportar reportes - Descargar en PDF o Excel los reportes generados
    EXPORTAR_REPORTES: 'reportes.exportar',
    
    // Generar reporte técnico de objetivos - Mostrar objetivos con sus alineaciones, metas, indicadores y estado de validación
    GENERAR_REPORTE_OBJETIVOS: 'reportes.objetivos.generar',
    
    // Generar reporte técnico de proyectos - Mostrar proyectos con presupuesto, actividades y estado de validación
    GENERAR_REPORTE_PROYECTOS: 'reportes.proyectos.generar',
    
    // Visualizar resumen presupuestario - Mostrar total de presupuestos, monto aprobado y estado de ejecución
    VISUALIZAR_RESUMEN_PRESUPUESTARIO: 'reportes.presupuesto.resumen',
    
    // Reporte dinámico comparativo - Comparar metas planificadas vs ejecutadas, estado por año/institución
    REPORTE_DINAMICO_COMPARATIVO: 'reportes.dinamico.comparativo'
  },
  
  // AUDITORIA Y BITACORA (Transversal)
  AUDITORIA: {
    REGISTRAR_AUDITORIA: 'auditoria.registrar',
    CONSULTAR_ACCION: 'auditoria.consultar',
    VER_BITACORA: 'auditoria.bitacora.ver',
    REGISTRAR_EVENTO: 'auditoria.evento.registrar'
  }
};

// Mapeo de roles a permisos
export const ROLES_PERMISOS: Record<string, string[]> = {
  // ADMINISTRADOR: Todos los reportes - Exportación completa
  'ADMIN': [
    // Configuracion Institucional (completo)
    ...Object.values(PERMISOS.CONFIGURACION_INSTITUCIONAL),
    
    // Gestion de Objetivos (todo EXCEPTO validar - no puede aprobar/rechazar)
    PERMISOS.GESTION_OBJETIVOS.CREAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.EDITAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS,
    PERMISOS.GESTION_OBJETIVOS.ELIMINAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.REGISTRAR_META,
    PERMISOS.GESTION_OBJETIVOS.AGREGAR_INDICADOR,
    PERMISOS.GESTION_OBJETIVOS.EDITAR_INDICADOR,
    PERMISOS.GESTION_OBJETIVOS.VER_INDICADORES,
    PERMISOS.GESTION_OBJETIVOS.VER_VALIDACIONES,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_PND,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_ODS,
    // ❌ VALIDAR_OBJETIVO excluido - no puede aprobar/rechazar objetivos
    
    // Proyectos (completo EXCEPTO validacion segun matriz)
    PERMISOS.PROYECTOS_INVERSION.CREAR_PROYECTO,
    PERMISOS.PROYECTOS_INVERSION.ELIMINAR_PROYECTO,
    PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS,
    PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO,
    PERMISOS.PROYECTOS_INVERSION.REGISTRAR_ACTIVIDAD,
    PERMISOS.PROYECTOS_INVERSION.ACTUALIZAR_ACTIVIDAD,
    PERMISOS.PROYECTOS_INVERSION.VER_ACTIVIDADES,
    PERMISOS.PROYECTOS_INVERSION.ASIGNAR_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.REVISAR_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.VER_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.VER_VALIDACIONES_PROYECTO,
    // ❌ VALIDAR_PROYECTO excluido segun matriz
    
    // Reportes (todos los reportes - exportación completa)
    PERMISOS.REPORTES.CONSULTAR_REPORTES,
    PERMISOS.REPORTES.FILTRAR_REPORTES,
    PERMISOS.REPORTES.EXPORTAR_REPORTES,
    PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS,
    PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS,
    PERMISOS.REPORTES.VISUALIZAR_RESUMEN_PRESUPUESTARIO,
    PERMISOS.REPORTES.REPORTE_DINAMICO_COMPARATIVO,
    
    // Auditoria (completo)
    ...Object.values(PERMISOS.AUDITORIA)
  ],
  
  // TÉCNICO: Acceso completo a objetivos y proyectos + todos los reportes
  'TECNICO': [
    // Configuracion Institucional (solo consulta)
    PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_INSTITUCIONES,
    PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_USUARIOS,
    PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_ROLES,
    PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_JERARQUIAS,
    
    // Gestion de Objetivos (completo EXCEPTO validar)
    PERMISOS.GESTION_OBJETIVOS.CREAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.EDITAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS,
    PERMISOS.GESTION_OBJETIVOS.ELIMINAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.REGISTRAR_META,
    PERMISOS.GESTION_OBJETIVOS.AGREGAR_INDICADOR,
    PERMISOS.GESTION_OBJETIVOS.EDITAR_INDICADOR,
    PERMISOS.GESTION_OBJETIVOS.VER_INDICADORES,
    PERMISOS.GESTION_OBJETIVOS.VER_VALIDACIONES,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_PND,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_ODS,
    // ❌ VALIDAR_OBJETIVO excluido
    
    // Proyectos (completo EXCEPTO validar)
    PERMISOS.PROYECTOS_INVERSION.CREAR_PROYECTO,
    PERMISOS.PROYECTOS_INVERSION.ELIMINAR_PROYECTO,
    PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS,
    PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO,
    PERMISOS.PROYECTOS_INVERSION.REGISTRAR_ACTIVIDAD,
    PERMISOS.PROYECTOS_INVERSION.ACTUALIZAR_ACTIVIDAD,
    PERMISOS.PROYECTOS_INVERSION.VER_ACTIVIDADES,
    PERMISOS.PROYECTOS_INVERSION.ASIGNAR_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.REVISAR_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.VER_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.VER_VALIDACIONES_PROYECTO,
    // ❌ VALIDAR_PROYECTO excluido
    
    // Reportes (todos los reportes - exportación completa según imagen)
    PERMISOS.REPORTES.CONSULTAR_REPORTES,
    PERMISOS.REPORTES.FILTRAR_REPORTES,
    PERMISOS.REPORTES.EXPORTAR_REPORTES,
    PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS,
    PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS,
    PERMISOS.REPORTES.VISUALIZAR_RESUMEN_PRESUPUESTARIO,
    PERMISOS.REPORTES.REPORTE_DINAMICO_COMPARATIVO,
    
    // Auditoria
    PERMISOS.AUDITORIA.REGISTRAR_EVENTO,
    PERMISOS.AUDITORIA.VER_BITACORA
  ],

  // TÉCNICO PLANIFICADOR: Todos los reportes - Exportación completa
  'PLANIF': [
    // Configuracion Institucional (solo consulta segun matriz actualizada)
    PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_INSTITUCIONES,
    PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_USUARIOS,
    PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_ROLES,
    PERMISOS.CONFIGURACION_INSTITUCIONAL.VER_JERARQUIAS,
    
    // Gestion de Objetivos (todo EXCEPTO validar - no puede aprobar/rechazar)
    PERMISOS.GESTION_OBJETIVOS.CREAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.EDITAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS,
    PERMISOS.GESTION_OBJETIVOS.ELIMINAR_OBJETIVO,
    PERMISOS.GESTION_OBJETIVOS.REGISTRAR_META,
    PERMISOS.GESTION_OBJETIVOS.AGREGAR_INDICADOR,
    PERMISOS.GESTION_OBJETIVOS.EDITAR_INDICADOR,
    PERMISOS.GESTION_OBJETIVOS.VER_INDICADORES,
    PERMISOS.GESTION_OBJETIVOS.VER_VALIDACIONES,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_PND,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_ODS,
    // ❌ VALIDAR_OBJETIVO excluido - no puede aprobar/rechazar objetivos
    
    // Proyectos (crear y gestionar, SIN validar)
    PERMISOS.PROYECTOS_INVERSION.CREAR_PROYECTO,
    PERMISOS.PROYECTOS_INVERSION.ELIMINAR_PROYECTO, // Puede eliminar proyectos no validados
    PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS,
    PERMISOS.PROYECTOS_INVERSION.EDITAR_PROYECTO,
    PERMISOS.PROYECTOS_INVERSION.REGISTRAR_ACTIVIDAD,
    PERMISOS.PROYECTOS_INVERSION.ACTUALIZAR_ACTIVIDAD,
    PERMISOS.PROYECTOS_INVERSION.VER_ACTIVIDADES,
    PERMISOS.PROYECTOS_INVERSION.ASIGNAR_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.REVISAR_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.VER_PRESUPUESTO,
    // ❌ VALIDAR_PROYECTO excluido segun matriz
    
    // Reportes (todos los reportes - exportación completa)
    PERMISOS.REPORTES.CONSULTAR_REPORTES,
    PERMISOS.REPORTES.FILTRAR_REPORTES,
    PERMISOS.REPORTES.EXPORTAR_REPORTES,
    PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS,
    PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS,
    PERMISOS.REPORTES.VISUALIZAR_RESUMEN_PRESUPUESTARIO,
    PERMISOS.REPORTES.REPORTE_DINAMICO_COMPARATIVO,
    
    // Auditoria (registrar eventos)
    PERMISOS.AUDITORIA.REGISTRAR_EVENTO,
    PERMISOS.AUDITORIA.VER_BITACORA
  ],
  
  // AUTORIDAD VALIDADORA: Solo de objetivos estratégicos - Exportación limitada
  'VALID': [
    // ❌ Configuracion Institucional (SIN ACCESO - completamente bloqueado)
    
    // ✅ Objetivos (validacion SOLAMENTE)
    PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS,
    PERMISOS.GESTION_OBJETIVOS.VER_INDICADORES,
    PERMISOS.GESTION_OBJETIVOS.VALIDAR_OBJETIVO,        // Aprobar o rechazar objetivos
    PERMISOS.GESTION_OBJETIVOS.VER_VALIDACIONES,        // Agregar comentarios de validación
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_PND,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_ODS,
    // ❌ CREAR_OBJETIVO, EDITAR_OBJETIVO excluidos - no puede crear/editar objetivos
    
    // ❌ Proyectos (SIN ACCESO - completamente bloqueado según matriz)
    
    // ✅ Reportes (solo de objetivos estratégicos - exportación limitada según imagen)
    PERMISOS.REPORTES.CONSULTAR_REPORTES,         // Solo para objetivos
    PERMISOS.REPORTES.FILTRAR_REPORTES,           // Solo para objetivos
    PERMISOS.REPORTES.EXPORTAR_REPORTES,          // Exportación limitada
    PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS,  // Solo reportes de objetivos
    // ❌ GENERAR_REPORTE_PROYECTOS excluido - no tiene acceso a proyectos
    // ❌ VISUALIZAR_RESUMEN_PRESUPUESTARIO excluido - no tiene acceso a estado presupuestario general
    // ❌ REPORTE_DINAMICO_COMPARATIVO excluido - acceso limitado según imagen
    
    // Auditoria
    PERMISOS.AUDITORIA.REGISTRAR_AUDITORIA,
    PERMISOS.AUDITORIA.VER_BITACORA
  ],
  
  // REVISOR INSTITUCIONAL: Solo de proyectos de inversión - Exportación limitada
  'REVISOR': [
    // ❌ Configuracion Institucional (SIN ACCESO - completamente bloqueado)
    
    // ❌ Objetivos (SIN ACCESO - completamente bloqueado según matriz)
    
    // ✅ Proyectos (SOLO: consultar, aprobar/rechazar, ver actividades y presupuesto)
    PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS,           // Consultar proyectos
    PERMISOS.PROYECTOS_INVERSION.VER_ACTIVIDADES,         // Ver actividades
    PERMISOS.PROYECTOS_INVERSION.VER_PRESUPUESTO,         // Ver presupuesto
    PERMISOS.PROYECTOS_INVERSION.VALIDAR_PROYECTO,        // Aprobar o rechazar proyectos
    PERMISOS.PROYECTOS_INVERSION.VER_VALIDACIONES_PROYECTO, // Ver validaciones
    // ❌ EDITAR_PROYECTO excluido - no puede editar proyectos
    // ❌ ACTUALIZAR_ACTIVIDAD excluido - no puede actualizar actividades
    
    // ✅ Reportes (solo de proyectos de inversión - exportación limitada)
    PERMISOS.REPORTES.CONSULTAR_REPORTES,         // Solo para proyectos
    PERMISOS.REPORTES.FILTRAR_REPORTES,           // Solo para proyectos
    PERMISOS.REPORTES.EXPORTAR_REPORTES,          // Exportación limitada
    PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS,  // Solo reportes de proyectos
    // ❌ GENERAR_REPORTE_OBJETIVOS excluido - no tiene acceso a objetivos
    // ❌ VISUALIZAR_RESUMEN_PRESUPUESTARIO excluido - acceso limitado
    // ❌ REPORTE_DINAMICO_COMPARATIVO excluido - acceso limitado
    
    // Auditoria (solo consulta básica)
    PERMISOS.AUDITORIA.VER_BITACORA
  ],
  
  // AUDITOR: Todos los reportes + trazabilidad y auditoría - Exportación completa
  'AUDITOR': [
    // ❌ Configuracion Institucional (SIN ACCESO)
    
    // ✅ Objetivos (solo lectura + validación para auditoría)
    PERMISOS.GESTION_OBJETIVOS.VER_OBJETIVOS,
    PERMISOS.GESTION_OBJETIVOS.VER_INDICADORES,
    PERMISOS.GESTION_OBJETIVOS.VER_VALIDACIONES,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_PND,
    PERMISOS.GESTION_OBJETIVOS.CONSULTAR_ODS,
    
    // ✅ Proyectos (solo lectura + validación para auditoría)
    PERMISOS.PROYECTOS_INVERSION.VER_PROYECTOS,
    PERMISOS.PROYECTOS_INVERSION.VER_ACTIVIDADES,
    PERMISOS.PROYECTOS_INVERSION.VER_PRESUPUESTO,
    PERMISOS.PROYECTOS_INVERSION.VER_VALIDACIONES_PROYECTO,
    
    // ✅ Reportes (todos los reportes + trazabilidad - exportación completa)
    PERMISOS.REPORTES.CONSULTAR_REPORTES,
    PERMISOS.REPORTES.FILTRAR_REPORTES,
    PERMISOS.REPORTES.EXPORTAR_REPORTES,
    PERMISOS.REPORTES.GENERAR_REPORTE_OBJETIVOS,
    PERMISOS.REPORTES.GENERAR_REPORTE_PROYECTOS,
    PERMISOS.REPORTES.VISUALIZAR_RESUMEN_PRESUPUESTARIO,
    PERMISOS.REPORTES.REPORTE_DINAMICO_COMPARATIVO,
    
    // ✅ Auditoria (completa)
    ...Object.values(PERMISOS.AUDITORIA)
  ],
};

// Funcion para verificar si un usuario tiene un permiso especifico
export const tienePermiso = (rolesUsuario: string[], permisoRequerido: string): boolean => {
  console.log('🔍 [PERMISSION-CHECK] Verificando permiso:', {
    rolesUsuario,
    permisoRequerido
  });

  // Los administradores tienen todos los permisos
  if (rolesUsuario.includes('ADMIN')) {
    console.log('✅ [PERMISSION-CHECK] Usuario es ADMIN - acceso concedido');
    return true;
  }
  
  // Verificar si alguno de los roles del usuario tiene el permiso
  const resultado = rolesUsuario.some(rol => {
    const permisosRol = ROLES_PERMISOS[rol] || [];
    console.log(`🔍 [PERMISSION-CHECK] Verificando rol "${rol}":`, {
      permisosRol: permisosRol.length > 0 ? permisosRol : 'Sin permisos',
      tienePermiso: permisosRol.includes(permisoRequerido)
    });
    return permisosRol.includes(permisoRequerido);
  });

  console.log('🔍 [PERMISSION-CHECK] Resultado final:', resultado);
  return resultado;
};

// Funcion para obtener todos los permisos de un usuario
export const obtenerPermisosUsuario = (rolesUsuario: string[]): string[] => {
  const permisos = new Set<string>();
  
  rolesUsuario.forEach(rol => {
    const permisosRol = ROLES_PERMISOS[rol] || [];
    permisosRol.forEach(permiso => permisos.add(permiso));
  });
  
  return Array.from(permisos);
};

// Funcion para verificar acceso a modulo especifico
export const tieneAccesoModulo = (rolesUsuario: string[], modulo: keyof typeof PERMISOS): boolean => {
  const permisosModulo = Object.values(PERMISOS[modulo]);
  return rolesUsuario.some(rol => {
    const permisosRol = ROLES_PERMISOS[rol] || [];
    return permisosModulo.some(permiso => permisosRol.includes(permiso));
  });
};
