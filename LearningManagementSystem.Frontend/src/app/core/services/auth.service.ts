import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { UserProfile, LoginResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<UserProfile | null>(null);
  
  currentUser = computed(() => this.currentUserSignal());
  
  isInitializing = signal<boolean>(true);

  constructor(private api: ApiService) {
    this.checkSession();
  }

  checkSession() {
    const token = localStorage.getItem('lms_access_token');
    if (token) {
      this.fetchProfile().subscribe({
        next: (profile) => {
          this.currentUserSignal.set(profile);
          this.isInitializing.set(false);
        },
        error: () => {
          this.clearSession();
          this.isInitializing.set(false);
        }
      });
    } else {
      this.isInitializing.set(false);
    }
  }


  register(payload: any): Observable<any> {
    return this.api.post<any>('auth/register', payload);
  }


  login(payload: any): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', payload).pipe(
      tap((res) => {
        localStorage.setItem('lms_access_token', res.accessToken);
        localStorage.setItem('lms_refresh_token', res.refreshToken);
      }),
      // Fetch user profile immediately
      tap(() => {
        this.fetchProfile().subscribe({
          next: (profile) => {
            this.currentUserSignal.set(profile);
          }
        });
      })
    );
  }

  // Fetch active user profile details
  fetchProfile(): Observable<UserProfile> {
    return this.api.get<UserProfile>('users/me');
  }

  // Update profile text info
  updateProfile(payload: any): Observable<any> {
    return this.api.put<any>('users/me', payload).pipe(
      tap(() => {
        this.fetchProfile().subscribe({
          next: (profile) => {
            this.currentUserSignal.set(profile);
          }
        });
      })
    );
  }

  updateCertificateName(newName: string): Observable<any> {
    return this.api.post<any>('users/me/certificate-name', { newName }).pipe(
      tap(() => {
        this.fetchProfile().subscribe({
          next: (profile) => {
            this.currentUserSignal.set(profile);
          }
        });
      })
    );
  }

  // Become Instructor request
  becomeInstructor(): Observable<any> {
    return this.api.post<any>('users/become-instructor', {}).pipe(
      tap(() => {
        // Refresh local user state
        this.fetchProfile().subscribe({
          next: (profile) => {
            this.currentUserSignal.set(profile);
          }
        });
      })
    );
  }

  // Upload an image asset
  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<{ url: string }>('upload/image', formData);
  }

  // Logout action
  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('lms_refresh_token') || '';
    
    // Perform cleanup locally first to ensure responsive UI
    this.clearSession();

    // API call in background
    return this.api.post<any>('auth/logout', { refreshToken }).pipe(
      catchError((err) => {
        console.warn('Logout API error:', err);
        return throwError(() => err);
      })
    );
  }

  private clearSession() {
    localStorage.removeItem('lms_access_token');
    localStorage.removeItem('lms_refresh_token');
    this.currentUserSignal.set(null);
  }
}
