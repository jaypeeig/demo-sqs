import type { Order } from "../../domain/order/index.js";

export interface SendResult {
  order: Order;
  messageId: string;
}
