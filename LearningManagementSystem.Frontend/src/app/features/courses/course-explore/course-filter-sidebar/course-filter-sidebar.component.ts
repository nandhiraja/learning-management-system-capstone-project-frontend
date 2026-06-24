import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, Language } from '../../../../models/course.model';

@Component({
  selector: 'app-course-filter-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-filter-sidebar.component.html',
  styleUrl: './course-filter-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseFilterSidebarComponent {
  @Input() categories: Category[] = [];
  @Input() languages: Language[] = [];
  @Input() selectedCategoryId: number | null = null;
  @Input() selectedLanguageName = '';
  @Input() priceType: 'all' | 'free' | 'paid' = 'all';
  @Input() sortBy = 'newest';

  @Output() categoryToggle = new EventEmitter<number>();
  @Output() languageToggle = new EventEmitter<string>();
  @Output() priceTypeChange = new EventEmitter<'all' | 'free' | 'paid'>();
  @Output() sortByChange = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortByChange.emit(target.value);
  }
}
