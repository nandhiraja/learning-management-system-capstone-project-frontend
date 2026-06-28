import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseResponse } from '../../../../../../models/course.model';
import { InstructorService } from '../../../../../../core/services/instructor.service';
import { NotificationService } from '../../../../../../shared/services/notification.service';
import { BadgeChipComponent } from '../../../../../../shared/components/badge-chip/badge-chip.component';

@Component({
  selector: 'app-course-publish',
  standalone: true,
  imports: [CommonModule, BadgeChipComponent],
  templateUrl: './course-publish.component.html',
  styleUrl: './course-publish.component.css'
})
export class CoursePublishComponent {
  private instructorService = inject(InstructorService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  @Input({ required: true }) course: CourseResponse | null = null;

  protected isSubmitting = signal<boolean>(false);

  // Computations for validation checklists
  protected hasBasicDetails = computed(() => {
    return !!(this.course?.title && this.course?.description);
  });

  protected hasThumbnail = computed(() => {
    return !!this.course?.thumbnailUrl;
  });

  protected hasSections = computed(() => {
    return (this.course?.sections?.length || 0) > 0;
  });

  protected hasLectures = computed(() => {
    if (!this.course?.sections || this.course.sections.length === 0) return false;
    return this.course.sections.some(sec => sec.lectures && sec.lectures.length > 0);
  });

  protected totalLectures = computed(() => {
    if (!this.course?.sections) return 0;
    return this.course.sections.reduce((total, sec) => total + (sec.lectures?.length || 0), 0);
  });

  // Course is ready to submit if basic details, sections and lectures are all completed
  protected isCourseReady = computed(() => {
    return this.hasBasicDetails() && this.hasSections() && this.hasLectures();
  });

  protected submitReview() {
    if (!this.course || !this.isCourseReady()) return;

    this.isSubmitting.set(true);
    this.instructorService.submitForReview(this.course.externalId).subscribe({
      next: () => {
        this.notification.success('Course submitted successfully for Admin review!');
        this.isSubmitting.set(false);
        this.router.navigate(['/instructor/dashboard']);
      },
      error: (err) => {
        this.notification.error(err.error || 'Failed to submit course for review.');
        this.isSubmitting.set(false);
      }
    });
  }
}
