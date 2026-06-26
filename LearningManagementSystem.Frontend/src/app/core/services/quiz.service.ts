import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { QuizResponse, QuizSubmitRequest, QuizSubmitResponse } from '../../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private api = inject(ApiService);

  getQuiz(quizId: number): Observable<QuizResponse> {
    return this.api.get<QuizResponse>(`quizzes/${quizId}`);
  }

  submitQuiz(quizId: number, payload: QuizSubmitRequest): Observable<QuizSubmitResponse> {
    return this.api.post<QuizSubmitResponse>(`quizzes/${quizId}/submit`, payload);
  }
}
