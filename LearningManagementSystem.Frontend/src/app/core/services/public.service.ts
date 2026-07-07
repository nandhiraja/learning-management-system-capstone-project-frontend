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
}
