import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscussionService } from '../../../../../../../core/services/discussion.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { DiscussionResponse, DiscussionDetailResponse } from '../../../../../../../models/discussion.model';
import { BadgeChipComponent } from '../../../../../../../shared/components/badge-chip/badge-chip.component';

@Component({
  selector: 'app-classroom-discussion',
  standalone: true,
  imports: [CommonModule, BadgeChipComponent],
  templateUrl: './classroom-discussion.component.html',
  styleUrl: './classroom-discussion.component.css'
})
export class ClassroomDiscussionComponent implements OnChanges {
  @Input({ required: true }) courseExternalId!: string;
  @Input({ required: true }) lectureId!: number;

  private discussionService = inject(DiscussionService);
  private notification = inject(NotificationService);

  // States
  protected discussions = signal<DiscussionResponse[]>([]);
  protected isLoadingDiscussions = signal<boolean>(false);
  protected selectedDiscussion = signal<DiscussionDetailResponse | null>(null);
  protected isPostingQuestion = signal<boolean>(false);
  protected isPostingReply = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['courseExternalId'] || changes['lectureId']) && this.courseExternalId && this.lectureId) {
      this.selectedDiscussion.set(null);
      this.fetchDiscussions(this.lectureId);
    }
  }

  fetchDiscussions(lectureId: number) {
    this.isLoadingDiscussions.set(true);
    this.discussionService.getDiscussions(this.courseExternalId, lectureId).subscribe({
      next: (data) => {
        this.discussions.set(data);
        this.isLoadingDiscussions.set(false);
      },
      error: (err) => {
        console.error('Failed to load QA discussions', err);
        this.isLoadingDiscussions.set(false);
      }
    });
  }

  postQuestion(titleInput: HTMLInputElement, contentInput: HTMLTextAreaElement) {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
      this.notification.warning('Please fill in both a title and content for your question.');
      return;
    }

    this.isPostingQuestion.set(true);
    this.discussionService.createDiscussion(this.courseExternalId, {
      title,
      content,
      lectureId: this.lectureId
    }).subscribe({
      next: () => {
        this.notification.success('Your question has been posted successfully!');
        titleInput.value = '';
        contentInput.value = '';
        this.fetchDiscussions(this.lectureId);
        this.isPostingQuestion.set(false);
      },
      error: (err) => {
        this.notification.error('Failed to post question.');
        this.isPostingQuestion.set(false);
      }
    });
  }

  viewDiscussion(discussionExtId: string) {
    this.discussionService.getDiscussionDetails(discussionExtId).subscribe({
      next: (detail) => {
        this.selectedDiscussion.set(detail);
      },
      error: (err) => {
        this.notification.error('Failed to load discussion replies.');
      }
    });
  }

  postReply(contentInput: HTMLTextAreaElement) {
    const content = contentInput.value.trim();
    const disc = this.selectedDiscussion();

    if (!content || !disc) {
      return;
    }

    this.isPostingReply.set(true);
    this.discussionService.createReply(disc.externalId, { content }).subscribe({
      next: () => {
        this.notification.success('Reply posted!');
        contentInput.value = '';
        this.viewDiscussion(disc.externalId); // Reload discussion thread
        this.isPostingReply.set(false);
        
        // Refresh replies count on the list
        this.fetchDiscussions(this.lectureId);
      },
      error: (err) => {
        this.notification.error('Failed to post reply.');
        this.isPostingReply.set(false);
      }
    });
  }

  closeDiscussionThread() {
    this.selectedDiscussion.set(null);
  }
}
