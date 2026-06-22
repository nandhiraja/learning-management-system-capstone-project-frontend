import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { NotificationService } from './shared/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  notificationService = inject(NotificationService);
  router = inject(Router);

  showNavbar = signal<boolean>(true);
  showFooter = signal<boolean>(true);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url || '';
        
        // Hide header/navbar and footer on authorization screens
        const isAuth = url.includes('/auth') || url.includes('/login') || url.includes('/register');
        
        this.showNavbar.set(!isAuth);
        
        // Hide footer on auth pages and profile page
        this.showFooter.set(!isAuth && !url.includes('/profile'));
      }
    });
  }
}
