import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Error de validacion',
      errors: err.message
    });
    return;
  }

  if (err.name === 'NotFoundError') {
    res.status(404).json({
      success: false,
      message: err.message || 'Recurso no encontrado'
    });
    return;
  }

  if (err.name === 'ConflictError') {
    res.status(409).json({
      success: false,
      message: err.message || 'Conflicto con el estado actual'
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
};

// Clases de error personalizadas
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
