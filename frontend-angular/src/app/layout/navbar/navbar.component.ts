import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" *ngIf="authService.isAuthenticated$ | async">
      <div class="brand">Webhook OPS</div>
      <ul class="nav-links">
        <li><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
        <li><a routerLink="/dlq" routerLinkActive="active">DLQ</a></li>
        <li><a routerLink="/endpoints" routerLinkActive="active">Endpoints</a></li>
      </ul>
      <button (click)="logout()" class="logout-btn">Logout</button>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background-color: #343a40;
      color: white;
    }
    .brand {
      font-weight: bold;
      font-size: 1.2rem;
    }
    .nav-links {
      display: flex;
      list-style: none;
      gap: 1.5rem;
      margin: 0;
      padding: 0;
    }
    .nav-links a {
      color: #ccc;
      text-decoration: none;
      font-weight: 500;
    }
    .nav-links a.active, .nav-links a:hover {
      color: white;
    }
    .logout-btn {
      background: transparent;
      border: 1px solid #ccc;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .logout-btn:hover {
      background: rgba(255,255,255,0.1);
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
