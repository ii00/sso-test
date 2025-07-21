import { Injectable, inject } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { MsalService } from '@azure/msal-angular'

@Injectable({
    providedIn: 'root',
})
export class ArchivingGuard implements CanActivate {
    private msalService = inject(MsalService)
    private router = inject(Router)

    canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
        const account = this.msalService.instance.getAllAccounts()[0]

        if (!account) {
            console.warn('No authenticated account found')
            this.router.navigate(['/login'])
            return false
        }

        // Simple check: only allow users with specific email domains to access archiving
        const email = account.username || account.localAccountId || ''
        console.log('Checking archiving access for user:', email)

        // Example: Allow only admin users (you can modify this logic)
        const allowedDomains = ['admin.com', 'yourdomain.com', 'yourcompany.onmicrosoft.com']
        const emailDomain = email.split('@')[1]

        // For demo purposes, let's also check if email contains 'admin'
        const isAdmin = email.toLowerCase().includes('admin') || allowedDomains.includes(emailDomain)

        if (!isAdmin) {
            console.warn(`Access denied to archiving for user: ${email}`)
            alert('Access Denied: You do not have permission to access the Archiving section.')
            this.router.navigate(['/dashboard/monitoring'])
            return false
        }

        console.log(`Access granted to archiving for user: ${email}`)
        return true
    }
}
