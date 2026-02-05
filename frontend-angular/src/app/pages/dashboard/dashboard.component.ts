import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardMetrics } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  metrics: DashboardMetrics | null = null;
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<DashboardMetrics>('http://localhost:8080/ops/metrics')
      .subscribe({
        next: (data) => {
          this.metrics = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load metrics', err);
          this.loading = false;
        }
      });
  }
}
