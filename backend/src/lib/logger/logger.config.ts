import pino, { type Logger, type LoggerOptions } from 'pino';
import type { AppEnvironment, CreateLoggerOptions, LogLevel } from './logger.types';

export const LOGGER_SERVICE_NAME = 'skindx-api';

const DEFAULT_LEVEL_BY_ENV: Record<AppEnvironment, LogLevel> = {
  development: 'debug',
  test: 'silent',
  production: 'info',
};

export function resolveLogLevel(nodeEnv: AppEnvironment, configured?: LogLevel): LogLevel {
  if (configured) {
    return configured;
  }
  return DEFAULT_LEVEL_BY_ENV[nodeEnv];
}

export function buildPinoOptions(options: CreateLoggerOptions = {}): LoggerOptions {
  const nodeEnv = options.nodeEnv ?? 'development';
  const level = resolveLogLevel(nodeEnv, options.level);
  const service = options.service ?? LOGGER_SERVICE_NAME;

  const base: LoggerOptions = {
    level,
    base: {
      service,
      env: nodeEnv,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    redact: {
      paths: [
        'password',
        'confirmPassword',
        'currentPassword',
        'newPassword',
        'otp',
        'verificationCode',
        'resetToken',
        'accessToken',
        'refreshToken',
        'credential',
        'authorization',
        'cookie',
        '*.password',
        '*.otp',
        '*.accessToken',
        '*.refreshToken',
        '*.authorization',
        'req.headers.authorization',
        'req.headers.cookie',
        'headers.authorization',
        'headers.cookie',
      ],
      censor: '[REDACTED]',
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  };

  const usePretty = nodeEnv === 'development' && !options.forceJson && !options.destination;
  if (usePretty) {
    base.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat: '{if context}[{context}] {end}{msg}',
      },
    };
  }

  return base;
}

export function createPinoLogger(options: CreateLoggerOptions = {}): Logger {
  const pinoOptions = buildPinoOptions(options);
  if (options.destination !== undefined) {
    return pino(pinoOptions, options.destination as pino.DestinationStream);
  }
  return pino(pinoOptions);
}
