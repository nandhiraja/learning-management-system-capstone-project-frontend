import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-course-search-header',
  standalone: true,
  templateUrl: './course-search-header.component.html',
  styleUrl: './course-search-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseSearchHeaderComponent {
  @Input() searchQuery = '';
  @Output() search = new EventEmitter<string>();

  onSubmit(event: Event, val: string) {
    event.preventDefault();
    this.search.emit(val);
  }
}
