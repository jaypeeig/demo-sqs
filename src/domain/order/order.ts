import { randomUUID } from "node:crypto";
import type { Message, SendMessageCommandInput } from "@aws-sdk/client-sqs";
import { emailFor, randomAnimal, randomFullName } from "../../utils/fake-data.js";
import { messageAttribute } from "../../utils/message-attribute.js";
import type { Order } from "./order.types.js";

export function createRandomOrder(): Order {
  const customer = randomFullName();
  return {
    id: randomUUID(),
    item: `Fried ${randomAnimal()}`,
    customer,
    email: emailFor(customer),
  };
}

export function toSendMessageInput(order: Order, queueUrl: string): SendMessageCommandInput {
  return {
    QueueUrl: queueUrl,
    DelaySeconds: 2,
    MessageBody: `Mang Inasal New Order: ${order.id}`,
    MessageAttributes: {
      Order: messageAttribute(order.item),
      Customer: messageAttribute(order.customer),
      Email: messageAttribute(order.email),
    },
  };
}

const ORDER_BODY_PATTERN = /^Mang Inasal New Order: (.+)$/u;

export function parseOrder(message: Pick<Message, "Body" | "MessageAttributes">): Order {
  const body = message.Body ?? "";
  const match = ORDER_BODY_PATTERN.exec(body);
  const attributes = message.MessageAttributes ?? {};
  return {
    id: match?.[1] ?? body,
    item: attributes.Order?.StringValue ?? "",
    customer: attributes.Customer?.StringValue ?? "",
    email: attributes.Email?.StringValue ?? "",
  };
}
