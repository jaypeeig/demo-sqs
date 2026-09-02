import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";
import { sendOrder, sendOrders } from "./producer.js";

const sqsMock = mockClient(SQSClient);
const QUEUE_URL = "http://localhost:9324/000000000000/DemoQueue";

beforeEach(() => sqsMock.reset());

describe("sendOrder", () => {
  it("sends the order as a SendMessageCommand and returns its MessageId", async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-1" });
    const order = {
      id: "order-1",
      item: "Fried Cat",
      customer: "Ada Lovelace",
      email: "ada@example.com",
    };

    const result = await sendOrder(sqsMock as unknown as SQSClient, QUEUE_URL, order);

    expect(result).toEqual({ order, messageId: "msg-1" });
    expect(sqsMock.commandCalls(SendMessageCommand)[0]?.args[0].input).toEqual({
      QueueUrl: QUEUE_URL,
      DelaySeconds: 2,
      MessageBody: "Mang Inasal New Order: order-1",
      MessageAttributes: {
        Order: { DataType: "String", StringValue: "Fried Cat" },
        Customer: { DataType: "String", StringValue: "Ada Lovelace" },
        Email: { DataType: "String", StringValue: "ada@example.com" },
      },
    });
  });

  it("throws if SQS does not return a MessageId", async () => {
    sqsMock.on(SendMessageCommand).resolves({});
    await expect(sendOrder(sqsMock as unknown as SQSClient, QUEUE_URL)).rejects.toThrow(
      /MessageId/u,
    );
  });
});

describe("sendOrders", () => {
  it("sends the requested number of orders", async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-x" });
    const results = await sendOrders(sqsMock as unknown as SQSClient, QUEUE_URL, 3);
    expect(results).toHaveLength(3);
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(3);
  });
});
