import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Course } from '../../../../models/course.model';
import { BadgeChipComponent } from '../../../../shared/components/badge-chip/badge-chip.component';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeChipComponent],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseCardComponent {
  @Input({ required: true }) course!: Course;
}
