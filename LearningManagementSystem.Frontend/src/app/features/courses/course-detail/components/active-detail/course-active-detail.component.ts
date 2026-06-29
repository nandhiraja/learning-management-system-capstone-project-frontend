import { Component, Input, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseResponse, LectureResponse } from '../../../../../models/course.model';
import { EnrollmentService } from '../../../../../core/services/enrollment.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { BadgeChipComponent } from '../../../../../shared/components/badge-chip/badge-chip.component';
import { ClassroomSidebarComponent } from './components/classroom-sidebar/classroom-sidebar.component';
import { ClassroomQuizComponent } from './components/classroom-quiz/classroom-quiz.component';
import { ClassroomDiscussionComponent } from './components/classroom-discussion/classroom-discussion.component';
import { ClassroomPlayerComponent } from './components/classroom-player/classroom-player.component';

@Component({
  selector: 'app-course-active-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BadgeChipComponent,
    ClassroomSidebarComponent,
    ClassroomQuizComponent,
    ClassroomDiscussionComponent,
    ClassroomPlayerComponent
  ],
  templateUrl: './course-active-detail.component.html',
  styleUrl: './course-active-detail.component.css'
})
export class CourseActiveDetailComponent implements OnInit {
  @Input({ required: true }) course!: CourseResponse;
  @Input() isInstructor = false;

  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  // States
  protected activeLecture = signal<LectureResponse | null>(null);
  protected enrollmentId = signal<number | null>(null);
  protected completedLectureIds = signal<number[]>([]);
  protected activeTab = signal<'lecture' | 'discussion' | 'quiz'>('lecture');
  protected isLoading = signal<boolean>(true);
  protected isSidebarOpen = signal<boolean>(true);
  
  // Certificate Modal States
  protected isCertificateModalOpen = signal<boolean>(false);
  protected activeCertificate = signal<any | null>(null);

  // Computed totals
  protected totalLectures = computed(() => {
    return this.course.sections.reduce((acc, curr) => acc + curr.lectures.length, 0);
  });

  protected isCourseInstructor = computed(() => {
    const user = this.authService.currentUser();
    return this.course?.instructor?.email === user?.email;
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
        this.checkCertificateAward();
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

  toggleProgress(lectureId: number, event?: Event) {
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
        this.checkCertificateAward();
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
      this.toggleProgress(lec.id);
    }
  }

  // Certificate workflows
  checkCertificateAward() {
    if (this.progressPercent() === 100) {
      this.fetchCertificate();
    } else {
      this.activeCertificate.set(null);
    }
  }

  fetchCertificate() {
    this.enrollmentService.getCertificates().subscribe({
      next: (certs) => {
        const cert = certs.find(c => c.courseGuid === this.course.externalId);
        if (cert) {
          this.activeCertificate.set(cert);
        } else {
          this.generateMockCertificate();
        }
      },
      error: (err) => {
        console.error('Failed to load certificates list', err);
        this.generateMockCertificate();
      }
    });
  }

  generateMockCertificate() {
    const user = this.authService.currentUser();
    const fullName = user ? `${user.firstName} ${user.lastName}` : 'Enrolled Student';
    this.activeCertificate.set({
      id: 0,
      issuedDate: new Date().toISOString(),
      certificateUrl: `/certificates/verify/mock-${this.course.externalId}`,
      userGuid: user?.externalId || '',
      userFullName: fullName,
      courseGuid: this.course.externalId,
      courseTitle: this.course.title,
      instructorName: `${this.course.instructor.firstName} ${this.course.instructor.lastName}`
    });
  }

  openCertificateModal() {
    if (this.progressPercent() === 100) {
      if (!this.activeCertificate()) {
        this.fetchCertificate();
      }
      this.isCertificateModalOpen.set(true);
    }
  }

  closeCertificateModal() {
    this.isCertificateModalOpen.set(false);
  }
}
