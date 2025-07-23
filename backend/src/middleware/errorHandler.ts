import { NextFunction, Request, Response } from 'express';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error capturado por el middleware:', error);

  // Error de validacion de PostgreSQL (duplicate key)
  if (error.code === '23505') {
    return res.status(409).json({
      error: 'Conflicto de datos',
      message: 'Ya existe un registro con estos datos unicos'
    });
  }

  // Error de conexion a la base de datos
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Servicio no disponible',
      message: 'No se puede conectar a la base de datos'
    });
  }

  // Error de sintaxis SQL
  if (error.code === '42601') {
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error en la consulta a la base de datos'
    });
  }

  // Error generico
  return res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Ha ocurrido un error inesperado'
  });
}
