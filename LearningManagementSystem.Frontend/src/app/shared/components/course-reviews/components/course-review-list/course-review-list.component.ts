import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewResponse } from '../../../../../models/course.model';

@Component({
  selector: 'app-course-review-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="review-list-container">
      @if (reviews.length === 0 && !isLoading) {
        <div class="no-reviews glass-card">
          <i class="bi bi-chat-square-text text-muted" aria-hidden="true"></i>
          <p class="mt-2 text-secondary">No reviews yet. Be the first to review this course!</p>
        </div>
      }

      <div class="reviews-grid">
        @for (review of reviews; track review.id) {
          <div class="review-card glass-card">
            <div class="review-header">
              @if (review.profilePictureUrl) {
                <img [src]="review.profilePictureUrl" alt="Reviewer Avatar" class="reviewer-avatar-img" />
              } @else {
                <div class="reviewer-avatar animate-avatar">
                  {{ getInitials(review) }}
                </div>
              }
              <div class="reviewer-info">
                <h4 class="reviewer-name">{{ review.userFullName || review.userName }}</h4>
                <div class="review-stars">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <i class="bi" [class.bi-star-fill]="star <= review.rating" [class.bi-star]="star > review.rating" aria-hidden="true"></i>
                  }
                </div>
              </div>
            </div>
            @if (review.comment) {
              <div class="review-body">
                <p>{{ review.comment }}</p>
              </div>
            }
          </div>
        }
      </div>

      @if (hasMore) {
        <div class="load-more-container mt-4 text-center">
          <button class="btn btn-outline-secondary load-more-btn" (click)="loadMoreEvent.emit()" [disabled]="isLoading">
            @if (isLoading) {
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...
            } @else {
              Load More Reviews
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .review-list-container {
      margin-top: 24px;
    }
    .no-reviews {
      text-align: center;
      padding: 40px 20px;
      border-radius: 12px;
    }
    .no-reviews i {
      font-size: 2.5rem;
    }
    .reviews-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 768px) {
      .reviews-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .review-card {
      padding: 20px;
      border-radius: 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .review-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .reviewer-avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--color-border);
    }
    .reviewer-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.95rem;
    }
    .reviewer-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .review-stars {
      color: #ffd700;
      font-size: 0.875rem;
    }
    .review-body p {
      margin: 0;
      color: var(--color-text-2);
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .load-more-btn {
      min-width: 200px;
      border-radius: 20px;
    }
  `]
})
export class CourseReviewListComponent {
  @Input() reviews: ReviewResponse[] = [];
  @Input() hasMore = false;
  @Input() isLoading = false;
  
  @Output() loadMoreEvent = new EventEmitter<void>();

  getInitials(review: ReviewResponse): string {
    const name = review.userFullName || review.userName || '';
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }
}
