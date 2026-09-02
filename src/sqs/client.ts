import { SQSClient } from "@aws-sdk/client-sqs";
import type { AppConfig } from "../config/env/index.js";

export function createSqsClient(config: AppConfig): SQSClient {
  if (config.endpoint) {
    // ElasticMQ ignores these credentials, but the SDK v3 requires something to sign requests with.
    return new SQSClient({
      region: config.region,
      endpoint: config.endpoint,
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    });
  }
  return new SQSClient({ region: config.region });
}
