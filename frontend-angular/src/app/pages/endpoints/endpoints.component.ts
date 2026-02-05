import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { WebhookEndpoint } from '../../models';

// Shared
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CardSectionComponent } from '../../shared/components/card-section/card-section.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { LoadingStateComponent, EmptyStateComponent, ErrorStateComponent } from '../../shared/components/data-state/data-state.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-endpoints',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    CardSectionComponent,
    StatusChipComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <app-page-header title="Endpoints" subtitle="Manage your webhook endpoints">
      <button mat-raised-button color="primary">
        <mat-icon>add</mat-icon>
        New Endpoint
      </button>
    </app-page-header>

    <app-card-section [noPadding]="true">
      <app-loading-state *ngIf="loading"></app-loading-state>
      
      <app-error-state *ngIf="error" [message]="error" (retry)="loadEndpoints()"></app-error-state>

      <div *ngIf="!loading && !error">
        <app-empty-state *ngIf="endpoints.length === 0" 
          title="No endpoints found" 
          description="Create your first endpoint to start receiving webhooks.">
          <button mat-raised-button color="primary" action>Create Endpoint</button>
        </app-empty-state>

        <table mat-table [dataSource]="endpoints" *ngIf="endpoints.length > 0">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Name </th>
            <td mat-cell *matCellDef="let element"> {{element.description || element.name || 'No Description'}} </td>
          </ng-container>

          <ng-container matColumnDef="url">
            <th mat-header-cell *matHeaderCellDef> URL </th>
            <td mat-cell *matCellDef="let element"> {{element.url}} </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef> Status </th>
            <td mat-cell *matCellDef="let element">
              <app-status-chip [status]="element.status"></app-status-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef align="right"> Actions </th>
            <td mat-cell *matCellDef="let element" align="right">
              <button mat-icon-button color="warn" *ngIf="element.status === 'ACTIVE'" (click)="blockEndpoint(element)" matTooltip="Pause/Block">
                <mat-icon>pause_circle_outline</mat-icon>
              </button>
              <button mat-icon-button color="primary" *ngIf="element.status !== 'ACTIVE'" (click)="activateEndpoint(element)" matTooltip="Activate">
                <mat-icon>play_circle_outline</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </app-card-section>
  `,
  styles: [`
    table {
      width: 100%;
    }
  `]
})
export class EndpointsComponent implements OnInit {
  endpoints: WebhookEndpoint[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns: string[] = ['name', 'url', 'status', 'actions'];
  
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  ngOnInit() {
    this.loadEndpoints();
  }

  loadEndpoints() {
    this.loading = true;
    this.error = null;
    this.http.get<any>(`http://localhost:8080/endpoints?page=0&size=20`)
      .subscribe({
        next: (response) => {
          this.endpoints = response.content;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load endpoints', err);
          this.error = 'Failed to load endpoints';
          this.toast.error('Failed to load endpoints');
          this.loading = false;
        }
      });
  }

  blockEndpoint(endpoint: WebhookEndpoint) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Pause Endpoint',
        message: `Are you sure you want to pause/block "${endpoint.description || endpoint.url}"?`,
        confirmText: 'Pause',
        severity: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post(`http://localhost:8080/endpoints/${endpoint.id}/block`, {})
          .subscribe({
            next: () => {
              this.toast.success('Endpoint paused');
              this.loadEndpoints();
            },
            error: (err) => {
              this.toast.error('Failed to pause endpoint');
            }
          });
      }
    });
  }

  activateEndpoint(endpoint: WebhookEndpoint) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Activate Endpoint',
        message: `Are you sure you want to activate "${endpoint.description || endpoint.url}"?`,
        confirmText: 'Activate'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.put(`http://localhost:8080/endpoints/${endpoint.id}`, { status: 'ACTIVE' })
          .subscribe({
            next: () => {
              this.toast.success('Endpoint activated');
              this.loadEndpoints();
            },
            error: (err) => {
              this.toast.error('Failed to activate endpoint');
            }
          });
      }
    });
  }
}
