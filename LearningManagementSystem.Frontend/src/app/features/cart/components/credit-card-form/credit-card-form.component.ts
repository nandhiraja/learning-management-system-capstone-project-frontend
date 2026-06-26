import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-credit-card-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credit-card-form.component.html',
  styleUrl: './credit-card-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditCardFormComponent {
  @Input({ required: true }) amount = 0;
  @Input() isSubmitting = false;

  @Output() submitPay = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // Live Card Preview state signals
  protected cardNumber = signal<string>('');
  protected cardHolder = signal<string>('');
  protected cardExpiry = signal<string>('');
  protected cardCvv = signal<string>('');
  protected isFlipped = signal<boolean>(false);

  // Form errors
  protected errors = signal<{ [key: string]: string }>({});

  formattedCardNumber(): string {
    const raw = this.cardNumber().replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = raw.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return this.cardNumber() ? raw : '•••• •••• •••• ••••';
    }
  }

  onNumberInput(val: string) {
    // Format card number to have spaces every 4 characters
    const numbersOnly = val.replace(/\D/g, '').substring(0, 16);
    this.cardNumber.set(numbersOnly);
  }

  onHolderInput(val: string) {
    this.cardHolder.set(val.toUpperCase().substring(0, 26));
  }

  onExpiryInput(val: string) {
    // Force MM/YY format
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    this.cardExpiry.set(cleaned.substring(0, 5));
  }

  onCvvInput(val: string) {
    this.cardCvv.set(val.replace(/\D/g, '').substring(0, 3));
  }

  onCvvFocus() {
    this.isFlipped.set(true);
  }

  onCvvBlur() {
    this.isFlipped.set(false);
  }

  onSubmit() {
    const errs: { [key: string]: string } = {};

    if (this.cardNumber().length < 16) {
      errs['number'] = 'Card number must be 16 digits';
    }
    if (!this.cardHolder().trim()) {
      errs['holder'] = 'Cardholder name is required';
    }
    if (!/^\d{2}\/\d{2}$/.test(this.cardExpiry())) {
      errs['expiry'] = 'Use MM/YY format';
    }
    if (this.cardCvv().length < 3) {
      errs['cvv'] = 'CVV must be 3 digits';
    }

    this.errors.set(errs);

    if (Object.keys(errs).length === 0) {
      this.submitPay.emit();
    }
  }

  onClose() {
    this.cancel.emit();
  }
}
