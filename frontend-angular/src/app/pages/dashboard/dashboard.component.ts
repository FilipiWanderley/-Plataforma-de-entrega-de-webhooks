import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardMetrics } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatProgressSpinnerModule, 
    MatIconModule, 
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  metrics: DashboardMetrics | null = null;
  loading = true;
  successRate = 0;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.loading = true;
    this.http.get<DashboardMetrics>('http://localhost:8080/ops/metrics')
      .subscribe({
        next: (data) => {
          this.metrics = data;
          this.calculateMetrics(data);
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load metrics', err);
          this.snackBar.open('Failed to load metrics. Using offline mode.', 'Close', { duration: 3000 });
          // Fallback / Mock data
          const mockData: DashboardMetrics = {
            totalPending: 0,
            totalSuccess: 0,
            totalFailed: 0,
            totalDlq: 0,
            totalProcessing: 0
          };
          this.metrics = mockData;
          this.calculateMetrics(mockData);
          this.loading = false;
        }
      });
  }

  calculateMetrics(data: DashboardMetrics) {
    const total = data.totalSuccess + data.totalFailed + data.totalDlq;
    this.successRate = total > 0 ? (data.totalSuccess / total) * 100 : 0;
  }
}
