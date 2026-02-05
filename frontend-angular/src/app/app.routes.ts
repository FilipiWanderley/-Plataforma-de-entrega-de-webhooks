import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DlqComponent } from './features/dlq/dlq.component';
import { DlqDetailComponent } from './features/dlq-detail/dlq-detail.component';
import { EndpointsComponent } from './features/endpoints/endpoints.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: MainLayoutComponent, 
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'dlq', component: DlqComponent },
      { path: 'dlq/:id', component: DlqDetailComponent },
      { path: 'endpoints', component: EndpointsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
