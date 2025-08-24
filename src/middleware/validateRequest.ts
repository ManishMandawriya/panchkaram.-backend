import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Schema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const { error } = schema.validate(dataToValidate);
      
      if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        res.status(400).json({
          success: false,
          message: `Validation error: ${errorMessage}`,
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation failed',
      });
    }
  };
}; 