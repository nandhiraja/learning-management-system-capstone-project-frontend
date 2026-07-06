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

  get totalSections(): number {
    return this.course?.sections?.length || 0;
  }

  get totalLectures(): number {
    if (!this.course?.sections) return 0;
    return this.course.sections.reduce((acc, section) => acc + (section.lectures?.length || 0), 0);
  }

  get totalDurationMinutes(): number {
    if (!this.course?.sections) return 0;
    return this.course.sections.reduce((acc, section) => {
      const sectionTime = section.lectures?.reduce((secAcc, lecture) => secAcc + (lecture.durationInMinutes || 0), 0) || 0;
      return acc + sectionTime;
    }, 0);
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  toggleSection(index: number) {
    if (this.openSectionIndex() === index) {
      this.openSectionIndex.set(null);
    } else {
      this.openSectionIndex.set(index);
    }
  }

  getLectureIcon(contentType: string): string {
    const type = contentType?.toLowerCase() || '';
    if (type.includes('video')) return 'bi-play-circle';
    if (type.includes('pdf')) return 'bi-file-earmark-pdf';
    if (type.includes('text')) return 'bi-file-text';
    if (type.includes('ppt')) return 'bi-file-earmark-slides';
    if (type.includes('external')) return 'bi-link-45deg';
    return 'bi-file-earmark';
  }
}
