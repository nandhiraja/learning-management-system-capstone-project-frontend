import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-pagination.component.html',
  styleUrl: './course-pagination.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursePaginationComponent {
  @Input({ required: true }) page!: number;
  @Input({ required: true }) totalPages!: number;
  @Input({ required: true }) pages!: number[];

  @Output() pageChange = new EventEmitter<number>();

  onSelectPage(pageNo: number) {
    if (pageNo >= 1 && pageNo <= this.totalPages) {
      this.pageChange.emit(pageNo);
    }
  }
}
