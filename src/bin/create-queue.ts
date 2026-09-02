import { loadConfig } from "../config/env/index.js";
import { createLogger } from "../lib/logger/index.js";
import { createSqsClient } from "../sqs/client.js";
import { ensureQueue } from "../sqs/queue/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const client = createSqsClient(config);
  const queueUrl = await ensureQueue(client, config.queueName);
  logger.info("Queue ready", { queueName: config.queueName, queueUrl });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
