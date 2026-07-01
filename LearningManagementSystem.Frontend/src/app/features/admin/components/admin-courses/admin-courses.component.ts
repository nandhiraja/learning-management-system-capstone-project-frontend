import { Component, Input, ChangeDetectionStrategy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseResponse } from '../../../../models/course.model';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-courses.component.html',
  styleUrl: './admin-courses.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCoursesComponent {
  @Input({ required: true }) courses: CourseResponse[] = [];

  // Filter signals
  protected searchTerm = signal<string>('');
  protected selectedStatus = signal<string>('ALL');

  protected isStatusDropdownOpen = signal<boolean>(false);
  protected statusDisplayNames: Record<string, string> = {
    'ALL': 'All Statuses',
    'Published': 'Published',
    'PendingReview': 'Pending Review',
    'Rejected': 'Rejected',
    'Archived': 'Archived'
  };

  toggleStatusDropdown() {
    this.isStatusDropdownOpen.update(val => !val);
  }

  selectStatus(status: string) {
    this.selectedStatus.set(status);
    this.isStatusDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.isStatusDropdownOpen.set(false);
    }
  }

  // Filtered courses
  protected filteredCourses = computed<CourseResponse[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.courses.filter(course => {
      const matchesSearch = 
        !term || 
        course.title.toLowerCase().includes(term) ||
        (course.instructor && (
          course.instructor.firstName.toLowerCase().includes(term) || 
          course.instructor.lastName.toLowerCase().includes(term)
        ));

      const matchesStatus = 
        status === 'ALL' || 
        course.status.toString().toUpperCase() === status.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  });

  onSearchChange(val: string) {
    this.searchTerm.set(val);
  }

  onStatusChange(val: string) {
    this.selectedStatus.set(val);
  }

  // Helper to map status enum values to human readable statuses
  getStatusLabel(status: number | string): string {
    // Check if status is a number (enum index) or string
    if (typeof status === 'number') {
      const map: { [key: number]: string } = {
        0: 'Draft',
        1: 'Published',
        2: 'PendingReview',
        3: 'Rejected',
        4: 'Archived'
      };
      return map[status] || 'Unknown';
    }
    return String(status);
  }
}
