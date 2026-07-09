import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstructorDashboardResponse } from '../../../../models/instructor.model';
import { DashboardChartComponent } from '../../../../shared/components/dashboard-chart/dashboard-chart.component';

@Component({
  selector: 'app-instructor-stats',
  standalone: true,
  imports: [CommonModule, DashboardChartComponent],
  templateUrl: './instructor-stats.component.html',
  styleUrl: './instructor-stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstructorStatsComponent {
  @Input({ required: true }) stats: InstructorDashboardResponse | null = null;
}
