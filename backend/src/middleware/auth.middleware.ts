import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Token de autenticacion no proporcionado'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no configurado');
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      roles: string[];
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token invalido o expirado'
    });
  }
};

// Middleware para validar roles especificos
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const hasRole = req.user.roles.some(role =>
      allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())
    );

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta accion'
      });
      return;
    }

    next();
  };
};
