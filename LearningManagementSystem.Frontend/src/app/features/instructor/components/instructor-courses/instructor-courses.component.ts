import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseResponse } from '../../../../models/course.model';
import { BadgeChipComponent, ChipVariant } from '../../../../shared/components/badge-chip/badge-chip.component';

@Component({
  selector: 'app-instructor-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeChipComponent, FormsModule],
  templateUrl: './instructor-courses.component.html',
  styleUrl: './instructor-courses.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstructorCoursesComponent {
  @Input({ required: true }) courses: CourseResponse[] = [];
  @Output() createCourse = new EventEmitter<void>();
  @Output() archiveCourse = new EventEmitter<{ courseGuid: string; reason: string }>();

  protected isArchiveModalOpen = signal<boolean>(false);
  protected archiveReason = '';
  protected activeCourseGuid = '';

  protected onArchive(courseGuid: string) {
    this.activeCourseGuid = courseGuid;
    this.archiveReason = '';
    this.isArchiveModalOpen.set(true);
  }

  protected closeArchiveModal() {
    this.isArchiveModalOpen.set(false);
  }

  protected submitArchive() {
    if (this.archiveReason.trim()) {
      this.archiveCourse.emit({ courseGuid: this.activeCourseGuid, reason: this.archiveReason.trim() });
      this.isArchiveModalOpen.set(false);
    }
  }

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
      case 'archived':
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
      case 'archived':
        return 'Archived';
      default:
        return status || 'Unknown';
    }
  }
}
