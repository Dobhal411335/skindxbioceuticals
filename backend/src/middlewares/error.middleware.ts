import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/AppError';
import { sendError } from '@/utils/apiResponse';
import { env } from '@/config/env';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(
      res,
      err.message,
      err.statusCode,
      err.errors,
      env.NODE_ENV === 'development' ? err.stack : undefined,
    );
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 'Validation failed', 422, err.flatten());
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  console.error(err);

  const message =
    err instanceof Error && env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error';

  sendError(
    res,
    message,
    500,
    undefined,
    err instanceof Error && env.NODE_ENV === 'development' ? err.stack : undefined,
  );
}
