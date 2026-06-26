import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatCardData {
  value: string | number;
  label: string;
  icon: string;           // Bootstrap icon class e.g. 'bi-book'
  iconBg: string;         // CSS token e.g. 'var(--color-accent-soft)'
  iconColor: string;      // CSS token e.g. 'var(--color-accent)'
  delta?: string;
  deltaPositive?: boolean;
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  @Input({ required: true }) data!: StatCardData;
}
