import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
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

  protected isSortDropdownOpen = signal<boolean>(false);
  protected sortDisplayNames: Record<string, string> = {
    'newest': 'Newest first',
    'price-asc': 'Price: low to high',
    'price-desc': 'Price: high to low',
    'rating': 'Highest rated',
    'students': 'Most popular'
  };

  toggleSortDropdown() {
    this.isSortDropdownOpen.update(val => !val);
  }

  selectSort(sortVal: string) {
    this.sortByChange.emit(sortVal);
    this.isSortDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.isSortDropdownOpen.set(false);
    }
  }
}
