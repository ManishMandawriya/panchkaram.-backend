import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/auth';
import { logger } from '../utils/logger';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Admin privileges required',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
}; 