import { Component, Input, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseResponse, LectureResponse } from '../../../../../models/course.model';
import { EnrollmentService } from '../../../../../core/services/enrollment.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { BadgeChipComponent } from '../../../../../shared/components/badge-chip/badge-chip.component';
import { ClassroomSidebarComponent } from './components/classroom-sidebar/classroom-sidebar.component';
import { ClassroomQuizComponent } from './components/classroom-quiz/classroom-quiz.component';
import { ClassroomDiscussionComponent } from './components/classroom-discussion/classroom-discussion.component';

@Component({
  selector: 'app-course-active-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BadgeChipComponent,
    ClassroomSidebarComponent,
    ClassroomQuizComponent,
    ClassroomDiscussionComponent
  ],
  templateUrl: './course-active-detail.component.html',
  styleUrl: './course-active-detail.component.css'
})
export class CourseActiveDetailComponent implements OnInit {
  @Input({ required: true }) course!: CourseResponse;
  @Input() isInstructor = false;

  private enrollmentService = inject(EnrollmentService);
  private notification = inject(NotificationService);

  // States
  protected activeLecture = signal<LectureResponse | null>(null);
  protected enrollmentId = signal<number | null>(null);
  protected completedLectureIds = signal<number[]>([]);
  protected activeTab = signal<'lecture' | 'discussion' | 'quiz'>('lecture');
  protected isLoading = signal<boolean>(true);

  // Computed totals
  protected totalLectures = computed(() => {
    return this.course.sections.reduce((acc, curr) => acc + curr.lectures.length, 0);
  });

  protected progressPercent = computed(() => {
    const total = this.totalLectures();
    if (total === 0) return 0;
    return Math.round((this.completedLectureIds().length / total) * 100);
  });

  ngOnInit() {
    this.initializeClassroom();
  }

  initializeClassroom() {
    this.isLoading.set(true);
    this.enrollmentService.getEnrolledCourses().subscribe({
      next: (enrollments) => {
        const matchingEnrollment = enrollments.find(e => e.courseExternalId === this.course.externalId);
        if (matchingEnrollment) {
          this.enrollmentId.set(matchingEnrollment.id);
          this.fetchProgress(matchingEnrollment.id);
        } else {
          // Fallback if not enrolled but has access (Admin / Instructor)
          this.selectFirstLecture();
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load active course user profile state', err);
        this.selectFirstLecture();
        this.isLoading.set(false);
      }
    });
  }

  fetchProgress(enrollId: number) {
    this.enrollmentService.getCourseProgress(enrollId).subscribe({
      next: (prog) => {
        if (prog && prog.completedLectureIds) {
          this.completedLectureIds.set(prog.completedLectureIds);
        }
        this.selectFirstLecture();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load progress state', err);
        this.selectFirstLecture();
        this.isLoading.set(false);
      }
    });
  }

  selectFirstLecture() {
    if (this.course.sections.length > 0 && this.course.sections[0].lectures.length > 0) {
      this.selectLecture(this.course.sections[0].lectures[0]);
    }
  }

  selectLecture(lecture: LectureResponse) {
    this.activeLecture.set(lecture);
    this.activeTab.set('lecture');
  }

  isCompleted(lectureId: number): boolean {
    return this.completedLectureIds().includes(lectureId);
  }

  toggleProgress(lectureId: number, event: Event) {
    const enrollId = this.enrollmentId();
    if (!enrollId) return;

    const currentlyCompleted = this.isCompleted(lectureId);
    const newStatus = !currentlyCompleted;

    this.enrollmentService.updateLectureProgress(enrollId, lectureId, newStatus).subscribe({
      next: () => {
        if (newStatus) {
          this.completedLectureIds.update(ids => [...ids, lectureId]);
          this.notification.success('Lecture marked as completed!');
        } else {
          this.completedLectureIds.update(ids => ids.filter(id => id !== lectureId));
          this.notification.info('Lecture marked as incomplete.');
        }
      },
      error: (err) => {
        this.notification.error('Failed to update progress status.');
        console.error(err);
      }
    });
  }

  onQuizPassed() {
    const lec = this.activeLecture();
    if (lec && !this.isCompleted(lec.id)) {
      this.toggleProgress(lec.id, new MouseEvent('click'));
    }
  }
}
