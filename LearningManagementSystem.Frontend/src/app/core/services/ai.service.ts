import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private api = inject(ApiService);

  checkTranscriptAvailability(lectureId: number): Observable<{ hasTranscript: boolean }> {
    return this.api.get<{ hasTranscript: boolean }>(`ai/lectures/${lectureId}/has-transcript`);
  }

  askStudentQuestion(lectureId: number, question: string): Observable<{ answer: string; contextTruncated: boolean }> {
    return this.api.post<{ answer: string; contextTruncated: boolean }>(`ai/ask`, {
      lectureId,
      question
    });
  }

  askInstructorQuestion(lectureId: number, question: string): Observable<{ answer: string; contextTruncated: boolean }> {
    return this.api.post<{ answer: string; contextTruncated: boolean }>(`ai/instructor/ask`, {
      lectureId,
      question
    });
  }

  generateStudyPlan(quizId: number, answers: any[]): Observable<{ studyPlan: string }> {
    return this.api.post<{ studyPlan: string }>(`ai/quizzes/${quizId}/study-plan`, { answers });
  }

  generateQuiz(lectureId: number, numQuestions: number = 5, existingQuestions: string[] = []): Observable<{ questions: Array<{ questionText: string; options: Array<{ text: string; isCorrect: boolean }> }> }> {
    return this.api.post<{ questions: any[] }>(`ai/lectures/${lectureId}/generate-quiz`, { numQuestions, existingQuestions });
  }
}
