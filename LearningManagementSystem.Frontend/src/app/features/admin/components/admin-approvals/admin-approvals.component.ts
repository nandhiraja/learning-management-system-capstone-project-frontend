import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseResponse, CourseSectionResponse, LectureResponse } from '../../../../models/course.model';
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
  @Input() processingId: string | null = null;

  @Output() approveCourse = new EventEmitter<string>();
  @Output() rejectCourse = new EventEmitter<{ courseId: string; reason: string }>();
  @Output() approveInstructor = new EventEmitter<string>();
  @Output() rejectInstructor = new EventEmitter<string>();

  // State to manage rejection reason input overlay
  protected activeRejectionCourseId = signal<string | null>(null);
  protected rejectionReason = signal<string>('');
  protected showRejectionValidationError = signal<boolean>(false);

  // States to manage custom approval modals
  protected activeApprovalCourseId = signal<string | null>(null);
  protected activeApprovalInstructorId = signal<string | null>(null);
  protected activeRejectInstructorId = signal<string | null>(null);

  // Track expanded syllabus/sections preview
  protected expandedCourseId = signal<string | null>(null);

  isDraftUpdate(course: CourseResponse): boolean {
    return !!course.originalCourseDetails;
  }

  isFieldModified(course: CourseResponse, fieldName: 'title' | 'description' | 'price'): boolean {
    if (!course.originalCourseDetails) return false;
    if (fieldName === 'title') return course.title !== course.originalCourseDetails.title;
    if (fieldName === 'description') return course.description !== course.originalCourseDetails.description;
    if (fieldName === 'price') return course.price !== course.originalCourseDetails.price;
    return false;
  }

  isNewSection(course: CourseResponse, section: CourseSectionResponse): boolean {
    if (!course.originalCourseDetails) return false;
    return !course.originalCourseDetails.sections.some(s => s.order === section.order);
  }

  isNewLecture(course: CourseResponse, section: CourseSectionResponse, lecture: LectureResponse): boolean {
    if (!course.originalCourseDetails) return false;
    const originalSec = course.originalCourseDetails.sections.find(s => s.order === section.order);
    if (!originalSec) return true;
    return !originalSec.lectures.some(l => l.title === lecture.title);
  }

  toggleExpand(courseId: string) {
    if (this.expandedCourseId() === courseId) {
      this.expandedCourseId.set(null);
    } else {
      this.expandedCourseId.set(courseId);
    }
  }

  onApproveCourse(courseExternalId: string) {
    this.activeApprovalCourseId.set(courseExternalId);
  }

  cancelApprovalCourse() {
    this.activeApprovalCourseId.set(null);
  }

  confirmApprovalCourse() {
    const courseId = this.activeApprovalCourseId();
    if (courseId) {
      this.approveCourse.emit(courseId);
    }
    this.activeApprovalCourseId.set(null);
  }

  triggerRejectCourse(courseExternalId: string) {
    this.activeRejectionCourseId.set(courseExternalId);
    this.rejectionReason.set('');
    this.showRejectionValidationError.set(false);
  }

  cancelRejection() {
    this.activeRejectionCourseId.set(null);
    this.rejectionReason.set('');
    this.showRejectionValidationError.set(false);
  }

  submitRejection() {
    const courseId = this.activeRejectionCourseId();
    const reason = this.rejectionReason().trim();
    if (!courseId) return;

    if (!reason) {
      this.showRejectionValidationError.set(true);
      return;
    }

    this.rejectCourse.emit({ courseId, reason });
    this.activeRejectionCourseId.set(null);
    this.rejectionReason.set('');
    this.showRejectionValidationError.set(false);
  }

  onApproveInstructor(userExternalId: string) {
    this.activeApprovalInstructorId.set(userExternalId);
  }

  cancelApprovalInstructor() {
    this.activeApprovalInstructorId.set(null);
  }

  confirmApprovalInstructor() {
    const userId = this.activeApprovalInstructorId();
    if (userId) {
      this.approveInstructor.emit(userId);
    }
    this.activeApprovalInstructorId.set(null);
  }

  onRejectInstructor(userExternalId: string) {
    this.activeRejectInstructorId.set(userExternalId);
  }

  cancelRejectInstructor() {
    this.activeRejectInstructorId.set(null);
  }

  confirmRejectInstructor() {
    const userId = this.activeRejectInstructorId();
    if (userId) {
      this.rejectInstructor.emit(userId);
    }
    this.activeRejectInstructorId.set(null);
  }
}
