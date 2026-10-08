import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { sendError } from '../utils/api-response';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Known AppError (instanceof or statusCode property)
  if (err instanceof AppError || ('statusCode' in err && typeof (err as { statusCode: unknown }).statusCode === 'number')) {
    const appErr = err as AppError;
    sendError(res, appErr.statusCode, appErr.code || 'ERROR', appErr.message, appErr.details);
    return;
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    sendError(res, 422, 'VALIDATION_ERROR', 'Request validation failed', details);
    return;
  }

  // 3. MongoDB Duplicate Key Error (E11000)
  if ('code' in err && (err as { code: unknown }).code === 11000) {
    const keyPattern = (err as { keyPattern?: Record<string, number> }).keyPattern;
    const field = keyPattern ? Object.keys(keyPattern).join(', ') : 'Field';
    sendError(res, 409, 'DUPLICATE_KEY', `A record with this ${field} already exists.`);
    return;
  }

  // 4. Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, 400, 'INVALID_IDENTIFIER', 'Invalid resource identifier supplied');
    return;
  }

  // 5. Multer File Upload Error (e.g. LIMIT_FILE_SIZE)
  if (err.name === 'MulterError' || (err as { code?: unknown }).code === 'LIMIT_FILE_SIZE') {
    sendError(res, 400, 'FILE_UPLOAD_ERROR', err.message);
    return;
  }

  // 5. Default Internal Server Error
  logger.error(err, 'Unhandled Server Error');
  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  );
};
