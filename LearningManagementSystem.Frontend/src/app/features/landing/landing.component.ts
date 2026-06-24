import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  auth = inject(AuthService);
  router = inject(Router);

  onSearch(event: Event, searchVal: string) {
    event.preventDefault();
    if (searchVal.trim()) {
      this.router.navigate(['/courses'], { queryParams: { q: searchVal.trim() } });
    } else {
      this.router.navigate(['/courses']);
    }
  }
}
