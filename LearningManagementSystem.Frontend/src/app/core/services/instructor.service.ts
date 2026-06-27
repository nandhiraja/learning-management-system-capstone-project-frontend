import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { InstructorDashboardResponse, InstructorDiscussionResponse } from '../../models/instructor.model';
import { CourseResponse } from '../../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private api = inject(ApiService);

  // Get general statistics for instructor
  getDashboardStats(): Observable<InstructorDashboardResponse> {
    return this.api.get<InstructorDashboardResponse>('instructor/dashboard');
  }

  // Get courses taught by instructor
  getCourses(): Observable<CourseResponse[]> {
    return this.api.get<CourseResponse[]>('instructor/courses');
  }

  // Get discussion threads for the instructor's courses
  getDiscussions(unansweredOnly?: boolean): Observable<InstructorDiscussionResponse[]> {
    let path = 'instructor/discussions';
    if (unansweredOnly !== undefined) {
      path += `?unansweredOnly=${unansweredOnly}`;
    }
    return this.api.get<InstructorDiscussionResponse[]>(path);
  }
}
