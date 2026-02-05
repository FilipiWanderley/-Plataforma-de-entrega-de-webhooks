import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <span class="status-chip" [ngClass]="colorClass">
      {{ label }}
    </span>
  `,
  styles: [`
    .status-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid transparent;
      white-space: nowrap;
    }

    /* Colors */
    .status-chip.success {
      background-color: #edf7ed;
      color: #1e4620;
      border-color: #c8e6c9;
    }

    .status-chip.warning {
      background-color: #fff4e5;
      color: #663c00;
      border-color: #ffcc80;
    }

    .status-chip.error {
      background-color: #fdeded;
      color: #5f2120;
      border-color: #f5c6cb;
    }

    .status-chip.info {
      background-color: #e5f6fd;
      color: #014361;
      border-color: #b3e5fc;
    }

    .status-chip.default {
      background-color: #f5f5f5;
      color: rgba(0, 0, 0, 0.87);
      border-color: #e0e0e0;
    }
  `]
})
export class StatusChipComponent {
  @Input() status: string | undefined;

  get label(): string {
    return this.status || 'Unknown';
  }

  get colorClass(): string {
    const s = this.status?.toLowerCase();
    switch (s) {
      case 'active':
      case 'enabled':
      case 'succeeded':
        return 'success';
      case 'paused':
      case 'retrying':
        return 'warning';
      case 'failed':
      case 'blocked':
      case 'dlq':
        return 'error';
      case 'pending':
      case 'processing':
        return 'info';
      default:
        return 'default';
    }
  }
}
