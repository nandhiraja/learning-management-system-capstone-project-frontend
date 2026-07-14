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
}
