import { DeleteMessageCommand, ReceiveMessageCommand, type SQSClient } from "@aws-sdk/client-sqs";
import { parseOrder, type Order } from "../../domain/order/index.js";
import type { Logger } from "../../lib/logger/index.js";
import type { ReceivedOrder } from "./consumer.types.js";

export async function receiveOrders(
  client: SQSClient,
  queueUrl: string,
  maxMessages = 5,
  waitTimeSeconds = 5,
): Promise<ReceivedOrder[]> {
  const { Messages = [] } = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitTimeSeconds,
      MessageAttributeNames: ["All"],
    }),
  );

  const received: ReceivedOrder[] = [];
  for (const message of Messages) {
    if (!message.ReceiptHandle) continue;
    received.push({ order: parseOrder(message), receiptHandle: message.ReceiptHandle });
  }
  return received;
}

export async function deleteMessage(
  client: SQSClient,
  queueUrl: string,
  receiptHandle: string,
): Promise<void> {
  await client.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle }));
}

export async function consumeOnce(
  client: SQSClient,
  queueUrl: string,
  onOrder: (order: Order) => void | Promise<void>,
  logger?: Logger,
): Promise<number> {
  const received = await receiveOrders(client, queueUrl);
  let processed = 0;
  for (const { order, receiptHandle } of received) {
    try {
      await onOrder(order);
      await deleteMessage(client, queueUrl, receiptHandle);
      processed += 1;
    } catch (error) {
      logger?.error("Failed to process order", { orderId: order.id, error: String(error) });
    }
  }
  return processed;
}

export async function pollForever(
  client: SQSClient,
  queueUrl: string,
  onOrder: (order: Order) => void | Promise<void>,
  logger: Logger,
  signal?: AbortSignal,
): Promise<void> {
  // oxlint-disable-next-line eslint/no-unmodified-loop-condition -- signal.aborted flips via the AbortController externally, not inside this loop
  while (!signal?.aborted) {
    const processed = await consumeOnce(client, queueUrl, onOrder, logger);
    if (processed === 0) logger.debug("No messages received");
  }
}
