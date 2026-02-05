import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
          [mode]="(isHandset$ | async) ? 'over' : 'side'"
          [opened]="(isHandset$ | async) === false">
        <mat-toolbar color="primary">Webhook Platform</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link" (click)="drawer.mode === 'over' && drawer.close()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/endpoints" routerLinkActive="active-link" (click)="drawer.mode === 'over' && drawer.close()">
            <mat-icon matListItemIcon>link</mat-icon>
            <span matListItemTitle>Endpoints</span>
          </a>
          <a mat-list-item routerLink="/dlq" routerLinkActive="active-link" (click)="drawer.mode === 'over' && drawer.close()">
            <mat-icon matListItemIcon>error_outline</mat-icon>
            <span matListItemTitle>DLQ</span>
          </a>
          <mat-divider></mat-divider>
          <a mat-list-item (click)="logout()">
            <mat-icon matListItemIcon>logout</mat-icon>
            <span matListItemTitle>Logout</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="main-toolbar">
          <button
            type="button"
            aria-label="Toggle sidenav"
            mat-icon-button
            (click)="drawer.toggle()"
            *ngIf="isHandset$ | async">
            <mat-icon>menu</mat-icon>
          </button>
          <span>Webhook OPS</span>
        </mat-toolbar>
        <div class="content-container">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100%;
    }
    
    .sidenav {
      width: 240px;
      box-shadow: 1px 0 0 0 rgba(0,0,0,0.12);
    }
    
    .sidenav .mat-toolbar {
      background: inherit;
      color: inherit;
    }
    
    .mat-toolbar.mat-primary {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .content-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .active-link {
      background-color: rgba(63, 81, 181, 0.08); /* Indigo 500 with opacity */
      color: #3f51b5; /* Indigo 500 */
      border-radius: 0 24px 24px 0;
      margin-right: 8px;
    }

    /* Enterprise styling adjustments */
    mat-nav-list {
      padding-top: 8px;
    }

    a[mat-list-item] {
      border-radius: 8px;
      margin: 4px 8px;
    }
  `]
})
export class MainLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  logout() {
    this.authService.logout();
  }
}
