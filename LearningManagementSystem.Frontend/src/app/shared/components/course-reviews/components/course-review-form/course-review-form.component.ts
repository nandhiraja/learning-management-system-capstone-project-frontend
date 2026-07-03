import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-form-container glass-card">
      <h3 class="form-title">Write a Review</h3>
      <div class="rating-selector">
        <span class="rating-label">Rating:</span>
        <div class="stars">
          @for (star of [1, 2, 3, 4, 5]; track star) {
            <i 
              class="bi" 
              [class.bi-star-fill]="star <= (hoveredRating() || selectedRating())"
              [class.bi-star]="star > (hoveredRating() || selectedRating())"
              (mouseenter)="hoveredRating.set(star)"
              (mouseleave)="hoveredRating.set(0)"
              (click)="selectedRating.set(star)"
              aria-hidden="true"
            ></i>
          }
        </div>
      </div>
      
      <div class="comment-field mt-3">
        <label for="review-comment" class="form-label">Review Comment (Optional)</label>
        <textarea 
          id="review-comment" 
          class="form-control" 
          rows="3" 
          [(ngModel)]="comment" 
          placeholder="What did you think of this course?"
        ></textarea>
      </div>

      <div class="form-actions mt-3 text-end">
        <button 
          class="btn btn-primary" 
          [disabled]="selectedRating() === 0 || isSubmitting" 
          (click)="submitReview()"
        >
          @if (isSubmitting) {
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...
          } @else {
            Submit Review
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .review-form-container {
      padding: 20px;
      margin-bottom: 24px;
      border-radius: 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }
    .form-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--color-text);
    }
    .rating-selector {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .rating-label {
      font-weight: 500;
      color: var(--color-text-2);
    }
    .stars i {
      font-size: 1.5rem;
      color: #ffd700;
      cursor: pointer;
      transition: color 0.2s ease, transform 0.1s ease;
      margin-right: 4px;
    }
    .stars i:hover {
      transform: scale(1.1);
    }
  `]
})
export class CourseReviewFormComponent {
  @Input() isSubmitting = false;
  @Output() submitReviewEvent = new EventEmitter<{ rating: number; comment?: string }>();

  selectedRating = signal(0);
  hoveredRating = signal(0);
  comment = '';

  submitReview() {
    if (this.selectedRating() > 0) {
      this.submitReviewEvent.emit({
        rating: this.selectedRating(),
        comment: this.comment.trim() || undefined
      });
    }
  }

  resetForm() {
    this.selectedRating.set(0);
    this.comment = '';
  }
}
