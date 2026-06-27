import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { 
  AdminDashboardResponse, 
  PendingQueueResponse, 
  AdminCategoryResponse, 
  AdminLanguageResponse 
} from '../../models/admin.model';
import { UserProfile } from '../../shared/models/user.model';
import { CourseResponse } from '../../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private api = inject(ApiService);

  // Get general counts and revenue stats
  getDashboardStats(): Observable<AdminDashboardResponse> {
    return this.api.get<AdminDashboardResponse>('admin/dashboard');
  }

  // Get pending courses & instructor promotion requests queue
  getPendingQueue(): Observable<PendingQueueResponse> {
    return this.api.get<PendingQueueResponse>('admin/dashboard/pending');
  }

  // Review course (Approve or Reject with feedback reason)
  reviewCourse(courseId: string, status: 'Approved' | 'Rejected', reason?: string): Observable<any> {
    return this.api.post<any>(`admin/courses/${courseId}/review`, { status, reason });
  }

  // Get all users in system
  getUsers(): Observable<UserProfile[]> {
    return this.api.get<UserProfile[]>('admin/users');
  }

  // Get all courses (Published, Rejected, PendingReview, etc.)
  getCourses(): Observable<CourseResponse[]> {
    return this.api.get<CourseResponse[]>('admin/courses');
  }

  // Block/unblock user
  updateUserStatus(userGuid: string, isActive: boolean): Observable<any> {
    return this.api.patch<any>(`admin/users/${userGuid}/status`, { isActive });
  }

  // Update user roles (ApproveInstructor, RejectInstructor, DemoteToStudent)
  updateUserRole(userGuid: string, action: 'ApproveInstructor' | 'RejectInstructor' | 'DemoteToStudent'): Observable<any> {
    return this.api.put<any>(`admin/users/${userGuid}/role`, { action });
  }

  // Get categories list (approved and unapproved)
  getCategories(): Observable<AdminCategoryResponse[]> {
    return this.api.get<AdminCategoryResponse[]>('admin/categories');
  }

  // Approve a requested category
  approveCategory(id: number): Observable<any> {
    return this.api.put<any>(`admin/categories/${id}/approve`, {});
  }

  // Delete a category
  deleteCategory(id: number): Observable<any> {
    return this.api.delete<any>(`admin/categories/${id}`);
  }

  // Get languages list (approved and unapproved)
  getLanguages(): Observable<AdminLanguageResponse[]> {
    return this.api.get<AdminLanguageResponse[]>('admin/languages');
  }

  // Approve a requested language
  approveLanguage(id: number): Observable<any> {
    return this.api.put<any>(`admin/languages/${id}/approve`, {});
  }

  // Delete a language
  deleteLanguage(id: number): Observable<any> {
    return this.api.delete<any>(`admin/languages/${id}`);
  }
}
