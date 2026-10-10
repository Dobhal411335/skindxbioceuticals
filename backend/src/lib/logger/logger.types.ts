export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type AppEnvironment = 'development' | 'test' | 'production';

export interface LoggerBindings {
  service: string;
  env: AppEnvironment;
}

export interface LogContext {
  event?: string;
  requestId?: string;
  userId?: string;
  siteCode?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  reason?: string;
  err?: unknown;
  [key: string]: unknown;
}

export interface CreateLoggerOptions {
  level?: LogLevel;
  nodeEnv?: AppEnvironment;
  service?: string;
  /**
   * Optional pino destination (e.g. a test sink). When omitted, logs go to stdout.
   */
  destination?: NodeJS.WritableStream | number;
  /**
   * Force JSON (no pretty transport) even in development — useful for tests.
   */
  forceJson?: boolean;
}
