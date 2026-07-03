import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InstructorService } from '../../../../core/services/instructor.service';
import { CourseService } from '../../../../core/services/course.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { CourseResponse } from '../../../../models/course.model';

// Subcomponent imports
import { CourseBasicInfoComponent } from './components/course-basic-info/course-basic-info.component';
import { CourseCurriculumComponent } from './components/course-curriculum/course-curriculum.component';
import { CoursePublishComponent } from './components/course-publish/course-publish.component';

@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CourseBasicInfoComponent,
    CourseCurriculumComponent,
    CoursePublishComponent
  ],
  templateUrl: './course-builder.component.html',
  styleUrl: './course-builder.component.css'
})
export class CourseBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private instructorService = inject(InstructorService);
  private courseService = inject(CourseService);
  private notification = inject(NotificationService);

  // Active step: basic, curriculum, publish
  protected activeTab = signal<'basic' | 'curriculum' | 'publish'>('basic');
  
  // Course signals
  protected courseId = signal<string | null>(null);
  protected isEditMode = signal<boolean>(false);
  protected course = signal<CourseResponse | null>(null);
  protected isLoading = signal<boolean>(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.courseId.set(id);
        this.isEditMode.set(true);
        this.loadCourseDetails(id);
      } else {
        this.courseId.set(null);
        this.isEditMode.set(false);
        this.course.set(null);
        this.activeTab.set('basic');
      }
    });
  }

  loadCourseDetails(id: string, silent = false) {
    if (!silent) {
      this.isLoading.set(true);
    }
    this.courseService.getCourseById(id).subscribe({
      next: (data) => {
        // cast Course to CourseResponse
        this.course.set(data as CourseResponse);
        if (!silent) {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.notification.error('Failed to load course details.');
        if (!silent) {
          this.isLoading.set(false);
        }
        this.router.navigate(['/instructor/dashboard']);
      }
    });
  }

  protected setTab(tab: 'basic' | 'curriculum' | 'publish') {
    if (!this.isEditMode() && tab !== 'basic') {
      this.notification.warning('Please save course basic info first.');
      return;
    }
    this.activeTab.set(tab);
    // Refresh course details to ensure subcomponents have latest state
    if (this.courseId()) {
      this.loadCourseDetails(this.courseId()!);
    }
  }

  // Handle course saved (both new and update)
  protected onCourseSaved(savedCourse: CourseResponse) {
    const currentId = this.courseId();
    this.course.set(savedCourse);
    if (!this.isEditMode()) {
      this.notification.success('Course created! Now let\'s build the curriculum.');
      // Navigate to the editor route for this course guid
      this.router.navigate(['/instructor/courses/builder', savedCourse.externalId]).then(() => {
        this.activeTab.set('curriculum');
      });
    } else if (currentId !== savedCourse.externalId) {
      this.notification.success('Basic course details saved. Editing in draft version.');
      this.router.navigate(['/instructor/courses/builder', savedCourse.externalId]).then(() => {
        this.activeTab.set('curriculum');
      });
    } else {
      this.notification.success('Basic course details updated successfully.');
      this.setTab('curriculum');
    }
  }
}
