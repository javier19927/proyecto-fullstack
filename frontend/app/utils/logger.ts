// ============================================
// SISTEMA DE LOGGING PARA TRAZABILIDAD FRONTEND
// ============================================

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  action: string;
  data?: any;
  error?: any;
  userId?: number | string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Maximo numero de logs en memoria

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogEntry['level'],
    module: string,
    action: string,
    data?: any,
    error?: any
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      action,
      data,
      error,
      userId: this.getCurrentUserId()
    };

    // Agregar al array de logs
    this.logs.push(entry);
    
    // Mantener solo los ultimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    return entry;
  }

  private getCurrentUserId(): number | string | undefined {
    // Intentar obtener el ID del usuario desde localStorage o contexto
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.id || userData.userId;
      }
    } catch {
      return undefined;
    }
  }

  private formatLog(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
    const action = `${entry.action}`;
    const userId = entry.userId ? ` (Usuario: ${entry.userId})` : '';
    
    return `${prefix} ${action}${userId}`;
  }

  // ============================================
  // METODOS PUBLICOS
  // ============================================

  info(module: string, action: string, data?: any) {
    const entry = this.createLogEntry('info', module, action, data);
    console.log(this.formatLog(entry), data ? { data } : '');
  }

  warn(module: string, action: string, data?: any) {
    const entry = this.createLogEntry('warn', module, action, data);
    console.warn(this.formatLog(entry), data ? { data } : '');
  }

  error(module: string, action: string, error?: any, data?: any) {
    const entry = this.createLogEntry('error', module, action, data, error);
    console.error(this.formatLog(entry), error ? { error, data } : '');
  }

  debug(module: string, action: string, data?: any) {
    const entry = this.createLogEntry('debug', module, action, data);
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog(entry), data ? { data } : '');
    }
  }

  // ============================================
  // METODOS ESPECIFICOS PARA MODULOS
  // ============================================

  // Auditoria de acciones de usuario
  userAction(action: string, module: string, data?: any) {
    this.info(module, `Accion de usuario: ${action}`, data);
  }

  // Errores de API
  apiError(endpoint: string, error: any, requestData?: any) {
    this.error('API', `Error en ${endpoint}`, error, requestData);
  }

  // Exito de operaciones
  operationSuccess(module: string, operation: string, data?: any) {
    this.info(module, `✅ ${operation} exitoso`, data);
  }

  // Operaciones de autenticacion
  authEvent(action: string, data?: any) {
    this.info('Auth', action, data);
  }

  // Navegacion
  navigation(from: string, to: string) {
    this.info('Navigation', `${from} → ${to}`);
  }

  // ============================================
  // UTILIDADES
  // ============================================

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByModule(module: string): LogEntry[] {
    return this.logs.filter(log => log.module === module);
  }

  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === 'error');
  }

  clearLogs() {
    this.logs = [];
    this.info('Logger', 'Logs limpiados');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// ============================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================
export const logger = Logger.getInstance();

// ============================================
// HELPERS PARA USO COMUN
// ============================================

// Para objetivos
export const logObjetivos = {
  crear: (data: any) => logger.userAction('Crear objetivo', 'Objetivos', data),
  editar: (id: string, data: any) => logger.userAction(`Editar objetivo ${id}`, 'Objetivos', data),
  validar: (id: string, estado: string) => logger.userAction(`Validar objetivo ${id}: ${estado}`, 'Objetivos', { id, estado }),
  consultar: () => logger.userAction('Consultar objetivos', 'Objetivos'),
  filtrar: (filtros: any) => logger.userAction('Filtrar objetivos', 'Objetivos', filtros),
  error: (action: string, error: any) => logger.apiError(`/api/objetivos/${action}`, error)
};

// Para proyectos
export const logProyectos = {
  crear: (data: any) => logger.userAction('Crear proyecto', 'Proyectos', data),
  editar: (id: string, data: any) => logger.userAction(`Editar proyecto ${id}`, 'Proyectos', data),
  consultar: () => logger.userAction('Consultar proyectos', 'Proyectos'),
  error: (action: string, error: any) => logger.apiError(`/api/proyectos/${action}`, error)
};

// Para configuracion
export const logConfiguracion = {
  verInstituciones: () => logger.userAction('Ver instituciones', 'Configuracion'),
  crearUsuario: (data: any) => logger.userAction('Crear usuario', 'Configuracion', data),
  editarUsuario: (id: string, data: any) => logger.userAction(`Editar usuario ${id}`, 'Configuracion', data),
  error: (action: string, error: any) => logger.apiError(`/api/configuracion/${action}`, error)
};

export default logger;
