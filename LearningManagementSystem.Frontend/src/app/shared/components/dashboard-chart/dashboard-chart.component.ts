import { Component, Input, OnChanges, SimpleChanges, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ChartDataDto } from '../../../models/admin.model';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-chart.component.html',
  styleUrl: './dashboard-chart.component.css'
})
export class DashboardChartComponent implements OnChanges {
  @Input({ required: true }) type!: ChartType;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) dataDto!: ChartDataDto | undefined;
  @Input() labelName: string = 'Data';
  @Input() isCurrency: boolean = false;
  @Input() horizontal: boolean = false;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  private themeService = inject(ThemeService);

  public chartData: ChartData = {
    labels: [],
    datasets: [{ data: [] }]
  };

  constructor() {
    effect(() => {
      const isDark = this.themeService.theme() === 'dark';
      this.applyThemeColors(isDark);
    });
  }

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 10, bottom: 10 }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { family: "'Inter', system-ui, sans-serif", size: 13, weight: 500 },
          padding: 20,
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Inter', system-ui, sans-serif", size: 14, weight: 600 },
        bodyFont: { family: "'Inter', system-ui, sans-serif", size: 13, weight: 400 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const val = this.horizontal ? context.parsed.x : context.parsed.y;
            if (val !== null && val !== undefined && this.isCurrency) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
            } else {
              label += val !== null && val !== undefined ? val : context.parsed;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { 
          color: '#94a3b8',
          font: { family: "'Inter', system-ui, sans-serif", size: 12 }
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        border: { display: false }
      },
      y: {
        ticks: { 
          color: '#94a3b8',
          font: { family: "'Inter', system-ui, sans-serif", size: 12 },
          padding: 10
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        border: { display: false }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataDto'] && this.dataDto) {
      this.updateChartData();
    }

    if (this.horizontal) {
      this.chartOptions!.indexAxis = 'y';
      // Set legend to display false since horizontal bars are self-explanatory or single dataset
      this.chartOptions!.plugins!.legend!.display = false;
    } else {
      this.chartOptions!.indexAxis = 'x';
    }
    
    // Hide scales for pie/doughnut charts
    if (this.type === 'pie' || this.type === 'doughnut') {
      if (this.chartOptions?.scales) {
        this.chartOptions.scales = {
          x: { display: false },
          y: { display: false }
        };
      }
    }
  }

  private updateChartData() {
    if (!this.dataDto) return;

    // Generate colors based on type
    const backgroundColors = this.type === 'line' 
      ? ['rgba(16, 185, 129, 0.2)'] // Emerald green transparent
      : [
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(16, 185, 129, 0.8)', // Emerald
          'rgba(245, 158, 11, 0.8)', // Amber
          'rgba(239, 68, 68, 0.8)',  // Red
          'rgba(139, 92, 246, 0.8)'  // Purple
        ];

    const borderColors = this.type === 'line'
      ? ['rgba(16, 185, 129, 1)']
      : backgroundColors.map(color => color.replace('0.8', '1'));

    this.chartData = {
      labels: this.dataDto.labels,
      datasets: [
        {
          label: this.labelName,
          data: this.dataDto.data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          fill: this.type === 'line' ? 'origin' : false,
          tension: 0.4 // Smooth curves for line charts
        }
      ]
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  private applyThemeColors(isDark: boolean) {
    const textColor = isDark ? '#cbd5e1' : '#334155';
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    if (this.chartOptions?.plugins?.legend?.labels) {
      this.chartOptions.plugins.legend.labels.color = textColor;
    }
    if (this.chartOptions?.scales) {
      if (this.chartOptions.scales['x']) {
        const xScale = this.chartOptions.scales['x'] as any;
        if (xScale.ticks) xScale.ticks.color = tickColor;
        if (xScale.grid) xScale.grid.color = gridColor;
      }
      if (this.chartOptions.scales['y']) {
        const yScale = this.chartOptions.scales['y'] as any;
        if (yScale.ticks) yScale.ticks.color = tickColor;
        if (yScale.grid) yScale.grid.color = gridColor;
      }
    }

    if (this.chart) {
      this.chart.update();
    }
  }
}
