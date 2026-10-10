import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger.instance';
import { sanitizePath } from './logger.redaction';
import {
  extractIncomingRequestId,
  REQUEST_ID_HEADER,
  REQUEST_ID_RESPONSE_HEADER,
  resolveRequestId,
} from './request-id';

function httpLogLevel(statusCode: number): 'debug' | 'info' | 'warn' | 'error' {
  if (statusCode >= 500) {
    return 'error';
  }
  if (statusCode >= 400) {
    return 'warn';
  }
  return 'info';
}

function isHealthCheck(path: string): boolean {
  return path === '/health' || path.endsWith('/health');
}

/**
 * Generates/validates X-Request-Id, measures duration, and logs each completed
 * HTTP request exactly once. Logging failures never break the response.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = extractIncomingRequestId(req.headers[REQUEST_ID_HEADER]);
  const requestId = resolveRequestId(incoming);
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_RESPONSE_HEADER, requestId);

  const startedAt = process.hrtime.bigint();
  let logged = false;

  const logCompletion = (): void => {
    if (logged) {
      return;
    }
    logged = true;

    try {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const rawPath = req.originalUrl || req.url || req.path || '/';
      const path = sanitizePath(rawPath);
      const statusCode = res.statusCode;
      const health = isHealthCheck(req.path || path);

      const context = {
        event: 'http.request.completed',
        context: 'HTTP',
        requestId,
        method: req.method,
        path,
        statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        ...(req.user?.id ? { userId: req.user.id } : {}),
        ...(req.site?.code ? { siteCode: req.site.code } : {}),
      };

      if (health) {
        logger.debug(context, `${req.method} ${path} ${statusCode}`);
        return;
      }

      const level = httpLogLevel(statusCode);
      logger[level](context, `${req.method} ${path} ${statusCode}`);
    } catch {
      // Never fail the request because of logging.
    }
  };

  res.on('finish', logCompletion);
  res.on('close', logCompletion);

  next();
}
