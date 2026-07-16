import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { InstructorService } from '../../../../core/services/instructor.service';
import { DiscussionService } from '../../../../core/services/discussion.service';
import { AiService } from '../../../../core/services/ai.service';
import { InstructorDiscussionResponse } from '../../../../models/instructor.model';
import { DiscussionDetailResponse } from '../../../../models/discussion.model';
import { BadgeChipComponent } from '../../../../shared/components/badge-chip/badge-chip.component';

@Component({
  selector: 'app-instructor-discussions',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeChipComponent],
  templateUrl: './instructor-discussions.component.html',
  styleUrl: './instructor-discussions.component.css'
})
export class InstructorDiscussionsComponent implements OnInit {
  private instructorService = inject(InstructorService);
  private discussionService = inject(DiscussionService);
  private aiService = inject(AiService);
  private sanitizer = inject(DomSanitizer);

  renderMarkdown(text: string): SafeHtml {
    if (!text) return '';
    try {
      const html = marked.parse(text) as string;
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
  }

  // Discussion threads list
  protected discussions = signal<InstructorDiscussionResponse[]>([]);
  protected isLoadingList = signal<boolean>(false);
  protected unansweredOnly = signal<boolean>(false);
  protected searchQuery = signal<string>('');

  // Selected thread details
  protected selectedDiscussionId = signal<string | null>(null);
  protected selectedThread = signal<DiscussionDetailResponse | null>(null);
  protected isLoadingThread = signal<boolean>(false);
  protected isPostingReply = signal<boolean>(false);
  protected replyContent = signal<string>('');

  // AI Assistance states
  protected hasTranscript = signal<boolean>(false);
  protected isAiDrafting = signal<boolean>(false);

  // Filtered discussions list based on search query
  protected filteredDiscussions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.discussions();
    if (!query) return list;
    return list.filter(d => 
      d.title.toLowerCase().includes(query) || 
      d.content.toLowerCase().includes(query) ||
      d.studentName.toLowerCase().includes(query) ||
      d.courseTitle.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadDiscussions();
  }

  loadDiscussions() {
    this.isLoadingList.set(true);
    this.instructorService.getDiscussions(this.unansweredOnly()).subscribe({
      next: (data) => {
        this.discussions.set(data);
        this.isLoadingList.set(false);
      },
      error: (err) => {
        console.error('Failed to load instructor discussions', err);
        this.isLoadingList.set(false);
      }
    });
  }

  toggleUnansweredFilter() {
    this.unansweredOnly.update(val => !val);
    this.loadDiscussions();
  }

  selectDiscussion(guid: string) {
    this.selectedDiscussionId.set(guid);
    this.isLoadingThread.set(true);
    this.selectedThread.set(null);
    this.hasTranscript.set(false);

    this.discussionService.getDiscussionDetails(guid).subscribe({
      next: (data) => {
        this.selectedThread.set(data);
        this.isLoadingThread.set(false);
        if (data.lectureId) {
          this.checkTranscript(data.lectureId);
        }
      },
      error: (err) => {
        console.error('Failed to load discussion details', err);
        this.isLoadingThread.set(false);
      }
    });
  }

  checkTranscript(lectureId: number) {
    this.aiService.checkTranscriptAvailability(lectureId).subscribe({
      next: (res) => {
        this.hasTranscript.set(res.hasTranscript);
      },
      error: () => {
        this.hasTranscript.set(false);
      }
    });
  }

  draftResponseWithAi() {
    const thread = this.selectedThread();
    if (!thread) return;

    this.isAiDrafting.set(true);
    const question = `Title: ${thread.title}\n\nContent: ${thread.content}`;
    
    this.aiService.askInstructorQuestion(thread.lectureId, question).subscribe({
      next: (res) => {
        this.replyContent.set(res.answer);
        this.isAiDrafting.set(false);
      },
      error: (err) => {
        console.error('Failed to draft AI response', err);
        this.isAiDrafting.set(false);
      }
    });
  }

  postReply() {
    const content = this.replyContent().trim();
    const threadId = this.selectedDiscussionId();
    if (!content || !threadId) return;

    this.isPostingReply.set(true);
    this.discussionService.createReply(threadId, { content }).subscribe({
      next: () => {
        this.replyContent.set('');
        this.isPostingReply.set(false);
        // Refresh details & the sidebar list to update reply counts/answered state
        this.selectDiscussion(threadId);
        this.loadDiscussions();
      },
      error: (err) => {
        console.error('Failed to submit reply', err);
        this.isPostingReply.set(false);
      }
    });
  }

  closeThreadView() {
    this.selectedDiscussionId.set(null);
    this.selectedThread.set(null);
  }
}
