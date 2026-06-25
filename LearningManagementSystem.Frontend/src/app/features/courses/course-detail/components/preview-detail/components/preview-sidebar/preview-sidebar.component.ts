import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseResponse } from '../../../../../../../models/course.model';

@Component({
  selector: 'app-course-preview-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-sidebar.component.html',
  styleUrl: './preview-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursePreviewSidebarComponent {
  @Input({ required: true }) course!: CourseResponse;
  @Input() isAddingToCart = false;
  @Input() isBuyingNow = false;

  @Output() addToCart = new EventEmitter<void>();
  @Output() buyNow = new EventEmitter<void>();

  handleAddToCart() {
    this.addToCart.emit();
  }

  handleBuyNow() {
    this.buyNow.emit();
  }
}
