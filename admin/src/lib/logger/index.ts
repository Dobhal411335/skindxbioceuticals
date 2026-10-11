import {
  createLoggerConfig,
  formatLogLine,
  shouldLog,
  type FrontendLogLevel,
} from "./logger.config";
import { redactValue } from "./logger.redaction";

export {
  sanitizeUrl,
  redactValue,
  redactSensitiveText,
  REDACTED,
  isSensitiveKey,
} from "./logger.redaction";
export type { FrontendLogLevel } from "./logger.config";
export { createLoggerConfig, shouldLog } from "./logger.config";

export type LogContext = Record<string, unknown>;

type LogMethod = (message: string, context?: LogContext) => void;

export interface FrontendLogger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

function write(
  level: FrontendLogLevel,
  service: string,
  message: string,
  context?: LogContext,
  nodeEnv?: string,
): void {
  const config = createLoggerConfig(service, nodeEnv ?? process.env.NODE_ENV);
  if (!shouldLog(config, level)) {
    return;
  }

  try {
    const safe = context ? (redactValue(context) as LogContext) : undefined;
    const line = formatLogLine(level, service, message, safe);
    const consoleMethod =
      level === "debug"
        ? "debug"
        : level === "info"
          ? "info"
          : level === "warn"
            ? "warn"
            : "error";
    // eslint-disable-next-line no-console -- centralized frontend logger sink
    console[consoleMethod](line);
  } catch {
    // Logging must never break the UI.
  }
}

export function createFrontendLogger(service = "skindx-admin", nodeEnv?: string): FrontendLogger {
  return {
    debug: (message, context) => write("debug", service, message, context, nodeEnv),
    info: (message, context) => write("info", service, message, context, nodeEnv),
    warn: (message, context) => write("warn", service, message, context, nodeEnv),
    error: (message, context) => write("error", service, message, context, nodeEnv),
  };
}

export const logger = createFrontendLogger("skindx-admin");
