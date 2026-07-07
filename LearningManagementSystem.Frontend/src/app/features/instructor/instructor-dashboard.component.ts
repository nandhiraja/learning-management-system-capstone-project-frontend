import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InstructorService } from '../../core/services/instructor.service';
import { NotificationService } from '../../shared/services/notification.service';
import { InstructorDashboardResponse } from '../../models/instructor.model';
import { CourseResponse } from '../../models/course.model';

// Child components imports
import { InstructorStatsComponent } from './components/instructor-stats/instructor-stats.component';
import { InstructorCoursesComponent } from './components/instructor-courses/instructor-courses.component';
import { InstructorDiscussionsComponent } from './components/instructor-discussions/instructor-discussions.component';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    InstructorStatsComponent,
    InstructorCoursesComponent,
    InstructorDiscussionsComponent
  ],
  templateUrl: './instructor-dashboard.component.html',
  styleUrl: './instructor-dashboard.component.css'
})
export class InstructorDashboardComponent implements OnInit {
  private instructorService = inject(InstructorService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Active Layout Tab: overview, courses, discussions
  protected activeTab = signal<string>('overview');

  // Loading States
  protected isLoadingStats = signal<boolean>(true);
  protected isLoadingCourses = signal<boolean>(false);

  // Data signals
  protected stats = signal<InstructorDashboardResponse | null>(null);
  protected courses = signal<CourseResponse[]>([]);

  ngOnInit() {
    this.loadStats();
  }

  protected setTab(tabName: string) {
    this.activeTab.set(tabName);
    if (tabName === 'overview') {
      this.loadStats();
    } else if (tabName === 'courses') {
      this.loadCourses();
    }
  }

  private loadStats() {
    this.isLoadingStats.set(true);
    this.instructorService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.isLoadingStats.set(false);
      },
      error: () => {
        this.notification.error('Failed to load dashboard metrics.');
        this.isLoadingStats.set(false);
      }
    });
  }

  private loadCourses() {
    this.isLoadingCourses.set(true);
    this.instructorService.getCourses().subscribe({
      next: (res) => {
        this.courses.set(res);
        this.isLoadingCourses.set(false);
      },
      error: () => {
        this.notification.error('Failed to load your courses directory.');
        this.isLoadingCourses.set(false);
      }
    });
  }

  protected handleCreateCourse() {
    this.router.navigate(['/instructor/courses/builder/new']);
  }

  protected handleArchiveCourse(event: { courseGuid: string; reason: string }) {
    this.instructorService.archiveCourse(event.courseGuid, event.reason).subscribe({
      next: () => {
        this.notification.success('Course unpublished/archived successfully.');
        this.loadCourses();
      },
      error: () => {
        this.notification.error('Failed to unpublish/archive the course.');
      }
    });
  }
}
