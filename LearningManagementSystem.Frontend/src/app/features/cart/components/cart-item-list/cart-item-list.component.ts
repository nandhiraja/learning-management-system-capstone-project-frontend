import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../../../models/cart.model';

@Component({
  selector: 'app-cart-item-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-item-list.component.html',
  styleUrl: './cart-item-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartItemListComponent {
  @Input({ required: true }) items: CartItem[] = [];
  @Input({ required: true }) selectedIds: Set<number> = new Set<number>();

  @Output() toggleSelect = new EventEmitter<number>();
  @Output() toggleSelectAll = new EventEmitter<void>();
  @Output() removeItem = new EventEmitter<number>();

  isAllSelected(): boolean {
    return this.items.length > 0 && this.selectedIds.size === this.items.length;
  }

  isSomeSelected(): boolean {
    return this.items.length > 0 && 
           this.selectedIds.size > 0 && 
           this.selectedIds.size < this.items.length;
  }

  onToggleItem(courseId: number) {
    this.toggleSelect.emit(courseId);
  }

  onToggleSelectAll() {
    this.toggleSelectAll.emit();
  }

  onRemoveItem(courseId: number) {
    this.removeItem.emit(courseId);
  }
}
