import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WebhookEndpoint } from '../../models';

@Component({
  selector: 'app-endpoints',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './endpoints.component.html',
  styleUrl: './endpoints.component.css'
})
export class EndpointsComponent implements OnInit {
  endpoints: WebhookEndpoint[] = [];
  loading = false;
  page = 0;
  size = 20;
  totalPages = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadEndpoints();
  }

  loadEndpoints() {
    this.loading = true;
    this.http.get<any>(`http://localhost:8080/endpoints?page=${this.page}&size=${this.size}`)
      .subscribe({
        next: (response) => {
          this.endpoints = response.content;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load endpoints', err);
          this.loading = false;
        }
      });
  }

  blockEndpoint(id: string) {
    if (!confirm('Are you sure you want to PAUSE/BLOCK this endpoint?')) return;
    
    this.http.post(`http://localhost:8080/endpoints/${id}/block`, {})
      .subscribe({
        next: () => {
          alert('Endpoint paused');
          this.loadEndpoints();
        },
        error: (err) => {
          console.error('Failed to block endpoint', err);
          alert('Failed to block endpoint');
        }
      });
  }

  activateEndpoint(id: string) {
    if (!confirm('Are you sure you want to ACTIVATE this endpoint?')) return;

    this.http.put(`http://localhost:8080/endpoints/${id}`, { status: 'ACTIVE' })
      .subscribe({
        next: () => {
          alert('Endpoint activated');
          this.loadEndpoints();
        },
        error: (err) => {
          console.error('Failed to activate endpoint', err);
          alert('Failed to activate endpoint');
        }
      });
  }
}
