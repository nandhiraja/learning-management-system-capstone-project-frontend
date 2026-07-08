import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface LandingStats {
  totalActiveStudents: number;
  totalExpertInstructors: number;
  totalPremiumCourses: number;
}

export interface TopInstructor {
  id: string;
  fullName: string;
  profilePictureUrl: string | null;
  totalStudents: number;
  courseCount: number;
}

export interface VerifiedCertificate {
  id: number;
  issuedDate: string;
  certificateUrl: string;
  userGuid: string;
  userFullName: string;
  userEmail: string;
  courseGuid: string;
  courseTitle: string;
  instructorName: string;
  verificationId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  private api = inject(ApiService);

  getLandingStats(): Observable<LandingStats> {
    return this.api.get<LandingStats>('public/landing-stats');
  }

  getTopInstructors(limit: number = 4): Observable<TopInstructor[]> {
    return this.api.get<TopInstructor[]>(`public/top-instructors?limit=${limit}`);
  }

  verifyCertificate(verificationId: string): Observable<VerifiedCertificate> {
    return this.api.get<VerifiedCertificate>(`public/certificates/verify/${verificationId}`);
  }
}
