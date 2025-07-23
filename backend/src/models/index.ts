// Modelos TypeScript basados en el diagrama de clases

// ============================================
// MODULO 1: CONFIGURACION INSTITUCIONAL
// ============================================

export interface Institucion {
  id: number;
  codigo: string; // Atributo requerido segun especificacion
  nombre: string; // Atributo requerido segun especificacion
  tipo: string; // Atributo requerido segun especificacion (PUBLICA, PRIVADA, ONG, etc.)
  jerarquia: number; // Atributo requerido segun especificacion - Nivel jerarquico
  responsable: number; // Atributo requerido segun especificacion - ID del usuario responsable
  sigla?: string;
  mision?: string;
  vision?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  web?: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones segun especificacion
  usuario_responsable?: Usuario; // Tiene relacion con Usuario (responsable de la institucion)
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string; // Atributo requerido segun especificacion
  nivel: number; // Atributo requerido segun especificacion - Nivel del rol
  codigo: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones segun especificacion
  // 1 Rol puede ser asignado a muchos Usuarios (relacion 1:N)
}

export interface Usuario {
  id: number;
  correo: string; // Atributo requerido segun especificacion
  nombreCompleto: string; // Atributo requerido segun especificacion  
  rol: number; // ID del rol - atributo requerido segun especificacion
  password: string; // Atributo requerido segun especificacion
  estado: boolean; // Atributo requerido segun especificacion
  codigo?: string;
  apellido?: string;
  telefono?: string;
  documento?: string;
  cargo?: string;
  institucion_id?: number;
  ultimo_acceso?: string;
  created_at: string;
  updated_at: string;
  // Relaciones segun especificacion
  institucion?: Institucion; // Se vincula a Institucion
  rol_obj?: Rol; // Se vincula a Rol
  auditorias?: Auditoria[]; // Se vincula a Auditoria
}

export interface UsuarioRol {
  id: number;
  usuario_id: number;
  rol_id: number;
  asignado_por?: number;
  fecha_asignacion: string;
  estado: boolean;
}

export interface PlanInstitucional {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: string; // PND, PDD, POA, etc.
  periodo_inicio: string;
  periodo_fin: string;
  estado: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';
  version?: string;
  institucion_id?: number;
  creado_por?: number;
  aprobado_por?: number;
  fecha_aprobacion?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  institucion?: Institucion;
  creador?: Usuario;
  aprobador?: Usuario;
}

// ============================================
// MODULO 2: GESTION DE OBJETIVOS ESTRATEGICOS
// ============================================

