export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppConfig {
  region: string;
  queueName: string;
  // undefined means: use the default AWS credential chain instead of a local endpoint.
  endpoint: string | undefined;
  logLevel: LogLevel;
}
