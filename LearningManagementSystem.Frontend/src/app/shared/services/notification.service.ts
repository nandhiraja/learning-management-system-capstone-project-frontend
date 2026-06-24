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

  error(message: string) {
    this.show(message, 'error');
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
