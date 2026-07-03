import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Course, Category, Language } from '../../models/course.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private api = inject(ApiService);

  getCourses(params: {
    page?: number;
    pageSize?: number;
    categoryId?: number | null;
    search?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    language?: string | null;
    sortBy?: string | null;
  }): Observable<{ items: Course[]; totalCount: number }> {
    let queryParams = new HttpParams();
    
    if (params.page !== undefined) queryParams = queryParams.set('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams = queryParams.set('pageSize', params.pageSize.toString());
    
    // categoryId can be null, only set if it has value
    if (params.categoryId !== null && params.categoryId !== undefined) {
      queryParams = queryParams.set('categoryId', params.categoryId.toString());
    }
    
    if (params.search) {
      queryParams = queryParams.set('search', params.search);
    }
    
    if (params.minPrice !== null && params.minPrice !== undefined) {
      queryParams = queryParams.set('minPrice', params.minPrice.toString());
    }
    
    if (params.maxPrice !== null && params.maxPrice !== undefined) {
      queryParams = queryParams.set('maxPrice', params.maxPrice.toString());
    }
    
    if (params.language) {
      queryParams = queryParams.set('language', params.language);
    }
    
    if (params.sortBy) {
      queryParams = queryParams.set('sortBy', params.sortBy);
    }

    const queryStr = queryParams.toString();
    const path = queryStr ? `courses?${queryStr}` : 'courses';
    return this.api.get<{ items: Course[]; totalCount: number }>(path);
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('categories');
  }

  getLanguages(): Observable<Language[]> {
    return this.api.get<Language[]>('languages');
  }

  getCourseById(externalId: string): Observable<Course> {
    return this.api.get<Course>(`courses/${externalId}`);
  }

  addToCart(courseId: number): Observable<any> {
    return this.api.post<any>('cart', { courseId });
  }

  createCategory(name: string): Observable<any> {
    return this.api.post<any>('categories', { name });
  }

  createLanguage(name: string): Observable<any> {
    return this.api.post<any>('languages', { name });
  }

  getCourseReviews(courseId: string, page: number = 1, pageSize: number = 10): Observable<{ items: any[]; totalCount: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.api.get<{ items: any[]; totalCount: number }>(`courses/${courseId}/reviews?${params.toString()}`);
  }

  addCourseReview(courseId: string, rating: number, comment?: string): Observable<any> {
    const request = { rating, comment };
    return this.api.post<any>(`courses/${courseId}/reviews`, request);
  }
}
