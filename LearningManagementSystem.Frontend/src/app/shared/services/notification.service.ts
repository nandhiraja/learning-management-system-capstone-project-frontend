import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  toasts = signal<ToastMessage[]>([]);
  private toastId = 0;

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const id = this.toastId++;
    const newToast: ToastMessage = { id, message, type };
    
    // Add to toast list
    this.toasts.update((current) => [...current, newToast]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: any) {
    let displayMessage = 'An error occurred';
    if (message) {
      if (typeof message === 'string') {
        displayMessage = message;
      } else if (message.error) {
        if (typeof message.error === 'string') {
          displayMessage = message.error;
        } else if (message.error.message) {
          displayMessage = message.error.message;
        } else if (message.error.errors) {
          const errors = Object.values(message.error.errors) as string[][];
          if (errors.length > 0 && errors[0].length > 0) {
            displayMessage = errors[0][0];
          }
        }
      } else if (message.message) {
        displayMessage = message.message;
      }
    }
    this.show(displayMessage, 'error');
  }

  warning(message: string) {
    this.show(message, 'warning');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  remove(id: number) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
