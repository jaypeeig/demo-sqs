# demo-sqs
SQS Demo using node.js for Solutions Monthly BrownBag Session

```mermaid
sequenceDiagram
  participant Producer
  participant SQS Queue
  participant Consumer

  Producer ->> SQS Queue: Send message
  SQS Queue ->> Consumer: Consume message
  Consumer ->> SQS Queue: Delete message
```
