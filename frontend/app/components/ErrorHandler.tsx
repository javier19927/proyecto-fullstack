'use client';

import { useEffect, useState } from 'react';

interface ErrorHandlerProps {
  error?: string | null;
  onRetry?: () => void;
  type?: 'network' | 'permission' | 'data' | 'general';
  showIcon?: boolean;
  compact?: boolean;
}

const ErrorHandler = ({ 
  error, 
  onRetry, 
  type = 'general', 
  showIcon = true, 
  compact = false 
}: ErrorHandlerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Auto hide after 5 seconds for non-critical errors
      if (type !== 'permission') {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, type]);

  if (!error || !isVisible) return null;

  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          title: 'Problema de Conexion',
          message: 'Verifica tu conexion a internet e intenta nuevamente.',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L12 12m-6.364 6.364L12 12m6.364-6.364L12 12" />
            </svg>
          ),
          color: 'orange'
        };
      case 'permission':
        return {
          title: 'Acceso Denegado',
          message: 'No tienes permisos para realizar esta accion.',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'red'
        };
      case 'data':
        return {
          title: 'Error al Cargar Datos',
          message: 'Hubo un problema al cargar la informacion. Intenta nuevamente.',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          color: 'yellow'
        };
      default:
        return {
          title: 'Error Temporal',
          message: 'Se produjo un error temporal. Por favor, intenta nuevamente.',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'red'
        };
    }
  };

  const config = getErrorConfig();
  
  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
      button: 'bg-red-100 hover:bg-red-200 text-red-700'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      icon: 'text-orange-500',
      button: 'bg-orange-100 hover:bg-orange-200 text-orange-700'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-500',
      button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
    }
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
        {showIcon && (
          <div className={colors.icon}>
            {config.icon}
          </div>
        )}
        <p className={`text-sm ${colors.text}`}>{config.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`text-xs px-2 py-1 rounded ${colors.button} transition-colors`}
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 mb-4 ${colors.bg} ${colors.border} border`}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {config.icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${colors.text} mb-1`}>
            {config.title}
          </h3>
          <p className={`text-sm ${colors.text} opacity-90`}>
            {config.message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className={`mt-3 inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${colors.button} transition-colors`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reintentar</span>
            </button>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className={`flex-shrink-0 ${colors.icon} hover:opacity-70 transition-opacity`}
        >
          <span className="sr-only">Cerrar</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ErrorHandler;
