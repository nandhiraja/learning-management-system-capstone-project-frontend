import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../../core/services/course.service';
import { ReviewResponse } from '../../../models/course.model';
import { CourseReviewFormComponent } from './components/course-review-form/course-review-form.component';
import { CourseReviewListComponent } from './components/course-review-list/course-review-list.component';

@Component({
  selector: 'app-course-reviews',
  standalone: true,
  imports: [CommonModule, CourseReviewFormComponent, CourseReviewListComponent],
  template: `
    <section class="course-reviews-section mt-5" aria-labelledby="reviews-heading">
      <div class="section-header">
        <h2 id="reviews-heading" class="section-title">
          <i class="bi bi-star-half" aria-hidden="true"></i> Student Reviews
          <span class="reviews-count">{{ totalCount() }}</span>
        </h2>
      </div>

      <div class="reviews-content mt-4">
        @if (isEnrolled) {
          <app-course-review-form
            [isSubmitting]="isSubmitting()"
            (submitReviewEvent)="handleReviewSubmit($event)"
          ></app-course-review-form>
        }

        @if (errorMsg()) {
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle" aria-hidden="true"></i> {{ errorMsg() }}
          </div>
        }

        <app-course-review-list
          [reviews]="reviews()"
          [isLoading]="isLoading()"
          [hasMore]="hasMore()"
          (loadMoreEvent)="loadMore()"
        ></app-course-review-list>
      </div>
    </section>
  `,
  styles: [`
    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-title i {
      color: #ffd700;
    }
    .reviews-count {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-2);
      background-color: var(--color-border);
      padding: 4px 10px;
      border-radius: 12px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class CourseReviewsComponent implements OnInit {
  @Input({ required: true }) courseExternalId!: string;
  @Input() isEnrolled = false;

  private courseService = inject(CourseService);

  reviews = signal<ReviewResponse[]>([]);
  totalCount = signal(0);
  page = signal(1);
  pageSize = 10;

  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMsg = signal<string | null>(null);

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews(append = false) {
    if (this.isLoading()) return;
    
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.courseService.getCourseReviews(this.courseExternalId, this.page(), this.pageSize).subscribe({
      next: (res) => {
        if (append) {
          this.reviews.update(current => [...current, ...res.items]);
        } else {
          this.reviews.set(res.items);
        }
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load reviews', err);
        this.errorMsg.set('Failed to load reviews. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }

  loadMore() {
    this.page.update(p => p + 1);
    this.loadReviews(true);
  }

  hasMore(): boolean {
    return this.reviews().length < this.totalCount();
  }

  handleReviewSubmit(reviewData: { rating: number; comment?: string }) {
    this.isSubmitting.set(true);
    this.errorMsg.set(null);
    
    this.courseService.addCourseReview(this.courseExternalId, reviewData.rating, reviewData.comment).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        // Reload reviews from page 1 to show the newly added review at the top
        this.page.set(1);
        this.loadReviews(false);
      },
      error: (err) => {
        console.error('Failed to submit review', err);
        // Optionally handle specific error messages (e.g. "already reviewed")
        if (err.error && typeof err.error === 'string') {
          this.errorMsg.set(err.error);
        } else {
          this.errorMsg.set('Failed to submit review. You might have already reviewed this course.');
        }
        this.isSubmitting.set(false);
      }
    });
  }
}
