import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CartItem, CartResponse } from '../../models/cart.model';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../shared/services/notification.service';
import { CartItemListComponent } from './components/cart-item-list/cart-item-list.component';
import { CartSummaryComponent } from './components/cart-summary/cart-summary.component';
import { CreditCardFormComponent } from './components/credit-card-form/credit-card-form.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    CartItemListComponent,
    CartSummaryComponent,
    CreditCardFormComponent
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // States
  protected cart = signal<CartResponse | null>(null);
  protected isLoading = signal<boolean>(true);
  protected isCheckingOut = signal<boolean>(false);
  protected isSubmittingCard = signal<boolean>(false);
  
  // Set of selected Course IDs to purchase
  protected selectedIds = signal<Set<number>>(new Set<number>());

  // Credit Card modal state
  protected showCardForm = signal<boolean>(false);
  protected activePayment = signal<{ paymentId: number; transactionId: string; amount: number } | null>(null);

  // Derived selections
  protected selectedItems = computed<CartItem[]>(() => {
    const currentCart = this.cart();
    if (!currentCart) return [];
    return currentCart.items.filter(item => this.selectedIds().has(item.id));
  });

  ngOnInit() {
    this.handlePaymentCallbacks();
    this.loadCart();
  }

  private loadCart() {
    this.isLoading.set(true);
    this.cartService.getCart().subscribe({
      next: (res) => {
        this.cart.set(res);
        this.isLoading.set(false);

        // Check if we came from "Buy Now" for a specific course
        const buyNowIdParam = this.route.snapshot.queryParamMap.get('buyNowId');
        if (buyNowIdParam) {
          const buyNowId = parseInt(buyNowIdParam, 10);
          if (!isNaN(buyNowId) && res.items.some(i => i.id === buyNowId)) {
            // Auto-select only this course
            this.selectedIds.set(new Set<number>([buyNowId]));
            return;
          }
        }

        // Default: select all items
        const allIds = new Set<number>(res.items.map(i => i.id));
        this.selectedIds.set(allIds);
      },
      error: () => {
        this.notification.error('Failed to load cart items.');
        this.isLoading.set(false);
      }
    });
  }

  private handlePaymentCallbacks() {
    const status = this.route.snapshot.queryParamMap.get('paymentStatus');
    if (status) {
      if (status === 'success') {
        this.notification.success('Enrollment successful! Welcome to your new classes.');
        // Clean url query parameters
        this.router.navigate([], { queryParams: { paymentStatus: null }, queryParamsHandling: 'merge' });
      } else if (status === 'failed') {
        this.notification.error('Payment verification failed. Please try again.');
        this.router.navigate([], { queryParams: { paymentStatus: null }, queryParamsHandling: 'merge' });
      } else if (status === 'cancelled') {
        this.notification.warning('Payment was cancelled.');
        this.router.navigate([], { queryParams: { paymentStatus: null }, queryParamsHandling: 'merge' });
      }
    }
  }

  protected handleToggleSelect(courseId: number) {
    const current = new Set(this.selectedIds());
    if (current.has(courseId)) {
      current.delete(courseId);
    } else {
      current.add(courseId);
    }
    this.selectedIds.set(current);
  }

  protected handleToggleSelectAll() {
    const current = this.selectedIds();
    const items = this.cart()?.items || [];
    if (current.size === items.length) {
      this.selectedIds.set(new Set<number>());
    } else {
      this.selectedIds.set(new Set<number>(items.map(i => i.id)));
    }
  }

  protected handleRemoveItem(courseId: number) {
    this.cartService.removeFromCart(courseId).subscribe({
      next: () => {
        this.notification.success('Removed course from cart');
        // Delete from selection
        const nextSelect = new Set(this.selectedIds());
        nextSelect.delete(courseId);
        this.selectedIds.set(nextSelect);
        // Reload
        this.loadCart();
      },
      error: () => {
        this.notification.error('Failed to remove course from cart');
      }
    });
  }

  protected handleCheckout(paymentMethod: string) {
    const courseIds = Array.from(this.selectedIds());
    if (courseIds.length === 0) {
      this.notification.warning('Please select at least one course to checkout.');
      return;
    }

    this.isCheckingOut.set(true);

    // 1. Create order
    this.cartService.createOrder(courseIds).subscribe({
      next: (order) => {
        // 2. Create payment
        this.cartService.createPayment(order.id, paymentMethod).subscribe({
          next: (payment) => {
            this.isCheckingOut.set(false);
            if (paymentMethod === 'PayPal') {
              if (payment.paymentUrl) {
                // Redirect user to PayPal Sandbox checkout
                window.location.href = payment.paymentUrl;
              } else {
                this.notification.error('PayPal checkout URL not generated.');
              }
            } else if (paymentMethod === 'CreditCard') {
              // Open local mock credit card overlay
              this.activePayment.set({
                paymentId: payment.id,
                transactionId: order.externalId, // order external ID acts as trans ID
                amount: order.amount
              });
              this.showCardForm.set(true);
            }
          },
          error: (err) => {
            const msg = err.error?.message || err.error || 'Failed to initialize payment gateway session.';
            this.notification.error(msg);
            this.isCheckingOut.set(false);
          }
        });
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to place purchase order.';
        this.notification.error(msg);
        this.isCheckingOut.set(false);
      }
    });
  }

  protected handleCardSubmit() {
    const pay = this.activePayment();
    if (!pay) return;

    this.isSubmittingCard.set(true);

    // Mock verifying the payment
    this.cartService.verifyPayment(pay.paymentId, pay.transactionId, 'Success').subscribe({
      next: () => {
        this.isSubmittingCard.set(false);
        this.showCardForm.set(false);
        this.activePayment.set(null);
        this.notification.success('Credit card payment success! Enrolled successfully.');
        // Route to dashboard
        this.router.navigate(['/learning/dashboard']);
      },
      error: (err) => {
        this.isSubmittingCard.set(false);
        const msg = err.error?.message || err.error || 'Card verification failed.';
        this.notification.error(msg);
      }
    });
  }

  protected handleCardCancel() {
    this.showCardForm.set(false);
    this.activePayment.set(null);
    this.notification.warning('Mock Credit Card transaction cancelled.');
  }
}
