import type { Order } from "../../domain/order/index.js";

export interface ReceivedOrder {
  order: Order;
  receiptHandle: string;
}
