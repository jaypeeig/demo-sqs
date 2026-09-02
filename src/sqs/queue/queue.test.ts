import {
  CreateQueueCommand,
  GetQueueUrlCommand,
  PurgeQueueCommand,
  QueueDoesNotExist,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";
import { ensureQueue, purgeQueue } from "./queue.js";

const sqsMock = mockClient(SQSClient);
const QUEUE_URL = "http://localhost:9324/000000000000/DemoQueue";

beforeEach(() => sqsMock.reset());

describe("ensureQueue", () => {
  it("returns the existing queue URL without creating one", async () => {
    sqsMock.on(GetQueueUrlCommand).resolves({ QueueUrl: QUEUE_URL });

    const url = await ensureQueue(sqsMock as unknown as SQSClient, "DemoQueue");

    expect(url).toBe(QUEUE_URL);
    expect(sqsMock.commandCalls(CreateQueueCommand)).toHaveLength(0);
  });

  it("creates the queue when it does not exist yet", async () => {
    sqsMock
      .on(GetQueueUrlCommand)
      .rejects(new QueueDoesNotExist({ message: "nope", $metadata: {} }));
    sqsMock.on(CreateQueueCommand).resolves({ QueueUrl: QUEUE_URL });

    const url = await ensureQueue(sqsMock as unknown as SQSClient, "DemoQueue");

    expect(url).toBe(QUEUE_URL);
    expect(sqsMock.commandCalls(CreateQueueCommand)[0]?.args[0].input).toEqual({
      QueueName: "DemoQueue",
      Attributes: { MessageRetentionPeriod: String(60 * 60 * 24 * 3) },
    });
  });

  it("propagates unrelated errors", async () => {
    sqsMock.on(GetQueueUrlCommand).rejects(new Error("network down"));
    await expect(ensureQueue(sqsMock as unknown as SQSClient, "DemoQueue")).rejects.toThrow(
      "network down",
    );
  });
});

describe("purgeQueue", () => {
  it("sends a PurgeQueueCommand for the given queue URL", async () => {
    sqsMock.on(PurgeQueueCommand).resolves({});
    await purgeQueue(sqsMock as unknown as SQSClient, QUEUE_URL);
    expect(sqsMock.commandCalls(PurgeQueueCommand)[0]?.args[0].input).toEqual({
      QueueUrl: QUEUE_URL,
    });
  });
});
