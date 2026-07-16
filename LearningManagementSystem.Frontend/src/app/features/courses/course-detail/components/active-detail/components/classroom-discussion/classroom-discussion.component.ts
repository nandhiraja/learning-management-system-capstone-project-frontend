import { Component, Input, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { DiscussionService } from '../../../../../../../core/services/discussion.service';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { AiService } from '../../../../../../../core/services/ai.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { DiscussionResponse, DiscussionDetailResponse } from '../../../../../../../models/discussion.model';

@Component({
  selector: 'app-classroom-discussion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classroom-discussion.component.html',
  styleUrl: './classroom-discussion.component.css'
})
export class ClassroomDiscussionComponent implements OnChanges {
  @Input({ required: true }) courseExternalId!: string;
  @Input({ required: true }) lectureId!: number;
  @Input() isInstructor = false;

  private discussionService = inject(DiscussionService);
  private authService = inject(AuthService);
  private aiService = inject(AiService);
  private notification = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);

  // States
  protected discussions = signal<DiscussionResponse[]>([]);
  protected isLoadingDiscussions = signal<boolean>(false);
  protected selectedDiscussion = signal<DiscussionDetailResponse | null>(null);
  protected isPostingQuestion = signal<boolean>(false);
  protected isPostingReply = signal<boolean>(false);
  protected showNewQuestionForm = signal<boolean>(false);

  // Input states (bound via ngModel)
  protected questionTitle = signal<string>('');
  protected questionContent = signal<string>('');

  // AI Interceptor States
  protected hasTranscript = signal<boolean>(false);
  protected isAiLoading = signal<boolean>(false);
  protected aiSuggestion = signal<string | null>(null);

  protected renderedAiSuggestion = computed<SafeHtml | null>(() => {
    const raw = this.aiSuggestion();
    if (!raw) return null;
    try {
      const html = marked.parse(raw) as string;
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch {
      return this.sanitizer.bypassSecurityTrustHtml(raw);
    }
  });

  renderMarkdown(text: string): SafeHtml {
    if (!text) return '';
    try {
      const html = marked.parse(text) as string;
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
  }

  // Roles checking
  protected isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role?.toLowerCase() === 'admin';
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['courseExternalId'] || changes['lectureId']) && this.courseExternalId && this.lectureId) {
      this.selectedDiscussion.set(null);
      this.aiSuggestion.set(null);
      this.questionTitle.set('');
      this.questionContent.set('');
      this.fetchDiscussions(this.lectureId);
      this.checkTranscript();
    }
  }

  checkTranscript() {
    this.hasTranscript.set(false);
    this.aiService.checkTranscriptAvailability(this.lectureId).subscribe({
      next: (res) => {
        this.hasTranscript.set(res.hasTranscript);
      },
      error: () => {
        this.hasTranscript.set(false);
      }
    });
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

  postQuestion(bypassAi = false) {
    const title = this.questionTitle().trim();
    const content = this.questionContent().trim();
    
    if (!title || !content) {
      this.notification.warning('Please fill in both a title and content for your question.');
      return;
    }

    if (this.hasTranscript() && !bypassAi && !this.aiSuggestion()) {
      this.isAiLoading.set(true);
      this.aiService.askStudentQuestion(this.lectureId, content).subscribe({
        next: (res) => {
          this.aiSuggestion.set(res.answer);
          this.isAiLoading.set(false);
        },
        error: (err) => {
          // If AI fails, fallback and post to forum directly
          this.isAiLoading.set(false);
          this.submitQuestionToForum(title, content);
        }
      });
      return;
    }

    this.submitQuestionToForum(title, content);
  }

  submitQuestionToForum(title: string, content: string) {
    this.isPostingQuestion.set(true);
    this.discussionService.createDiscussion(this.courseExternalId, {
      title,
      content,
      lectureId: this.lectureId
    }).subscribe({
      next: () => {
        this.notification.success('Your question has been posted successfully!');
        this.questionTitle.set('');
        this.questionContent.set('');
        this.fetchDiscussions(this.lectureId);
        this.isPostingQuestion.set(false);
        this.showNewQuestionForm.set(false);
        this.aiSuggestion.set(null);
      },
      error: (err) => {
        this.notification.error('Failed to post question.');
        this.isPostingQuestion.set(false);
      }
    });
  }

  acceptAiSuggestion() {
    this.notification.success('Glad we could resolve your question instantly!');
    this.questionTitle.set('');
    this.questionContent.set('');
    this.aiSuggestion.set(null);
    this.showNewQuestionForm.set(false);
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
