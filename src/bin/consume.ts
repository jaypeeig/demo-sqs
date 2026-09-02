import { loadConfig } from "../config/env/index.js";
import { createLogger } from "../lib/logger/index.js";
import { createSqsClient } from "../sqs/client.js";
import { ensureQueue } from "../sqs/queue/index.js";
import { consumeOnce } from "../sqs/consumer/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const client = createSqsClient(config);
  const queueUrl = await ensureQueue(client, config.queueName);

  const processed = await consumeOnce(
    client,
    queueUrl,
    (order) => {
      logger.info("Processing order", {
        orderId: order.id,
        item: order.item,
        customer: order.customer,
        email: order.email,
      });
    },
    logger,
  );
  logger.info(processed > 0 ? `Processed ${processed} order(s)` : "No orders waiting");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
