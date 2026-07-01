import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService } from '../../../../core/services/instructor.service';
import { DiscussionService } from '../../../../core/services/discussion.service';
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
        // If we have a selected thread, check if it's still in the list or needs refresh
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

    this.discussionService.getDiscussionDetails(guid).subscribe({
      next: (data) => {
        this.selectedThread.set(data);
        this.isLoadingThread.set(false);
      },
      error: (err) => {
        console.error('Failed to load discussion details', err);
        this.isLoadingThread.set(false);
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
