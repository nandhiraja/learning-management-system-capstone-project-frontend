import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div class="progress-container">
      <div class="progress-track" [attr.aria-label]="label" [style.height]="height">
        <div
          class="progress-fill"
          [style.width.%]="percent"
          [style.background]="color"
          role="progressbar"
          [attr.aria-valuenow]="percent"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      @if (showLabel) {
        <div class="progress-label">{{ percent }}% complete</div>
      }
    </div>
  `,
  styles: [`
    .progress-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .progress-track {
      width: 100%;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: var(--radius-sm);
      transition: width 0.3s ease;
    }
    .progress-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-2);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent {
  @Input({ required: true }) percent!: number;           // 0–100
  @Input() color = 'var(--color-accent)';
  @Input() label = 'Course progress';
  @Input() showLabel = true;
  @Input() height = '6px';
}
