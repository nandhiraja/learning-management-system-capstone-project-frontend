import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { CartResponse, OrderResponse, PaymentResponse } from '../../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private api = inject(ApiService);

  getCart(): Observable<CartResponse> {
    return this.api.get<CartResponse>('cart');
  }

  addToCart(courseId: number): Observable<any> {
    return this.api.post<any>('cart', { courseId });
  }

  removeFromCart(courseId: number): Observable<any> {
    return this.api.delete<any>(`cart/${courseId}`);
  }

  createOrder(courseIds: number[]): Observable<OrderResponse> {
    return this.api.post<OrderResponse>('orders', { courseIds });
  }

  createPayment(orderId: number, paymentMethod: string): Observable<PaymentResponse> {
    return this.api.post<PaymentResponse>('payments', { orderId, paymentMethod });
  }

  verifyPayment(paymentId: number, transactionId: string, status: string): Observable<any> {
    return this.api.post<any>('payments/verify', { paymentId, transactionId, status });
  }
}
