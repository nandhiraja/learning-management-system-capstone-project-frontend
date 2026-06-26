import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type ChipVariant = 'accent' | 'success' | 'warning' | 'danger' | 'purple';

const CHIP_STYLES: Record<ChipVariant, { bg: string; color: string }> = {
  accent:  { bg: 'var(--color-accent-soft)',   color: 'var(--color-accent)'   },
  success: { bg: 'var(--color-success-soft)',  color: 'var(--color-success)'  },
  warning: { bg: 'var(--color-warning-soft)',  color: 'var(--color-warning)'  },
  danger:  { bg: 'var(--color-danger-soft)',   color: 'var(--color-danger)'   },
  purple:  { bg: 'var(--color-purple-soft)',   color: 'var(--color-purple)'   },
};

@Component({
  selector: 'app-badge-chip',
  standalone: true,
  template: `
    <span class="chip" [style.background]="styles.bg" [style.color]="styles.color">
      @if (icon) {
        <i [class]="'bi ' + icon" aria-hidden="true" style="margin-right: 4px;"></i>
      }
      <ng-content />
    </span>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 20px;
      line-height: 1.25;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeChipComponent {
  @Input({ required: true }) variant!: ChipVariant;
  @Input() icon?: string;

  get styles() {
    return CHIP_STYLES[this.variant];
  }
}
