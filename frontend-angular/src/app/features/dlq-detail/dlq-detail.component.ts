import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DeliveryJob, DeliveryAttempt, WebhookEndpoint } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-dlq-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ClipboardModule
  ],
  templateUrl: './dlq-detail.component.html',
  styleUrls: ['./dlq-detail.component.css']
})
export class DlqDetailComponent implements OnInit {
  job: DeliveryJob | null = null;
  attempts: DeliveryAttempt[] = [];
  endpoint: WebhookEndpoint | null = null;
  payload: string = '';
  loading = false;
  jobId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.jobId = this.route.snapshot.paramMap.get('id');
    if (this.jobId) {
      this.loadData(this.jobId);
    }
  }

  loadData(id: string) {
    this.loading = true;
    // Load Job Details
    this.http.get<DeliveryJob>(`http://localhost:8080/deliveries/${id}`).subscribe({
      next: (job) => {
        this.job = job;
        this.loadEndpoint(job.endpointId);
        // Mock payload loading if not in job
        this.payload = JSON.stringify({ event: 'order.created', data: { id: '123', amount: 99.99 } }, null, 2); 
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load job', err);
        this.snackBar.open('Failed to load job details', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });

    // Load Attempts
    this.http.get<DeliveryAttempt[]>(`http://localhost:8080/deliveries/${id}/attempts`).subscribe({
      next: (attempts) => this.attempts = attempts,
      error: (err) => console.error('Failed to load attempts', err)
    });
  }

  loadEndpoint(endpointId: string) {
    this.http.get<WebhookEndpoint>(`http://localhost:8080/endpoints/${endpointId}`).subscribe({
      next: (endpoint) => this.endpoint = endpoint,
      error: (err) => console.error('Failed to load endpoint', err)
    });
  }

  replay() {
    if (!this.jobId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Replay',
        message: 'Are you sure you want to replay this job? It will be moved from DLQ to the active queue.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post(`http://localhost:8080/dlq/${this.jobId}/replay`, {}).subscribe({
          next: () => {
            this.snackBar.open('Job queued for replay', 'Close', { duration: 3000 });
            this.router.navigate(['/dlq']);
          },
          error: () => this.snackBar.open('Replay failed', 'Close', { duration: 3000 })
        });
      }
    });
  }

  toggleEndpointStatus() {
    if (!this.endpoint) return;

    const newStatus = this.endpoint.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'Activate' : 'Pause';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Confirm ${action}`,
        message: `Are you sure you want to ${action.toLowerCase()} this endpoint?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.put(`http://localhost:8080/endpoints/${this.endpoint!.id}/status?status=${newStatus}`, {}).subscribe({
          next: () => {
            this.endpoint!.status = newStatus;
            this.snackBar.open(`Endpoint ${newStatus.toLowerCase()}`, 'Close', { duration: 3000 });
          },
          error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 3000 })
        });
      }
    });
  }

  onCopied(label: string) {
    this.snackBar.open(`${label} copied to clipboard`, 'Close', { duration: 2000 });
  }
}
