import { loadConfig } from "../config/env/index.js";
import { createLogger } from "../lib/logger/index.js";
import { createSqsClient } from "../sqs/client.js";
import { ensureQueue } from "../sqs/queue/index.js";
import { pollForever } from "../sqs/consumer/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const client = createSqsClient(config);
  const queueUrl = await ensureQueue(client, config.queueName);

  const controller = new AbortController();
  process.once("SIGINT", () => controller.abort());
  process.once("SIGTERM", () => controller.abort());

  logger.info("Worker started, long-polling for orders", { queueUrl });
  await pollForever(
    client,
    queueUrl,
    (order) => {
      logger.info("Processing order", {
        orderId: order.id,
        item: order.item,
        customer: order.customer,
      });
    },
    logger,
    controller.signal,
  );
  logger.info("Worker stopped");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
