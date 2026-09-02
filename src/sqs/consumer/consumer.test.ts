import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "../../domain/order/index.js";
import { createLogger } from "../../lib/logger/index.js";
import { consumeOnce, deleteMessage, receiveOrders } from "./consumer.js";

const sqsMock = mockClient(SQSClient);
const QUEUE_URL = "http://localhost:9324/000000000000/DemoQueue";

beforeEach(() => sqsMock.reset());

function rawMessage(id: string, receiptHandle: string) {
  return {
    MessageId: id,
    ReceiptHandle: receiptHandle,
    Body: `Mang Inasal New Order: ${id}`,
    MessageAttributes: {
      Order: { DataType: "String", StringValue: "Fried Duck" },
      Customer: { DataType: "String", StringValue: "Ada Lovelace" },
      Email: { DataType: "String", StringValue: "ada@example.com" },
    },
  };
}

describe("receiveOrders", () => {
  it("maps received messages to orders with their receipt handles", async () => {
    sqsMock.on(ReceiveMessageCommand).resolves({ Messages: [rawMessage("order-1", "rh-1")] });

    const received = await receiveOrders(sqsMock as unknown as SQSClient, QUEUE_URL);

    expect(received).toEqual([
      {
        order: {
          id: "order-1",
          item: "Fried Duck",
          customer: "Ada Lovelace",
          email: "ada@example.com",
        },
        receiptHandle: "rh-1",
      },
    ]);
  });

  it("returns an empty array when there are no messages", async () => {
    sqsMock.on(ReceiveMessageCommand).resolves({});
    expect(await receiveOrders(sqsMock as unknown as SQSClient, QUEUE_URL)).toEqual([]);
  });

  it("skips a message with no ReceiptHandle rather than crash", async () => {
    sqsMock
      .on(ReceiveMessageCommand)
      .resolves({ Messages: [{ Body: "Mang Inasal New Order: order-1" }] });
    expect(await receiveOrders(sqsMock as unknown as SQSClient, QUEUE_URL)).toEqual([]);
  });
});

describe("deleteMessage", () => {
  it("sends a DeleteMessageCommand for the given receipt handle", async () => {
    sqsMock.on(DeleteMessageCommand).resolves({});
    await deleteMessage(sqsMock as unknown as SQSClient, QUEUE_URL, "rh-1");
    expect(sqsMock.commandCalls(DeleteMessageCommand)[0]?.args[0].input).toEqual({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: "rh-1",
    });
  });
});

describe("consumeOnce", () => {
  it("processes and deletes every received message", async () => {
    sqsMock
      .on(ReceiveMessageCommand)
      .resolves({ Messages: [rawMessage("order-1", "rh-1"), rawMessage("order-2", "rh-2")] });
    sqsMock.on(DeleteMessageCommand).resolves({});
    const onOrder = vi.fn<(order: Order) => void>();

    const processed = await consumeOnce(sqsMock as unknown as SQSClient, QUEUE_URL, onOrder);

    expect(processed).toBe(2);
    expect(onOrder).toHaveBeenCalledTimes(2);
    expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(2);
  });

  it("does not delete, but keeps going, when a handler throws for one message", async () => {
    sqsMock
      .on(ReceiveMessageCommand)
      .resolves({ Messages: [rawMessage("order-1", "rh-1"), rawMessage("order-2", "rh-2")] });
    sqsMock.on(DeleteMessageCommand).resolves({});
    const onOrder = vi
      .fn<(order: Order) => void>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);
    const logger = createLogger("error");

    const processed = await consumeOnce(
      sqsMock as unknown as SQSClient,
      QUEUE_URL,
      onOrder,
      logger,
    );

    expect(processed).toBe(1);
    expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(1);
  });

  it("returns 0 and deletes nothing when the queue is empty", async () => {
    sqsMock.on(ReceiveMessageCommand).resolves({});
    const onOrder = vi.fn<(order: Order) => void>();
    expect(await consumeOnce(sqsMock as unknown as SQSClient, QUEUE_URL, onOrder)).toBe(0);
    expect(onOrder).not.toHaveBeenCalled();
  });
});
