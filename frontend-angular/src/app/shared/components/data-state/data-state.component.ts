import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="state-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p *ngIf="message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: rgba(0,0,0,0.6);
      gap: 16px;
    }
  `]
})
export class LoadingStateComponent {
  @Input() message = 'Loading...';
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="state-container">
      <div class="icon-placeholder" *ngIf="!icon">
        <div class="box"></div>
      </div>
      <ng-content select="[icon]"></ng-content>
      <h3>{{ title }}</h3>
      <p *ngIf="description">{{ description }}</p>
      <div class="actions">
        <ng-content select="[action]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }

    h3 {
      margin: 0 0 8px;
      font-weight: 600;
      color: rgba(0,0,0,0.87);
    }

    p {
      margin: 0 0 24px;
      color: rgba(0,0,0,0.6);
      max-width: 400px;
    }

    .icon-placeholder .box {
      width: 48px;
      height: 48px;
      background: #e0e0e0;
      border-radius: 8px;
      margin-bottom: 16px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'No data found';
  @Input() description = '';
  @Input() icon = false;
}

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="state-container">
      <mat-icon color="warn" class="large-icon">error_outline</mat-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button mat-stroked-button color="primary" (click)="retry.emit()" *ngIf="retry.observed">
        <mat-icon>refresh</mat-icon>
        Retry
      </button>
    </div>
  `,
  styles: [`
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .large-icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.8;
    }

    h3 {
      margin: 0 0 8px;
      font-weight: 600;
    }

    p {
      margin: 0 0 24px;
      color: rgba(0,0,0,0.6);
    }
  `]
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'An unexpected error occurred. Please try again.';
  @Input() retry: any; // EventEmitter
}
