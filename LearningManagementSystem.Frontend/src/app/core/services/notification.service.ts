import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  
  private notificationsSignal = signal<NotificationItem[]>([]);
  public notifications = computed(() => this.notificationsSignal());
  public unreadCount = computed(() => this.notificationsSignal().filter(n => !n.isRead).length);

  private hubConnection: signalR.HubConnection | null = null;

  constructor() {
    // Automatically manage connection based on user authentication status
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.fetchNotifications();
        this.startSignalRConnection();
      } else {
        this.stopSignalRConnection();
        this.notificationsSignal.set([]);
      }
    });
  }

  public fetchNotifications() {
    this.api.get<NotificationItem[]>('notifications').subscribe({
      next: (data) => {
        this.notificationsSignal.set(data);
      },
      error: (err) => console.error('Failed to fetch notifications:', err)
    });
  }

  private startSignalRConnection() {
    if (this.hubConnection) {
      return;
    }

    const token = localStorage.getItem('lms_access_token');
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.backendUrl}/notificationHub`, {
        accessTokenFactory: () => localStorage.getItem('lms_access_token') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR NotificationHub connected.'))
      .catch(err => console.error('Error starting SignalR connection:', err));

    this.hubConnection.on('ReceiveNotification', (newNotif: NotificationItem) => {
      // Add new notification at the top
      this.notificationsSignal.update(list => [newNotif, ...list]);
    });
  }

  private stopSignalRConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => {
          this.hubConnection = null;
          console.log('SignalR connection stopped.');
        })
        .catch(err => console.error('Error stopping SignalR connection:', err));
    }
  }

  public markAsRead(id: number) {
    this.api.put(`notifications/${id}/read`, {}).subscribe({
      next: () => {
        this.notificationsSignal.update(list => 
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      },
      error: (err) => console.error('Failed to mark notification as read:', err)
    });
  }

  public markAllAsRead() {
    this.api.put('notifications/read-all', {}).subscribe({
      next: () => {
        this.notificationsSignal.update(list => 
          list.map(n => ({ ...n, isRead: true }))
        );
      },
      error: (err) => console.error('Failed to mark all notifications as read:', err)
    });
  }

  public deleteNotification(id: number) {
    this.api.delete(`notifications/${id}`).subscribe({
      next: () => {
        this.notificationsSignal.update(list => list.filter(n => n.id !== id));
      },
      error: (err) => console.error('Failed to delete notification:', err)
    });
  }
}
