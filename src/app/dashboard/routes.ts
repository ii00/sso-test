import { Routes } from '@angular/router'
import { MsalGuard } from '@azure/msal-angular'
import { ArchivingGuard } from '../guards/archiving.guard'

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
        children: [
            {
                path: '',
                redirectTo: 'monitoring',
                pathMatch: 'full',
            },
            {
                path: 'monitoring',
                loadComponent: () => import('./monitoring/monitoring.component').then((m) => m.MonitoringComponent),
            },
            {
                path: 'archiving',
                loadComponent: () => import('./archiving/archiving.component').then((m) => m.ArchivingComponent),
                canActivate: [MsalGuard, ArchivingGuard], // Simple email-based guard
                // Alternative approach using role-based guard:
                // canActivate: [MsalGuard, RoleGuard],
                // data: {
                //     roles: ['Archive-Admin', 'Data-Manager'], // Required Azure AD roles
                //     permissions: ['archive.read', 'archive.write'], // Required permissions
                // },
            },
        ],
    },
]
