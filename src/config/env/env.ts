// oxlint-disable-next-line import/no-unassigned-import -- dotenv/config is a documented side-effect-only import
import "dotenv/config";
import type { AppConfig, LogLevel } from "./env.types.js";

const DEFAULT_REGION = "ap-southeast-1";
const DEFAULT_QUEUE_NAME = "DemoQueue";
const DEFAULT_ENDPOINT = "http://localhost:9324";
const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];

function readLogLevel(value: string | undefined): LogLevel {
  if (value === undefined) return "info";
  if ((LOG_LEVELS as readonly string[]).includes(value)) return value as LogLevel;
  throw new Error(`Invalid LOG_LEVEL "${value}". Expected one of: ${LOG_LEVELS.join(", ")}`);
}

// SQS_ENDPOINT="" (empty) falls back to the AWS SDK's default credential chain for real AWS.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const endpoint =
    env.SQS_ENDPOINT === undefined ? DEFAULT_ENDPOINT : env.SQS_ENDPOINT || undefined;
  return {
    region: env.AWS_REGION || DEFAULT_REGION,
    queueName: env.SQS_QUEUE_NAME || DEFAULT_QUEUE_NAME,
    endpoint,
    logLevel: readLogLevel(env.LOG_LEVEL),
  };
}
