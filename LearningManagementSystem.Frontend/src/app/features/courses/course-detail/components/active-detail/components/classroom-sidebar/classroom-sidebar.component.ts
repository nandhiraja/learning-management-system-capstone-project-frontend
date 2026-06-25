import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseResponse, LectureResponse } from '../../../../../../../models/course.model';
import { ProgressBarComponent } from '../../../../../../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-classroom-sidebar',
  standalone: true,
  imports: [CommonModule, ProgressBarComponent],
  templateUrl: './classroom-sidebar.component.html',
  styleUrl: './classroom-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassroomSidebarComponent {
  @Input({ required: true }) course!: CourseResponse;
  @Input({ required: true }) activeLecture: LectureResponse | null = null;
  @Input({ required: true }) completedLectureIds: number[] = [];
  @Input({ required: true }) progressPercent = 0;
  @Input({ required: true }) totalLectures = 0;

  @Output() lectureSelected = new EventEmitter<LectureResponse>();
  @Output() progressToggled = new EventEmitter<{ lectureId: number; event: Event }>();

  isCompleted(lectureId: number): boolean {
    return this.completedLectureIds.includes(lectureId);
  }

  selectLecture(lecture: LectureResponse) {
    this.lectureSelected.emit(lecture);
  }

  toggleProgress(lectureId: number, event: Event) {
    event.stopPropagation();
    this.progressToggled.emit({ lectureId, event });
  }
}
