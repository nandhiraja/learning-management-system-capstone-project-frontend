import { Component, Input, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseResponse } from '../../../../../../../models/course.model';

@Component({
  selector: 'app-course-preview-curriculum',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-curriculum.component.html',
  styleUrl: './preview-curriculum.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursePreviewCurriculumComponent {
  @Input({ required: true }) course!: CourseResponse;

  protected openSectionIndex = signal<number | null>(0); // open first section by default

  toggleSection(index: number) {
    if (this.openSectionIndex() === index) {
      this.openSectionIndex.set(null);
    } else {
      this.openSectionIndex.set(index);
    }
  }
}
