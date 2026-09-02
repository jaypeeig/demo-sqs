import { describe, expect, it } from "vitest";
import { loadConfig } from "./env.js";

describe("loadConfig", () => {
  it("defaults to the local ElasticMQ endpoint when nothing is set", () => {
    expect(loadConfig({})).toEqual({
      region: "ap-southeast-1",
      queueName: "DemoQueue",
      endpoint: "http://localhost:9324",
      logLevel: "info",
    });
  });

  it('treats an empty SQS_ENDPOINT as "use the default AWS credential chain"', () => {
    expect(loadConfig({ SQS_ENDPOINT: "" }).endpoint).toBeUndefined();
  });

  it("reads overrides from the given env", () => {
    expect(
      loadConfig({
        AWS_REGION: "us-east-1",
        SQS_QUEUE_NAME: "OtherQueue",
        SQS_ENDPOINT: "http://example.com",
        LOG_LEVEL: "debug",
      }),
    ).toEqual({
      region: "us-east-1",
      queueName: "OtherQueue",
      endpoint: "http://example.com",
      logLevel: "debug",
    });
  });

  it("rejects an invalid LOG_LEVEL", () => {
    expect(() => loadConfig({ LOG_LEVEL: "nope" })).toThrow(/Invalid LOG_LEVEL/u);
  });
});
