import type { MessageAttributeValue } from "@aws-sdk/client-sqs";

export function messageAttribute(value: string): MessageAttributeValue {
  return { DataType: "String", StringValue: value };
}
