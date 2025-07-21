import { Routes } from '@angular/router'
import { MsalGuard } from '@azure/msal-angular'

export const APP_ROUTES: Routes = [
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/routes').then((m) => m.DASHBOARD_ROUTES),
        canActivate: [MsalGuard],
    },
    {
        path: 'login-failed',
        loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    },
    {
        path: '**',
        redirectTo: '/login',
    },
]
