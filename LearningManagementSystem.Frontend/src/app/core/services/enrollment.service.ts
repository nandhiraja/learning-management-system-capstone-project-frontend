import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, catchError, of } from 'rxjs';
import { EnrollmentResponse, CertificateResponse } from '../../models/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private api = inject(ApiService);

  getEnrolledCourses(): Observable<EnrollmentResponse[]> {
    return this.api.get<EnrollmentResponse[]>('enrollments').pipe(
      catchError((err) => {
        console.error('Error fetching enrolled courses:', err);
        return of([]);
      })
    );
  }

  getCertificates(): Observable<CertificateResponse[]> {
    return this.api.get<CertificateResponse[]>('certificates').pipe(
      catchError((err) => {
        console.error('Error fetching certificates:', err);
        return of([]);
      })
    );
  }

  getCourseProgress(enrollmentId: number): Observable<any> {
    return this.api.get<any>(`enrollments/${enrollmentId}/progress`);
  }

  updateLectureProgress(enrollmentId: number, lectureId: number, isCompleted: boolean): Observable<any> {
    return this.api.put<any>(`enrollments/${enrollmentId}/lectures/${lectureId}/progress`, { isCompleted });
  }
}
