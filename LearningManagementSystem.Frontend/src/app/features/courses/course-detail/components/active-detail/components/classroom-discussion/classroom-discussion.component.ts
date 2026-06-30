import { Component, Input, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscussionService } from '../../../../../../../core/services/discussion.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { DiscussionResponse, DiscussionDetailResponse } from '../../../../../../../models/discussion.model';

@Component({
  selector: 'app-classroom-discussion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classroom-discussion.component.html',
  styleUrl: './classroom-discussion.component.css'
})
export class ClassroomDiscussionComponent implements OnChanges {
  @Input({ required: true }) courseExternalId!: string;
  @Input({ required: true }) lectureId!: number;
  @Input() isInstructor = false;

  private discussionService = inject(DiscussionService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  // States
  protected discussions = signal<DiscussionResponse[]>([]);
  protected isLoadingDiscussions = signal<boolean>(false);
  protected selectedDiscussion = signal<DiscussionDetailResponse | null>(null);
  protected isPostingQuestion = signal<boolean>(false);
  protected isPostingReply = signal<boolean>(false);
  protected showNewQuestionForm = signal<boolean>(false);

  // Roles checking
  protected isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role?.toLowerCase() === 'admin';
  });

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
        this.showNewQuestionForm.set(false);
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

  likeReply(replyId: string) {
    const disc = this.selectedDiscussion();
    if (!disc) return;

    // Optimistic UI Update
    const reply = disc.replies.find(r => r.externalId === replyId);
    if (reply) {
      if (reply.isLikedByCurrentUser) {
        reply.isLikedByCurrentUser = false;
        reply.likesCount = Math.max(0, reply.likesCount - 1);
      } else {
        reply.isLikedByCurrentUser = true;
        reply.likesCount += 1;
      }
    }

    this.discussionService.likeReply(replyId).subscribe({
      next: (res: any) => {
        // Sync with actual count if needed
        if (reply && typeof res?.likesCount === 'number') {
          reply.likesCount = res.likesCount;
        }
      },
      error: (err) => {
        // Revert optimistic update
        if (reply) {
          reply.isLikedByCurrentUser = !reply.isLikedByCurrentUser;
          reply.likesCount = reply.isLikedByCurrentUser ? reply.likesCount + 1 : Math.max(0, reply.likesCount - 1);
        }
        this.notification.error('Failed to toggle like.');
        console.error(err);
      }
    });
  }

  togglePinReply(replyId: string) {
    this.discussionService.togglePinReply(replyId).subscribe({
      next: (res) => {
        const msg = res.isPinned ? 'Reply pinned to top!' : 'Reply unpinned!';
        this.notification.success(msg);
        const disc = this.selectedDiscussion();
        if (disc) {
          this.viewDiscussion(disc.externalId);
        }
      },
      error: (err) => {
        this.notification.error('Failed to toggle pin state.');
        console.error(err);
      }
    });
  }

  closeDiscussionThread() {
    this.selectedDiscussion.set(null);
  }
}
