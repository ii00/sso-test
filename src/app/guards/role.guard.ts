import { Injectable, inject } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { MsalService } from '@azure/msal-angular'
import { AccountInfo } from '@azure/msal-browser'

@Injectable({
    providedIn: 'root',
})
export class RoleGuard implements CanActivate {
    private msalService = inject(MsalService)
    private router = inject(Router)

    canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
        const account = this.msalService.instance.getAllAccounts()[0]

        if (!account) {
            console.warn('No authenticated account found')
            this.router.navigate(['/login'])
            return false
        }

        // Get required roles from route data
        const requiredRoles = route.data['roles'] as string[]
        const requiredPermissions = route.data['permissions'] as string[]

        // Check if user has required roles
        if (requiredRoles && !this.hasRequiredRoles(account, requiredRoles)) {
            console.warn('Access denied: User does not have required roles', requiredRoles)
            this.router.navigate(['/dashboard/monitoring']) // Redirect to monitoring instead
            return false
        }

        // Check if user has required permissions
        if (requiredPermissions && !this.hasRequiredPermissions(account, requiredPermissions)) {
            console.warn('Access denied: User does not have required permissions', requiredPermissions)
            this.router.navigate(['/dashboard/monitoring'])
            return false
        }

        // Check specific business logic (example: only certain email domains)
        if (!this.checkBusinessRules(account)) {
            console.warn('Access denied: User does not meet business requirements')
            this.router.navigate(['/dashboard/monitoring'])
            return false
        }

        return true
    }

    private hasRequiredRoles(account: AccountInfo, requiredRoles: string[]): boolean {
        // Check if user has roles in their claims
        const userRoles = this.getUserRoles(account)
        return requiredRoles.some((role) => userRoles.includes(role))
    }

    private hasRequiredPermissions(account: AccountInfo, requiredPermissions: string[]): boolean {
        // Check if user has permissions in their claims
        const userPermissions = this.getUserPermissions(account)
        return requiredPermissions.some((permission) => userPermissions.includes(permission))
    }

    private getUserRoles(account: AccountInfo): string[] {
        // Extract roles from ID token claims
        // Azure AD can include roles in 'roles' claim or 'groups' claim
        const idTokenClaims = account.idTokenClaims as Record<string, unknown>

        if (idTokenClaims?.['roles']) {
            const roles = idTokenClaims['roles']
            return Array.isArray(roles) ? (roles as string[]) : [roles as string]
        }

        if (idTokenClaims?.['groups']) {
            const groups = idTokenClaims['groups']
            return Array.isArray(groups) ? (groups as string[]) : [groups as string]
        }

        return []
    }

    private getUserPermissions(account: AccountInfo): string[] {
        // Extract permissions from ID token claims
        const idTokenClaims = account.idTokenClaims as Record<string, unknown>

        if (idTokenClaims?.['permissions']) {
            const permissions = idTokenClaims['permissions']
            return Array.isArray(permissions) ? (permissions as string[]) : [permissions as string]
        }

        return []
    }

    private checkBusinessRules(account: AccountInfo): boolean {
        // Example business logic: Only users from specific domain can access archiving
        const email = account.username || account.localAccountId || ''

        // Allow only users from your organization domain
        const allowedDomains = ['yourdomain.com', 'yourcompany.onmicrosoft.com']
        const emailDomain = email.split('@')[1]

        if (!allowedDomains.includes(emailDomain)) {
            return false
        }

        // Example: Check if user is in a specific group (you would get this from token claims)
        const userGroups = this.getUserRoles(account)
        const archivingGroups = ['Archive-Admins', 'Data-Managers', 'Archive-Users']

        return userGroups.some((group) => archivingGroups.includes(group))
    }
}
