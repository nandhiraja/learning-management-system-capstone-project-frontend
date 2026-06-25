import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseResponse } from '../../../../../../../models/course.model';

@Component({
  selector: 'app-course-preview-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './preview-hero.component.html',
  styleUrl: './preview-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursePreviewHeroComponent {
  @Input({ required: true }) course!: CourseResponse;
}
