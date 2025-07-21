import { Injectable, inject } from '@angular/core'
import { MsalService } from '@azure/msal-angular'
import { AccountInfo } from '@azure/msal-browser'

@Injectable({
    providedIn: 'root',
})
export class PermissionService {
    private msalService = inject(MsalService)

    /**
     * Check if the current user has access to archiving functionality
     */
    canAccessArchiving(): boolean {
        const account = this.getCurrentAccount()
        if (!account) return false

        // Same logic as ArchivingGuard for consistency
        const email = account.username || account.localAccountId || ''
        const allowedDomains = ['admin.com', 'yourdomain.com', 'yourcompany.onmicrosoft.com']
        const emailDomain = email.split('@')[1]

        return email.toLowerCase().includes('admin') || allowedDomains.includes(emailDomain)
    }

    /**
     * Check if user has specific roles
     */
    hasRole(roles: string | string[]): boolean {
        const account = this.getCurrentAccount()
        if (!account) return false

        const userRoles = this.getUserRoles(account)
        const requiredRoles = Array.isArray(roles) ? roles : [roles]

        return requiredRoles.some((role) => userRoles.includes(role))
    }

    /**
     * Check if user has specific permissions
     */
    hasPermission(permissions: string | string[]): boolean {
        const account = this.getCurrentAccount()
        if (!account) return false

        const userPermissions = this.getUserPermissions(account)
        const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions]

        return requiredPermissions.some((permission) => userPermissions.includes(permission))
    }

    /**
     * Get current user's roles from Azure AD token
     */
    getUserRoles(account?: AccountInfo): string[] {
        const currentAccount = account || this.getCurrentAccount()
        if (!currentAccount) return []

        const idTokenClaims = currentAccount.idTokenClaims as Record<string, unknown>

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

    /**
     * Get current user's permissions from Azure AD token
     */
    getUserPermissions(account?: AccountInfo): string[] {
        const currentAccount = account || this.getCurrentAccount()
        if (!currentAccount) return []

        const idTokenClaims = currentAccount.idTokenClaims as Record<string, unknown>

        if (idTokenClaims?.['permissions']) {
            const permissions = idTokenClaims['permissions']
            return Array.isArray(permissions) ? (permissions as string[]) : [permissions as string]
        }

        return []
    }

    /**
     * Check if user is from allowed domain
     */
    isFromAllowedDomain(allowedDomains: string[]): boolean {
        const account = this.getCurrentAccount()
        if (!account) return false

        const email = account.username || account.localAccountId || ''
        const emailDomain = email.split('@')[1]

        return allowedDomains.includes(emailDomain)
    }

    /**
     * Get current user account
     */
    private getCurrentAccount(): AccountInfo | null {
        const accounts = this.msalService.instance.getAllAccounts()
        return accounts.length > 0 ? accounts[0] : null
    }

    /**
     * Get user info for display purposes
     */
    getCurrentUserInfo(): { email: string; name: string; roles: string[]; permissions: string[] } | null {
        const account = this.getCurrentAccount()
        if (!account) return null

        return {
            email: account.username || account.localAccountId || '',
            name: account.name || 'Unknown User',
            roles: this.getUserRoles(account),
            permissions: this.getUserPermissions(account),
        }
    }
}
