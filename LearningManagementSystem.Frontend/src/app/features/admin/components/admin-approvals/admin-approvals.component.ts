import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseResponse } from '../../../../models/course.model';
import { UserProfile } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-approvals.component.html',
  styleUrl: './admin-approvals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminApprovalsComponent {
  @Input({ required: true }) courses: CourseResponse[] = [];
  @Input({ required: true }) instructors: UserProfile[] = [];

  @Output() approveCourse = new EventEmitter<string>();
  @Output() rejectCourse = new EventEmitter<{ courseId: string; reason: string }>();
  @Output() approveInstructor = new EventEmitter<string>();
  @Output() rejectInstructor = new EventEmitter<string>();

  // State to manage rejection reason input overlay
  protected activeRejectionCourseId = signal<string | null>(null);
  protected rejectionReason = signal<string>('');

  // Track expanded syllabus/sections preview
  protected expandedCourseId = signal<string | null>(null);

  toggleExpand(courseId: string) {
    if (this.expandedCourseId() === courseId) {
      this.expandedCourseId.set(null);
    } else {
      this.expandedCourseId.set(courseId);
    }
  }

  onApproveCourse(courseExternalId: string) {
    if (confirm('Are you sure you want to approve and publish this course?')) {
      this.approveCourse.emit(courseExternalId);
    }
  }

  triggerRejectCourse(courseExternalId: string) {
    this.activeRejectionCourseId.set(courseExternalId);
    this.rejectionReason.set('');
  }

  cancelRejection() {
    this.activeRejectionCourseId.set(null);
    this.rejectionReason.set('');
  }

  submitRejection() {
    const courseId = this.activeRejectionCourseId();
    const reason = this.rejectionReason().trim();
    if (!courseId) return;

    if (!reason) {
      alert('Please enter a rejection reason feedback.');
      return;
    }

    this.rejectCourse.emit({ courseId, reason });
    this.activeRejectionCourseId.set(null);
    this.rejectionReason.set('');
  }

  onApproveInstructor(userExternalId: string) {
    if (confirm('Are you sure you want to promote this student to Instructor?')) {
      this.approveInstructor.emit(userExternalId);
    }
  }

  onRejectInstructor(userExternalId: string) {
    if (confirm('Are you sure you want to reject this instructor application?')) {
      this.rejectInstructor.emit(userExternalId);
    }
  }
}
