import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  router = inject(Router);
  elementRef = inject(ElementRef);

  isMobileMenuOpen = false;
  isProfileDropdownOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isProfileDropdownOpen = false; // Close desktop dropdown when opening mobile menu
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  toggleProfileDropdown(event: Event) {
    event.stopPropagation();
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  closeProfileDropdown() {
    this.isProfileDropdownOpen = false;
  }

  onSearch(event: Event, searchVal: string) {
    event.preventDefault();
    if (searchVal.trim()) {
      this.router.navigate(['/courses'], { queryParams: { q: searchVal.trim() } });
      this.closeMobileMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isProfileDropdownOpen = false;
    }
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
