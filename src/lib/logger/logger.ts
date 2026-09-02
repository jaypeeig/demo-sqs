import type { LogLevel } from "../../config/env/index.js";
import type { Logger } from "./logger.types.js";

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(minLevel: LogLevel = "info"): Logger {
  const threshold = LEVEL_WEIGHT[minLevel];

  const log = (level: LogLevel, message: string, meta?: Record<string, unknown>): void => {
    if (LEVEL_WEIGHT[level] < threshold) return;
    const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...meta });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };

  return {
    debug: (message, meta) => log("debug", message, meta),
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),
  };
}
