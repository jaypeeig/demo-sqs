import type { SQSClient } from "@aws-sdk/client-sqs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/env/index.js";
import type { Order } from "../../src/domain/order/index.js";
import { createSqsClient } from "../../src/sqs/client.js";
import { consumeOnce } from "../../src/sqs/consumer/index.js";
import { sendOrders } from "../../src/sqs/producer/index.js";
import { ensureQueue, purgeQueue } from "../../src/sqs/queue/index.js";

let client: SQSClient;
let queueUrl: string;

beforeAll(async () => {
  const config = loadConfig();
  client = createSqsClient(config);
  queueUrl = await ensureQueue(client, config.queueName);
  await purgeQueue(client, queueUrl);
});

afterAll(() => {
  client.destroy();
});

describe("produce -> consume round trip against a real ElasticMQ container", () => {
  it("delivers every produced order exactly once and deletes it on processing", async () => {
    const sent = await sendOrders(client, queueUrl, 3);
    const sentIds = new Set(sent.map((s) => s.order.id));

    const received: Order[] = [];
    while (received.length < sent.length) {
      // eslint-disable-next-line no-await-in-loop
      await consumeOnce(client, queueUrl, (order) => {
        received.push(order);
      });
    }

    expect(received).toHaveLength(sent.length);
    expect(new Set(received.map((o) => o.id))).toEqual(sentIds);
    for (const order of received) {
      expect(order.item).toMatch(/^Fried /u);
      expect(order.email).toContain("@");
    }

    // Everything was deleted on the way through, so nothing should be left.
    const remaining = await consumeOnce(client, queueUrl, () => {});
    expect(remaining).toBe(0);
  }, 30_000);
});
