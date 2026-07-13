import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { InstructorDashboardResponse, InstructorDiscussionResponse } from '../../models/instructor.model';
import { CourseResponse } from '../../models/course.model';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

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

  // Create new course
  createCourse(payload: { title: string; description: string; categoryId: number; language: string; price: number; thumbnailUrl: string | null }): Observable<CourseResponse> {
    return this.api.post<CourseResponse>('courses', payload);
  }

  // Update course basic info
  updateCourse(courseGuid: string, payload: { title: string; description: string; categoryId: number; language: string; price: number; thumbnailUrl: string | null }): Observable<any> {
    return this.api.put<any>(`courses/${courseGuid}`, payload);
  }

  // Delete course
  deleteCourse(courseGuid: string): Observable<any> {
    return this.api.delete<any>(`courses/${courseGuid}`);
  }

  // Submit course for review approval
  submitForReview(courseGuid: string): Observable<any> {
    return this.api.post<any>(`courses/${courseGuid}/submit`, {});
  }

  // Archive / unpublish course
  archiveCourse(courseGuid: string, reason: string): Observable<any> {
    return this.api.post<any>(`courses/${courseGuid}/archive`, { reason });
  }

  // Create section inside course
  createSection(courseGuid: string, payload: { title: string; order: number }): Observable<any> {
    return this.api.post<any>(`courses/${courseGuid}/sections`, payload);
  }

  // Update section title/order
  updateSection(sectionId: number, payload: { title: string; order: number }): Observable<any> {
    return this.api.put<any>(`sections/${sectionId}`, payload);
  }

  // Delete section
  deleteSection(sectionId: number): Observable<any> {
    return this.api.delete<any>(`sections/${sectionId}`);
  }

  // Create lecture inside section
  createLecture(sectionId: number, payload: { title: string; contentUrl: string; durationInMinutes: number; contentType: string }): Observable<any> {
    return this.api.post<any>(`sections/${sectionId}/lectures`, payload);
  }

  // Update lecture
  updateLecture(lectureId: number, payload: { title: string; contentUrl: string; durationInMinutes: number; contentType: string }): Observable<any> {
    return this.api.put<any>(`lectures/${lectureId}`, payload);
  }

  // Delete lecture
  deleteLecture(lectureId: number): Observable<any> {
    return this.api.delete<any>(`lectures/${lectureId}`);
  }

  // File uploader with progress tracking
  uploadMedia(file: File, type: 'video' | 'thumbnail' | 'document'): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    let url = `${environment.apiUrl}/upload/${type}`;
    if (type === 'document') url = `${environment.apiUrl}/upload/document`;

    return this.http.post(url, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  // Quizzes
  getQuiz(quizId: number): Observable<any> {
    return this.api.get<any>(`quizzes/${quizId}`);
  }

  createQuiz(lectureId: number, data: any): Observable<any> {
    return this.api.post<any>(`lectures/${lectureId}/quiz`, data);
  }

  updateQuiz(quizId: number, data: any): Observable<any> {
    return this.api.put<any>(`quizzes/${quizId}`, data);
  }

  deleteQuiz(quizId: number): Observable<any> {
    return this.api.delete<any>(`quizzes/${quizId}`);
  }
}
