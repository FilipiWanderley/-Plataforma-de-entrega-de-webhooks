import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DlqComponent } from './pages/dlq/dlq.component';
import { DlqDetailComponent } from './pages/dlq-detail/dlq-detail.component';
import { EndpointsComponent } from './pages/endpoints/endpoints.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './guards/auth.guard';

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
