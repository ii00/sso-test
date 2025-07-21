import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { MsalService } from '@azure/msal-angular'
import { PermissionService } from '../services/permission.service'

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
    private authService = inject(MsalService)
    private router = inject(Router)
    private permissionService = inject(PermissionService)

    ngOnInit(): void {
        // Check if user is authenticated
        if (this.authService.instance.getAllAccounts().length === 0) {
            this.router.navigate(['/login'])
        }
    }

    logout(): void {
        this.authService.logoutRedirect()
    }

    get userInfo() {
        const accounts = this.authService.instance.getAllAccounts()
        if (accounts.length > 0) {
            return accounts[0]
        }
        return null
    }

    // Check if user can access archiving
    get canAccessArchiving(): boolean {
        return this.permissionService.canAccessArchiving()
    }

    // Get detailed user info including roles and permissions
    get detailedUserInfo() {
        return this.permissionService.getCurrentUserInfo()
    }
}
