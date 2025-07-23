// ================================================================
// UTILIDAD DE LOGGING
// Sistema centralizado de registros y logs
// ================================================================

export interface LogData {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      return `${baseMessage} | Data: ${JSON.stringify(data)}`;
    }
    
    return baseMessage;
  }

  info(message: string, data?: LogData): void {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: LogData): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, error?: Error | LogData): void {
    if (error instanceof Error) {
      console.error(this.formatMessage('error', message, { 
        error: error.message, 
        stack: error.stack 
      }));
    } else {
      console.error(this.formatMessage('error', message, error));
    }
  }

  debug(message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

export default new Logger();
