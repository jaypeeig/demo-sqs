import { loadConfig } from "../config/env/index.js";
import { createLogger } from "../lib/logger/index.js";
import { createSqsClient } from "../sqs/client.js";
import { ensureQueue } from "../sqs/queue/index.js";
import { sendOrders } from "../sqs/producer/index.js";

const count = Number(process.argv[2] ?? process.env.PRODUCE_COUNT ?? 1);

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const client = createSqsClient(config);
  const queueUrl = await ensureQueue(client, config.queueName);

  const results = await sendOrders(client, queueUrl, count);
  for (const { order, messageId } of results) {
    logger.info("Sent order", {
      messageId,
      orderId: order.id,
      item: order.item,
      customer: order.customer,
    });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
