import {
  CreateQueueCommand,
  GetQueueUrlCommand,
  PurgeQueueCommand,
  QueueDoesNotExist,
  type SQSClient,
} from "@aws-sdk/client-sqs";

const THREE_DAYS_IN_SECONDS = String(60 * 60 * 24 * 3);

export async function ensureQueue(client: SQSClient, queueName: string): Promise<string> {
  try {
    const { QueueUrl } = await client.send(new GetQueueUrlCommand({ QueueName: queueName }));
    if (!QueueUrl) throw new Error(`GetQueueUrl for "${queueName}" returned no QueueUrl`);
    return QueueUrl;
  } catch (error) {
    if (!(error instanceof QueueDoesNotExist)) throw error;
  }

  const { QueueUrl } = await client.send(
    new CreateQueueCommand({
      QueueName: queueName,
      Attributes: { MessageRetentionPeriod: THREE_DAYS_IN_SECONDS },
    }),
  );
  if (!QueueUrl) throw new Error(`CreateQueue for "${queueName}" returned no QueueUrl`);
  return QueueUrl;
}

// Real SQS only allows a purge once every 60s; fine for local/e2e use.
export async function purgeQueue(client: SQSClient, queueUrl: string): Promise<void> {
  await client.send(new PurgeQueueCommand({ QueueUrl: queueUrl }));
}
