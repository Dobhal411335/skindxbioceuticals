import type { Logger } from 'pino';
import { env } from '@/config/env';
import { createPinoLogger } from './logger.config';
import { redactValue } from './logger.redaction';
import type { CreateLoggerOptions, LogContext } from './logger.types';

type LogMethod = (context: LogContext | string, message?: string) => void;

export interface AppLogger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  fatal: LogMethod;
  child: (bindings: LogContext) => AppLogger;
  /** Underlying pino instance — prefer typed methods above. */
  raw: Logger;
}

function normalizeArgs(
  contextOrMessage: LogContext | string,
  message?: string,
): { context: LogContext; message: string } {
  if (typeof contextOrMessage === 'string') {
    return { context: {}, message: contextOrMessage };
  }

  const context = (redactValue(contextOrMessage) as LogContext) ?? {};
  const msg = message ?? (typeof context.event === 'string' ? context.event : 'log');
  return { context, message: msg };
}

function wrapPino(pinoLogger: Logger): AppLogger {
  const write =
    (level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'): LogMethod =>
    (contextOrMessage, message) => {
      try {
        const { context, message: msg } = normalizeArgs(contextOrMessage, message);
        pinoLogger[level](context, msg);
      } catch {
        // Logging must never break the application.
      }
    };

  return {
    debug: write('debug'),
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
    fatal: write('fatal'),
    child(bindings: LogContext) {
      const safe = (redactValue(bindings) as LogContext) ?? {};
      return wrapPino(pinoLogger.child(safe));
    },
    raw: pinoLogger,
  };
}

export function createAppLogger(options: CreateLoggerOptions = {}): AppLogger {
  return wrapPino(
    createPinoLogger({
      nodeEnv: options.nodeEnv ?? env.NODE_ENV,
      level: options.level ?? env.LOG_LEVEL,
      service: options.service,
      destination: options.destination,
      forceJson: options.forceJson,
    }),
  );
}

/** Process-wide application logger. */
export const logger = createAppLogger();
