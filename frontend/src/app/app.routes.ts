import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'backlog' },
  { path: 'backlog', title: 'Backlog · FireScrum', loadComponent: () => import('./pages/backlog/component').then((m) => m.BacklogPage) },
  {
    path: 'features',
    title: 'Features · FireScrum',
    loadComponent: () => import('./pages/features/component').then((m) => m.FeaturesPage),
  },
  {
    path: 'planning',
    title: 'Planning · FireScrum',
    loadComponent: () => import('./pages/planning/component').then((m) => m.PlanningPage),
  },
  { path: 'sprint', title: 'Sprint · FireScrum', loadComponent: () => import('./pages/sprint/component').then((m) => m.SprintPage) },
  { path: '**', redirectTo: 'backlog' },
];
