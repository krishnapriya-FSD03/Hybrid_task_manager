import { Routes } from '@angular/router';
import { authGuard, professionalGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'personal', pathMatch: 'full' },
      {
        path: 'personal',
        loadComponent: () =>
          import('./features/personal/task-board/task-board.component').then((m) => m.PersonalTaskBoardComponent),
      },
      {
        path: 'professional/teams',
        canActivate: [professionalGuard],
        loadComponent: () => import('./features/professional/teams/teams.component').then((m) => m.TeamsComponent),
      },
      {
        path: 'professional/teams/:id',
        canActivate: [professionalGuard],
        loadComponent: () =>
          import('./features/professional/team-detail/team-detail.component').then((m) => m.TeamDetailComponent),
      },
      {
        path: 'professional/teams/:id/add-members',
        canActivate: [professionalGuard],
        loadComponent: () =>
          import('./features/professional/add-members/add-members.component').then((m) => m.AddMembersComponent),
      },
      {
        path: 'professional/boards/:id',
        canActivate: [professionalGuard],
        loadComponent: () => import('./features/professional/board/board.component').then((m) => m.ProjectBoardComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
