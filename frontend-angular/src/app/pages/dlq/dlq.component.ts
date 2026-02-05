import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DeliveryJob, DeliveryAttempt } from '../../models';

@Component({
  selector: 'app-dlq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dlq.component.html',
  styleUrl: './dlq.component.css'
})
export class DlqComponent implements OnInit {
  jobs: DeliveryJob[] = [];
  selectedJobAttempts: DeliveryAttempt[] = [];
  selectedJobId: string | null = null;
  loading = false;
  
  // Pagination
  page = 0;
  size = 20;
  totalPages = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.loading = true;
    this.http.get<any>(`http://localhost:8080/dlq?page=${this.page}&size=${this.size}`)
      .subscribe({
        next: (response) => {
          this.jobs = response.content;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load DLQ jobs', err);
          this.loading = false;
        }
      });
  }

  viewDetails(jobId: string) {
    if (this.selectedJobId === jobId) {
      this.selectedJobId = null;
      this.selectedJobAttempts = [];
      return;
    }
    
    this.selectedJobId = jobId;
    this.http.get<DeliveryAttempt[]>(`http://localhost:8080/deliveries/${jobId}/attempts`)
      .subscribe({
        next: (data) => {
          this.selectedJobAttempts = data;
        },
        error: (err) => console.error(err)
      });
  }

  replay(jobId: string) {
    if (!confirm('Are you sure you want to replay this job?')) return;

    this.http.post(`http://localhost:8080/dlq/${jobId}/replay`, {})
      .subscribe({
        next: () => {
          alert('Job requeued successfully');
          this.loadJobs(); // Refresh list
          this.selectedJobId = null;
        },
        error: (err) => {
          console.error('Replay failed', err);
          alert('Replay failed');
        }
      });
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadJobs();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadJobs();
    }
  }
}
