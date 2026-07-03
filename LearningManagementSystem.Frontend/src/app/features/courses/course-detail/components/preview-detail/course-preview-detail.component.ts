import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseResponse } from '../../../../../models/course.model';
import { CourseService } from '../../../../../core/services/course.service';
import { CartService } from '../../../../../core/services/cart.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { CoursePreviewHeroComponent } from './components/preview-hero/preview-hero.component';
import { CoursePreviewCurriculumComponent } from './components/preview-curriculum/preview-curriculum.component';
import { CoursePreviewSidebarComponent } from './components/preview-sidebar/preview-sidebar.component';
import { CourseReviewsComponent } from '../../../../../shared/components/course-reviews/course-reviews.component';

@Component({
  selector: 'app-course-preview-detail',
  standalone: true,
  imports: [
    CommonModule,
    CoursePreviewHeroComponent,
    CoursePreviewCurriculumComponent,
    CoursePreviewSidebarComponent,
    CourseReviewsComponent
  ],
  templateUrl: './course-preview-detail.component.html',
  styleUrl: './course-preview-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursePreviewDetailComponent {
  @Input({ required: true }) course!: CourseResponse;
  @Output() onEnrolled = new EventEmitter<void>();

  private courseService = inject(CourseService);
  private cartService = inject(CartService);
  private notification = inject(NotificationService);
  protected auth = inject(AuthService);
  private router = inject(Router);

  protected isAddingToCart = signal<boolean>(false);
  protected isBuyingNow = signal<boolean>(false);

  handleAddToCart() {
    if (!this.auth.currentUser()) {
      this.notification.warning('Please log in or register to purchase or enroll in this course.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isAddingToCart.set(true);
    this.cartService.addToCart(this.course.id).subscribe({
      next: () => {
        this.notification.success('Course added to your cart successfully!');
        this.isAddingToCart.set(false);
      },
      error: (err) => {
        const errorMsg = err.error?.message || err.error || 'Failed to add course to cart or already added.';
        this.notification.warning(errorMsg);
        this.isAddingToCart.set(false);
      }
    });
  }

  handleBuyNow() {
    if (!this.auth.currentUser()) {
      this.notification.warning('Please log in or register to purchase or enroll in this course.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isBuyingNow.set(true);
    this.cartService.addToCart(this.course.id).subscribe({
      next: () => {
        this.isBuyingNow.set(false);
        this.router.navigate(['/cart'], { queryParams: { buyNowId: this.course.id } });
      },
      error: () => {
        // Even if it's already in the cart, navigate to cart
        this.isBuyingNow.set(false);
        this.router.navigate(['/cart'], { queryParams: { buyNowId: this.course.id } });
      }
    });
  }
}
