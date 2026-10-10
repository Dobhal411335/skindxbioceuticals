import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger, REQUEST_ID_RESPONSE_HEADER, sanitizePath } from '@/lib/logger';
import { AppError } from '@/utils/AppError';
import { sendError } from '@/utils/apiResponse';
import { env } from '@/config/env';

function ensureRequestIdHeader(req: Request, res: Response): string | undefined {
  const requestId = req.requestId;
  if (requestId && !res.getHeader(REQUEST_ID_RESPONSE_HEADER)) {
    res.setHeader(REQUEST_ID_RESPONSE_HEADER, requestId);
  }
  return requestId;
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = ensureRequestIdHeader(req, res);
  const path = sanitizePath(req.originalUrl || req.url || req.path || '/');

  if (err instanceof AppError) {
    sendError(
      res,
      err.message,
      err.statusCode,
      err.errors,
      env.NODE_ENV === 'development' ? err.stack : undefined,
      requestId,
    );
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 'Validation failed', 422, err.flatten(), undefined, requestId);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(
        res,
        'A record with this value already exists',
        409,
        undefined,
        undefined,
        requestId,
      );
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found', 404, undefined, undefined, requestId);
      return;
    }

    logger.error(
      {
        event: 'db.request.failure',
        context: 'DB',
        requestId,
        method: req.method,
        path,
        prismaCode: err.code,
        err,
      },
      'Database request failed',
    );
    sendError(res, 'Internal server error', 500, undefined, undefined, requestId);
    return;
  }

  logger.error(
    {
      event: 'app.unexpected_error',
      context: 'APP',
      requestId,
      method: req.method,
      path,
      err,
    },
    'Unhandled application error',
  );

  const message =
    err instanceof Error && env.NODE_ENV === 'development' ? err.message : 'Internal server error';

  sendError(
    res,
    message,
    500,
    undefined,
    err instanceof Error && env.NODE_ENV === 'development' ? err.stack : undefined,
    requestId,
  );
}
