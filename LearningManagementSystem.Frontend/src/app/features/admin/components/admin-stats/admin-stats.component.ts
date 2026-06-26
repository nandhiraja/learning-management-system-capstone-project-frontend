import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardResponse } from '../../../../models/admin.model';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stats.component.html',
  styleUrl: './admin-stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminStatsComponent {
  @Input({ required: true }) stats: AdminDashboardResponse | null = null;
}
