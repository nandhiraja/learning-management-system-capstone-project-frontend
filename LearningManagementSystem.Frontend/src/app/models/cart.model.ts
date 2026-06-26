export interface CartItem {
  id: number; // courseId
  title: string;
  price: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export interface OrderResponse {
  id: number;
  externalId: string;
  amount: number;
  status: string;
}

export interface PaymentResponse {
  id: number;
  status: string;
  amount: number;
  paymentUrl?: string;
}
