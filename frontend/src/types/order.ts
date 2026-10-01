export type OrderId = string;

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type OrderItem = {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPriceInPaise: number;
};

export type Order = {
  id: OrderId;
  status: OrderStatus;
  items: OrderItem[];
  totalInPaise: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
};
