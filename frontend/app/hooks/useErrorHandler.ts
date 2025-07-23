'use client';

import { useCallback, useState } from 'react';

export type ErrorType = 'network' | 'permission' | 'data' | 'general';

interface ErrorState {
  message: string | null;
  type: ErrorType;
  details?: string;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((err: any, type: ErrorType = 'general') => {
    console.error('Error capturado:', err);
    
    let message = '';
    let details = '';

    if (err?.response?.status) {
      details = `HTTP ${err.response.status}`;
      switch (err.response.status) {
        case 401:
          message = 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
          type = 'permission';
          break;
        case 403:
          message = 'No tienes permisos para realizar esta accion.';
          type = 'permission';
          break;
        case 404:
          message = 'El recurso solicitado no fue encontrado.';
          type = 'data';
          break;
        case 500:
          message = 'Error interno del servidor. Intenta nuevamente mas tarde.';
          type = 'general';
          break;
        default:
          message = 'Se produjo un error inesperado. Intenta nuevamente.';
          type = 'general';
      }
    } else if (err?.message?.includes('fetch')) {
      message = 'Problema de conexion. Verifica tu internet e intenta nuevamente.';
      type = 'network';
      details = 'Network Error';
    } else if (err?.message?.includes('token')) {
      message = 'Problema de autenticacion. Inicia sesion nuevamente.';
      type = 'permission';
      details = 'Token Error';
    } else {
      switch (type) {
        case 'network':
          message = 'Problema de conexion. Verifica tu internet e intenta nuevamente.';
          break;
        case 'permission':
          message = 'No tienes permisos para realizar esta accion.';
          break;
        case 'data':
          message = 'Error al cargar los datos. Intenta nuevamente.';
          break;
        default:
          message = 'Se produjo un error temporal. Intenta nuevamente.';
      }
      details = err?.message || 'Unknown error';
    }

    setError({ message, type, details });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryAction = useCallback((action: () => void | Promise<void>) => {
    return async () => {
      clearError();
      try {
        await action();
      } catch (err) {
        handleError(err);
      }
    };
  }, [clearError, handleError]);

  return {
    error: error?.message || null,
    errorType: error?.type || 'general',
    errorDetails: error?.details,
    handleError,
    clearError,
    retryAction
  };
};

// Funcion utilitaria para manejar errores de respuesta HTTP
export const handleApiError = (response: Response) => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response;
};

// Funcion utilitaria para crear mensajes de error amigables
export const createUserFriendlyError = (error: any): string => {
  if (error?.response?.status) {
    switch (error.response.status) {
      case 401:
        return 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta accion.';
      case 404:
        return 'El recurso solicitado no fue encontrado.';
      case 500:
        return 'Error interno del servidor. Intenta nuevamente mas tarde.';
      default:
        return 'Se produjo un error inesperado. Intenta nuevamente.';
    }
  }
  
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return 'Problema de conexion. Verifica tu internet e intenta nuevamente.';
  }
  
  return 'Se produjo un error temporal. Intenta nuevamente.';
};
