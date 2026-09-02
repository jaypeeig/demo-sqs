import { describe, expect, it } from "vitest";
import { createRandomOrder, parseOrder, toSendMessageInput } from "./order.js";

describe("createRandomOrder", () => {
  it("produces an order with every field populated", () => {
    const order = createRandomOrder();
    expect(order.id).toBeTruthy();
    expect(order.item).toMatch(/^Fried /u);
    expect(order.customer).toBeTruthy();
    expect(order.email).toContain("@");
  });
});

describe("toSendMessageInput / parseOrder", () => {
  it("round-trips an order through the SQS message shape", () => {
    const order = createRandomOrder();
    const input = toSendMessageInput(order, "https://example.com/queue");

    expect(input.QueueUrl).toBe("https://example.com/queue");
    expect(input.DelaySeconds).toBe(2);
    expect(input.MessageBody).toBe(`Mang Inasal New Order: ${order.id}`);

    const parsed = parseOrder({
      Body: input.MessageBody,
      MessageAttributes: input.MessageAttributes,
    });
    expect(parsed).toEqual(order);
  });

  it("falls back gracefully when attributes or body format are missing", () => {
    expect(parseOrder({ Body: "not a known format" })).toEqual({
      id: "not a known format",
      item: "",
      customer: "",
      email: "",
    });
    expect(parseOrder({})).toEqual({ id: "", item: "", customer: "", email: "" });
  });
});
