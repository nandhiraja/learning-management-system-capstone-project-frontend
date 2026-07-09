import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course, Category, Language } from '../../../models/course.model';
import { CommonModule } from '@angular/common';

// Modular Components
import { CourseSearchHeaderComponent } from '../course-explore/course-search-header/course-search-header.component';
import { CourseFilterSidebarComponent } from '../course-explore/course-filter-sidebar/course-filter-sidebar.component';
import { CourseCardComponent } from '../course-explore/course-card/course-card.component';
import { CoursePaginationComponent } from '../course-explore/course-pagination/course-pagination.component';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    CourseSearchHeaderComponent,
    CourseFilterSidebarComponent,
    CourseCardComponent,
    CoursePaginationComponent
  ],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.css'
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Listing state signals
  courses = signal<Course[]>([]);
  totalCount = signal<number>(0);
  categories = signal<Category[]>([]);
  languages = signal<Language[]>([]);
  isLoading = signal<boolean>(true);

  // Active filter signals
  searchQuery = signal<string>('');
  selectedCategoryId = signal<number | null>(null);
  selectedLanguageName = signal<string>('');
  priceType = signal<'all' | 'free' | 'paid'>('all');
  sortBy = signal<string>('newest');
  page = signal<number>(1);
  pageSize = signal<number>(6);
  isMobileFilterOpen = signal<boolean>(false);

  // Pagination helper computed states
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor() {
    // Whenever filter signals change, load matching courses automatically
    effect(() => {
      this.fetchCourses();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadFilterMetadata();
    
    // Subscribe to query parameters to sync navbar searches and category redirects
    this.route.queryParams.subscribe((params) => {
      if (params['q'] !== undefined) {
        this.searchQuery.set(params['q']);
      }
      if (params['c'] !== undefined) {
        const catId = parseInt(params['c']);
        this.selectedCategoryId.set(isNaN(catId) ? null : catId);
      }
      this.page.set(1); // Reset to page 1 on query changes
    });
  }

  loadFilterMetadata() {
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats)
    });
    this.courseService.getLanguages().subscribe({
      next: (langs) => this.languages.set(langs)
    });
  }

  fetchCourses() {
    this.isLoading.set(true);
    
    // Smooth scroll to the top of the explorer section when loading new data
    if (typeof document !== 'undefined') {
      const container = document.querySelector('.courses-page-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Map frontend price type to min/max price arguments
    let minPrice: number | null = null;
    let maxPrice: number | null = null;

    if (this.priceType() === 'free') {
      minPrice = 0;
      maxPrice = 0;
    } else if (this.priceType() === 'paid') {
      minPrice = 0.01;
      maxPrice = null;
    }

    this.courseService.getCourses({
      page: this.page(),
      pageSize: this.pageSize(),
      categoryId: this.selectedCategoryId(),
      search: this.searchQuery() || null,
      minPrice,
      maxPrice,
      language: this.selectedLanguageName() || null,
      sortBy: this.sortBy()
    }).subscribe({
      next: (res) => {
        this.courses.set(res.items);
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.courses.set([]);
        this.totalCount.set(0);
        this.isLoading.set(false);
      }
    });
  }

  // Action Handlers
  onCategoryToggle(catId: number) {
    if (this.selectedCategoryId() === catId) {
      this.selectedCategoryId.set(null); // Deselect if already active
    } else {
      this.selectedCategoryId.set(catId);
    }
    this.page.set(1);
    this.isMobileFilterOpen.set(false);
  }

  onLanguageToggle(langName: string) {
    if (this.selectedLanguageName() === langName) {
      this.selectedLanguageName.set(''); // Deselect
    } else {
      this.selectedLanguageName.set(langName);
    }
    this.page.set(1);
    this.isMobileFilterOpen.set(false);
  }

  onPriceTypeChange(type: 'all' | 'free' | 'paid') {
    this.priceType.set(type);
    this.page.set(1);
    this.isMobileFilterOpen.set(false);
  }

  onSortChange(val: string) {
    this.sortBy.set(val);
    this.page.set(1);
    this.isMobileFilterOpen.set(false);
  }

  onSearch(val: string) {
    this.searchQuery.set(val.trim());
    this.page.set(1);
    this.isMobileFilterOpen.set(false);
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedCategoryId.set(null);
    this.selectedLanguageName.set('');
    this.priceType.set('all');
    this.sortBy.set('newest');
    this.page.set(1);
    this.isMobileFilterOpen.set(false);
  }

  setPage(pageNo: number) {
    if (pageNo >= 1 && pageNo <= this.totalPages()) {
      this.page.set(pageNo);
    }
  }
}
