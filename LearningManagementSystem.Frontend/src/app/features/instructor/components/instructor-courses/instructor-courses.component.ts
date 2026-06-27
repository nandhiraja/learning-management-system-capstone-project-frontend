import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseResponse } from '../../../../models/course.model';
import { BadgeChipComponent, ChipVariant } from '../../../../shared/components/badge-chip/badge-chip.component';

@Component({
  selector: 'app-instructor-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeChipComponent],
  templateUrl: './instructor-courses.component.html',
  styleUrl: './instructor-courses.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstructorCoursesComponent {
  @Input({ required: true }) courses: CourseResponse[] = [];
  @Output() createCourse = new EventEmitter<void>();

  getStatusVariant(status: string): ChipVariant {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'success';
      case 'pendingreview':
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      case 'draft':
        return 'purple';
      default:
        return 'accent';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'Published';
      case 'pendingreview':
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      case 'draft':
        return 'Draft';
      default:
        return status || 'Unknown';
    }
  }
}
