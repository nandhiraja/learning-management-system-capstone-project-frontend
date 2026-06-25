import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/services/auth.service';
import { CourseResponse } from '../../../models/course.model';
import { CoursePreviewDetailComponent } from './components/preview-detail/course-preview-detail.component';
import { CourseActiveDetailComponent } from './components/active-detail/course-active-detail.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, CoursePreviewDetailComponent, CourseActiveDetailComponent],
  template: `
    <div class="container-fluid" style="padding: 0;">
      @if (isLoading()) {
        <div class="loading-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 24px; gap: 16px;">
          <div class="spinner"></div>
          <p style="color: var(--color-text-2); font-weight: 500;">Loading course details...</p>
        </div>
      } @else if (course(); as courseData) {
        @if (isEnrolled() || isInstructor() || isAdmin()) {
          <app-course-active-detail [course]="courseData" [isInstructor]="isInstructor()"></app-course-active-detail>
        } @else {
          <app-course-preview-detail [course]="courseData" (onEnrolled)="fetchDetails()"></app-course-preview-detail>
        }
      } @else {
        <div class="error-container" style="text-align: center; padding: 80px 24px; max-width: 500px; margin: 40px auto;" class="glass-card">
          <i class="bi bi-exclamation-triangle" style="font-size: 48px; color: var(--color-danger);" aria-hidden="true"></i>
          <h2 style="font-size: 18px; margin-top: 16px; font-weight: 700; color: var(--color-text);">Course not found</h2>
          <p style="color: var(--color-text-2); margin-top: 8px;">The course you are looking for does not exist, has been archived, or you lack permission to view it.</p>
        </div>
      }
    </div>
  `
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private auth = inject(AuthService);

  protected course = signal<CourseResponse | null>(null);
  protected isEnrolled = signal<boolean>(false);
  protected isInstructor = signal<boolean>(false);
  protected isAdmin = signal<boolean>(false);
  protected isLoading = signal<boolean>(true);

  private courseGuid = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseGuid = id;
        this.fetchDetails();
      }
    });
  }

  fetchDetails() {
    this.isLoading.set(true);
    
    const requests: Record<string, any> = {
      courseData: this.courseService.getCourseById(this.courseGuid)
    };

    // If logged in, fetch enrollments to check enrollment status
    if (this.auth.currentUser()) {
      requests['enrollments'] = this.enrollmentService.getEnrolledCourses();
    }

    forkJoin(requests).subscribe({
      next: ({ courseData, enrollments }) => {
        const fullCourse = courseData as CourseResponse;
        this.course.set(fullCourse);

        if (fullCourse) {
          const user = this.auth.currentUser();
          if (user) {
            this.isAdmin.set(user.role === 'Admin');
            
            // Check if user is the course instructor
            if (fullCourse.instructor && user.email === fullCourse.instructor.email) {
              this.isInstructor.set(true);
            }

            // Check if user is enrolled
            if (enrollments) {
              const enrolled = (enrollments as any[]).some((e: any) => e.courseExternalId === fullCourse.externalId);
              this.isEnrolled.set(enrolled);
            }
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load course details', err);
        this.isLoading.set(false);
        this.course.set(null);
      }
    });
  }
}
