import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminCategoryResponse, AdminLanguageResponse } from '../../../../models/admin.model';

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-content.component.html',
  styleUrl: './admin-content.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminContentComponent {
  @Input({ required: true }) categories: AdminCategoryResponse[] = [];
  @Input({ required: true }) languages: AdminLanguageResponse[] = [];

  @Output() approveCat = new EventEmitter<number>();
  @Output() deleteCat = new EventEmitter<number>();
  @Output() approveLang = new EventEmitter<number>();
  @Output() deleteLang = new EventEmitter<number>();

  onApproveCategory(id: number, name: string) {
    if (confirm(`Are you sure you want to approve the category: ${name}?`)) {
      this.approveCat.emit(id);
    }
  }

  onDeleteCategory(id: number, name: string) {
    if (confirm(`Are you sure you want to delete the category: ${name}?`)) {
      this.deleteCat.emit(id);
    }
  }

  onApproveLanguage(id: number, name: string) {
    if (confirm(`Are you sure you want to approve the language: ${name}?`)) {
      this.approveLang.emit(id);
    }
  }

  onDeleteLanguage(id: number, name: string) {
    if (confirm(`Are you sure you want to delete the language: ${name}?`)) {
      this.deleteLang.emit(id);
    }
  }
}
