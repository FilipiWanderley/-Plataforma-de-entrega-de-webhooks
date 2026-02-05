import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary" *ngIf="authService.isAuthenticated$ | async">
      <span>Webhook OPS</span>
      <span class="spacer"></span>
      <div class="nav-links">
        <a mat-button routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a mat-button routerLink="/dlq" routerLinkActive="active">DLQ</a>
        <a mat-button routerLink="/endpoints" routerLinkActive="active">Endpoints</a>
        <button mat-button (click)="logout()">Logout</button>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    .nav-links {
      display: flex;
      gap: 1rem;
    }
    .active {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
