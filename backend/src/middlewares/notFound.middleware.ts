import type { Request, Response, NextFunction } from 'express';
import { sendError } from '@/utils/apiResponse';

export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction): void {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}
