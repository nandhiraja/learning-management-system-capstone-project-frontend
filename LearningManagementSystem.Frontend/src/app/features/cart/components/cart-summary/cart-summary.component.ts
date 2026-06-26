import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../../../models/cart.model';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-summary.component.html',
  styleUrl: './cart-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartSummaryComponent {
  @Input({ required: true }) selectedItems: CartItem[] = [];
  @Input({ required: true }) isCheckingOut = false;

  @Output() checkout = new EventEmitter<string>();

  protected selectedMethod = signal<string>('PayPal');

  get totalPrice(): number {
    return this.selectedItems.reduce((sum, item) => sum + item.price, 0);
  }

  selectMethod(method: string) {
    this.selectedMethod.set(method);
  }

  onCheckout() {
    if (this.selectedItems.length === 0) return;
    this.checkout.emit(this.selectedMethod());
  }
}
