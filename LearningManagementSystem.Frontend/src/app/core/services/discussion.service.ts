import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { DiscussionResponse, DiscussionDetailResponse, DiscussionReplyResponse } from '../../models/discussion.model';

@Injectable({
  providedIn: 'root'
})
export class DiscussionService {
  private api = inject(ApiService);

  getDiscussions(courseId: string, lectureId?: number): Observable<DiscussionResponse[]> {
    let path = `courses/${courseId}/discussions`;
    if (lectureId !== undefined && lectureId !== null) {
      path += `?lectureId=${lectureId}`;
    }
    return this.api.get<DiscussionResponse[]>(path);
  }

  getDiscussionDetails(discussionId: string): Observable<DiscussionDetailResponse> {
    return this.api.get<DiscussionDetailResponse>(`discussions/${discussionId}`);
  }

  createDiscussion(courseId: string, payload: { title: string; content: string; lectureId: number }): Observable<DiscussionResponse> {
    return this.api.post<DiscussionResponse>(`courses/${courseId}/discussions`, payload);
  }

  createReply(discussionId: string, payload: { content: string }): Observable<DiscussionReplyResponse> {
    return this.api.post<DiscussionReplyResponse>(`discussions/${discussionId}/replies`, payload);
  }
}
