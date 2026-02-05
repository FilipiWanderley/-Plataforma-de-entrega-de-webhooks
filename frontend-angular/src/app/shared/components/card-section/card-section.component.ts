import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-card-section',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule],
  template: `
    <mat-card appearance="outlined" class="card-section">
      <div *ngIf="title || hasAction" class="card-header">
        <div class="title-container">
          <h2 *ngIf="title" class="card-title">{{ title }}</h2>
        </div>
        <div class="action-container">
          <ng-content select="[action]"></ng-content>
        </div>
      </div>
      <mat-divider *ngIf="title || hasAction"></mat-divider>
      <mat-card-content [class.no-padding]="noPadding">
        <ng-content></ng-content>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .card-section {
      border-radius: 12px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }

    .card-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    mat-card-content {
      padding: 24px;
      
      &.no-padding {
        padding: 0;
      }
    }
  `]
})
export class CardSectionComponent {
  @Input() title = '';
  @Input() noPadding = false;
  @Input() hasAction = false;
}