export interface ODS {
  id: number;
  idODS: number; // Campo requerido segun especificacion
  numero?: number;
  nombre: string; // Campo requerido segun especificacion
  titulo?: string;
  descripcion?: string;
  color?: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

// Clase PND segun especificacion
export interface PND {
  id: number;
  idPND: string; // Campo requerido segun especificacion
  numero?: number;
  nombre: string; // Campo requerido segun especificacion
  pilar?: string;
  titulo?: string;
  descripcion?: string;
  periodo_inicio?: string;
  periodo_fin?: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

// Clase Presupuesto segun especificacion
export interface Presupuesto {
  id: number;
  // Atributos segun especificacion exacta
  idPresupuesto: string; // ✅ Segun especificacion
  anio: number; // ✅ Segun especificacion
  monto: number; // ✅ Segun especificacion
  clasificacionGasto?: string; // ✅ Segun especificacion (opcional, si se categoriza)
  // Atributos adicionales del sistema
  proyecto_id?: number;
  tipo?: 'INICIAL' | 'MODIFICACION' | 'AMPLIACION';
  estado?: string;
  created_at: string;
  updated_at: string;
  // Relaciones segun especificacion: "Pertenece a un Proyecto"
  proyecto?: Proyecto; // ✅ "Pertenece a un Proyecto"
}

// Clase Auditoria segun especificacion - Para trazabilidad
// Metodos: registrarAuditoria(), consultarAccion()
export interface Auditoria {
  id: number;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  tabla: string;
  registro_id: number;
  usuario_id?: number;
  fecha_accion: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Relaciones segun especificacion
  usuario?: Usuario; // Se vincula a Usuario
}

// Clase Bitacora segun especificacion - Para trazabilidad
// Metodos: registrarEvento(), consultarAccion()
export interface Bitacora {
  id: number;
  evento: string;
  descripcion: string;
  usuario_id?: number;
  modulo: string;
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  fecha_evento: string;
  ip_address?: string;
  detalles?: any;
  created_at: string;
  // Relaciones segun especificacion
  usuario?: Usuario; // Se vincula a Usuario
}

export interface Objetivo {
  id: number;
  codigo?: string;
  nombre: string; // Segun especificacion
  descripcion: string; // Requerido segun especificacion
  estado: 'BORRADOR' | 'EN_VALIDACION' | 'APROBADO' | 'RECHAZADO' | 'ACTIVO' | 'INACTIVO'; // Segun especificacion
  fechaRegistro?: string; // Segun especificacion
  tipo?: 'ESTRATEGICO' | 'ESPECIFICO' | 'OPERATIVO' | 'TACTICO';
  nivel?: number;
  area_responsable?: string; // Nuevo campo segun requerimientos
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA'; // Nuevo campo segun requerimientos
  objetivo_padre_id?: number;
  plan_institucional_id?: number;
  pnd_id?: number; // Asociacion con PND segun especificacion
  ods_id?: number;
  responsable_id?: number;
  porcentaje_avance?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  presupuesto?: number;
  observaciones?: string; // Para comentarios de validacion
  created_at: string;
  updated_at: string;
  // Relaciones segun especificacion
  objetivo_padre?: Objetivo;
  objetivos_hijos?: Objetivo[];
  plan_institucional?: PlanInstitucional;
  pnd?: PND; // Segun especificacion
  ods?: ODS;
  responsable?: Usuario;
  metas?: Meta[];
  validaciones?: Validacion[];
}

export interface Meta {
  id: number;
  codigo?: string;
  descripcion: string; // Requerido segun especificacion
  estado: string; // Segun especificacion
  valor_inicial?: number;
  valor_meta?: number;
  valor_actual?: number;
  unidad_medida?: string;
  periodicidad?: 'ANUAL' | 'SEMESTRAL' | 'TRIMESTRAL' | 'MENSUAL';
  objetivo_id?: number;
  responsable_id?: number;
  created_at: string;
  updated_at: string;
  // Relaciones segun especificacion
  objetivo?: Objetivo;
  responsable?: Usuario;
  indicadores?: Indicador[];
}

export interface Indicador {
  id: number;
  idIndicador: string; // Campo requerido segun especificacion
  codigo?: string;
  nombre: string; // Campo requerido segun especificacion
  unidadMedida: string; // Campo requerido segun especificacion
  descripcion?: string;
  formula?: string;
  tipo?: 'EFICACIA' | 'EFICIENCIA' | 'CALIDAD' | 'IMPACTO';
  frecuencia_medicion?: string;
  meta_id?: number;
  responsable_id?: number;
  estado: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  meta?: Meta;
  responsable?: Usuario;
}

// ============================================
// MODULO 3: PROYECTOS DE INVERSION
// ============================================

export interface Proyecto {
  id: number;
  codigo?: string;
  nombre?: string;
  // Atributos segun especificacion exacta
  descripcion: string; // ✅ Requerido segun especificacion
  fechaInicio: Date; // ✅ Segun especificacion (Date)
  fechaFin: Date; // ✅ Segun especificacion (Date)
  monto: number; // ✅ Segun especificacion
  estado: string; // ✅ Segun especificacion ("Borrador", "Enviado", "Aprobado", "Rechazado")
  // Atributos adicionales del sistema
  tipo?: 'INVERSION' | 'FUNCIONAMIENTO';
  duracion_meses?: number;
  presupuesto_total?: number;
  presupuesto_ejecutado?: number;
  porcentaje_avance?: number;
  objetivo_id?: number;
  responsable_id?: number;
  supervisor_id?: number;
  institucion_id?: number;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  ubicacion_geografica?: string;
  beneficiarios_directos?: number;
  beneficiarios_indirectos?: number;
  created_at: string;
  updated_at: string;
  // Relaciones segun especificacion: "Tiene muchas Actividad", "Tiene un Presupuesto", "Tiene una o varias Validacion"
  objetivo?: Objetivo;
  responsable?: Usuario;
  supervisor?: Usuario;
  institucion?: Institucion;
  actividades?: Actividad[]; // ✅ "Tiene muchas Actividad"
  presupuesto?: Presupuesto; // ✅ "Tiene un Presupuesto" (singular segun spec)
  presupuestos?: Presupuesto[]; // Para casos de multiples presupuestos
  validaciones?: Validacion[]; // ✅ "Tiene una o varias Validacion"
}

export interface Actividad {
  id: number;
  // Atributos segun especificacion exacta
  idActividad: string; // ✅ Segun especificacion
  nombreActividad: string; // ✅ Segun especificacion
  fechaProgramada: Date; // ✅ Segun especificacion (Date)
  responsable: string; // ✅ Segun especificacion (opcional segun tu diseno)
  // Atributos adicionales del sistema
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo?: 'PRINCIPAL' | 'SECUNDARIA';
  estado?: string;
  fecha_inicio_planificada?: string;
  fecha_fin_planificada?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  porcentaje_avance?: number;
  presupuesto?: number;
  presupuesto_ejecutado?: number;
  proyecto_id?: number;
  actividad_padre_id?: number;
  responsable_id?: number;
  created_at: string;
  updated_at: string;
  // Relaciones segun especificacion: "Pertenece a un Proyecto", "Puede estar asociada a metas o indicadores"
  proyecto?: Proyecto; // ✅ "Pertenece a un Proyecto"
  actividad_padre?: Actividad;
  actividades_hijas?: Actividad[];
  responsable_usuario?: Usuario;
  metas?: Meta[]; // ✅ "Puede estar asociada a metas o indicadores"
  indicadores?: Indicador[]; // ✅ "Puede estar asociada a metas o indicadores"
}

// ============================================
// MODULOS TRANSVERSALES
// ============================================

export interface Validacion {
  id: number;
  // Atributos segun especificacion exacta
  idValidacion?: string; // ✅ Segun especificacion
  estado: string; // ✅ Segun especificacion ("Aprobado", "Rechazado")
  comentario: string; // ✅ Segun especificacion
  fecha: Date; // ✅ Segun especificacion (Date)
  usuarioValidador: string; // ✅ Segun especificacion
  // Atributos adicionales del sistema (manteniendo compatibilidad)
  comentarios?: string; // Campo requerido segun especificacion anterior
  usuarioValida?: number; // Campo requerido segun especificacion anterior (ID del usuario que valida)
  tipo_validacion?: 'TECNICA' | 'FINANCIERA' | 'JURIDICA';
  entidad_tipo: string;
  entidad_id: number;
  validador_id?: number;
  fecha_validacion?: string;
  observaciones?: string;
  created_at: string;
  // Relaciones segun especificacion: "Asociada a uno o varios Proyecto"
  validador?: Usuario;
  usuario_validador?: Usuario;
  proyectos?: Proyecto[]; // ✅ "Asociada a uno o varios Proyecto"
}

// ============================================
// DTOs PARA REQUESTS/RESPONSES
// ============================================

export interface CreateInstitucionDTO {
  codigo: string;
  nombre: string;
  sigla?: string;
  mision?: string;
  vision?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  web?: string;
}

export interface CreateUsuarioDTO {
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  documento?: string;
  cargo?: string;
  password: string;
  institucion_id?: number;
  roles: number[];
}

export interface CreateObjetivoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'ESTRATEGICO' | 'ESPECIFICO' | 'OPERATIVO' | 'TACTICO';
  nivel?: number;
  area_responsable?: string;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  objetivo_padre_id?: number;
  plan_institucional_id?: number;
  pnd_id?: number;
  ods_id?: number;
  responsable_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  presupuesto?: number;
}

export interface CreateObjetivoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'ESTRATEGICO' | 'ESPECIFICO' | 'OPERATIVO' | 'TACTICO';
  nivel?: number;
  area_responsable?: string;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  objetivo_padre_id?: number;
  plan_institucional_id?: number;
  pnd_id?: number;
  ods_id?: number;
  responsable_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  presupuesto?: number;
}

export interface CreateProyectoDTO {
  codigo: string;
  nombre: string;
  descripcion: string; // Cambiado de opcional a requerido
  tipo?: 'INVERSION' | 'FUNCIONAMIENTO';
  fecha_inicio: string; // Cambiado de opcional a requerido
  fecha_fin: string; // Cambiado de opcional a requerido
  duracion_meses?: number;
  presupuesto_total?: number;
  monto?: number; // Campo anadido segun especificacion Modulo 3
  objetivo_id?: number;
  responsable_id?: number;
  supervisor_id?: number;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  ubicacion_geografica?: string;
  beneficiarios_directos?: number;
  beneficiarios_indirectos?: number;
}

// ============================================
// TIPOS DE RESPUESTA DE LA API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// TIPOS PARA FILTROS Y BUSQUEDAS
// ============================================

export interface ObjetivoFilter {
  tipo?: string;
  estado?: string;
  plan_institucional_id?: number;
  responsable_id?: number;
  ods_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface ProyectoFilter {
  estado?: string;
  tipo?: string;
  responsable_id?: number;
  institucion_id?: number;
  objetivo_id?: number;
  prioridad?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}
