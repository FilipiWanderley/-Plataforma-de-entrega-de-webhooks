import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { WebhookEndpoint } from '../../core/models';
import { AuditDialogComponent } from '../../shared/components/audit-dialog/audit-dialog.component';

@Component({
  selector: 'app-endpoints',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ClipboardModule
  ],
  templateUrl: './endpoints.component.html',
  styleUrl: './endpoints.component.css'
})
export class EndpointsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'url', 'status', 'maxAttempts', 'actions'];
  dataSource = new MatTableDataSource<WebhookEndpoint>([]);
  loading = false;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadEndpoints();
  }

  loadEndpoints() {
    this.loading = true;
    this.http.get<WebhookEndpoint[]>('http://localhost:8080/endpoints').subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load endpoints', err);
        this.snackBar.open('Failed to load endpoints', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  changeStatus(endpoint: WebhookEndpoint) {
    const newStatus = endpoint.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'Activate' : 'Pause';
    
    const dialogRef = this.dialog.open(AuditDialogComponent, {
      data: {
        title: `${action} Endpoint`,
        message: `Are you sure you want to ${action.toLowerCase()} "${endpoint.name}"?`,
        confirmText: action,
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        // Send status change with audit note (if backend supports it)
        // For now, just status change
        this.http.put(`http://localhost:8080/endpoints/${endpoint.id}/status?status=${newStatus}`, {
          note: result.note // Hypothetical payload
        }).subscribe({
          next: () => {
            this.snackBar.open(`Endpoint ${newStatus.toLowerCase()} successfully`, 'Close', { duration: 3000 });
            this.loadEndpoints();
          },
          error: () => this.snackBar.open(`Failed to ${action.toLowerCase()} endpoint`, 'Close', { duration: 3000 })
        });
      }
    });
  }

  onCopied() {
    this.snackBar.open('Endpoint ID copied', 'Close', { duration: 2000 });
  }
}
