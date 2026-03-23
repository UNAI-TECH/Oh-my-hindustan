import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Using a custom interface instead of global augmentation to be safer if types are not picking up
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: Role };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }
  next();
};

export const analystMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ANALYST' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden', message: 'Analyst or Admin access required' });
  }
  next();
};

export const creatorMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'CREATOR' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden', message: 'Creator or Admin access required' });
  }
  next();
};

export const creatorOrAnalystMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'CREATOR' && req.user?.role !== 'ANALYST' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden', message: 'Creator, Analyst or Admin access required' });
  }
  next();
};
