import { SendMessageCommand, type SQSClient } from "@aws-sdk/client-sqs";
import { createRandomOrder, toSendMessageInput, type Order } from "../../domain/order/index.js";
import type { SendResult } from "./producer.types.js";

export async function sendOrder(
  client: SQSClient,
  queueUrl: string,
  order: Order = createRandomOrder(),
): Promise<SendResult> {
  const { MessageId } = await client.send(
    new SendMessageCommand(toSendMessageInput(order, queueUrl)),
  );
  if (!MessageId) throw new Error("SendMessage did not return a MessageId");
  return { order, messageId: MessageId };
}

export async function sendOrders(
  client: SQSClient,
  queueUrl: string,
  count: number,
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  for (let i = 0; i < count; i += 1) {
    results.push(await sendOrder(client, queueUrl));
  }
  return results;
}
