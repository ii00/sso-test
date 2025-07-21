import { Component, OnInit, OnDestroy, inject } from '@angular/core'
import { Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { Subject } from 'rxjs'
import { filter, takeUntil } from 'rxjs/operators'

// MSAL imports
import { MsalService, MsalBroadcastService } from '@azure/msal-angular'
import { InteractionStatus, EventMessage, EventType, AuthenticationResult } from '@azure/msal-browser'

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
    isIframe = false
    loginDisplay = false
    isInitializing = true // For MSAL initialization
    isLoading = false // For login button loading
    error: string | null = null
    private readonly _destroying$ = new Subject<void>()
    private subscriptionsSetup = false

    private authService = inject(MsalService)
    private msalBroadcastService = inject(MsalBroadcastService)
    private router = inject(Router)

    ngOnInit(): void {
        this.isIframe = window !== window.parent && !window.opener

        // Initialize MSAL first, then set up subscriptions
        this.initializeMsal()
    }

    private async initializeMsal(): Promise<void> {
        try {
            console.log('Initializing MSAL...')

            // Ensure MSAL is initialized
            await this.authService.instance.initialize()
            console.log('MSAL initialized successfully')

            // Now safe to set login display and set up subscriptions
            this.setLoginDisplay()
            this.setupMsalSubscriptions()
            this.isInitializing = false // Initialization complete
        } catch (error) {
            console.error('MSAL initialization error:', error)
            this.error = 'Authentication system failed to initialize. Please refresh the page.'
            this.isInitializing = false
        }
    }

    retryInitialization(): void {
        this.error = null
        this.isInitializing = true
        this.initializeMsal()
    }

    private setupMsalSubscriptions(): void {
        // Avoid setting up subscriptions multiple times
        if (this.subscriptionsSetup) {
            return
        }
        this.subscriptionsSetup = true

        // Handle redirect response
        this.authService.handleRedirectObservable().subscribe({
            next: (result: AuthenticationResult) => {
                if (result) {
                    console.log('Redirect Login Success - Authentication Result:', result)
                    this.setLoginDisplay()
                    this.onLoginSuccess()
                }
            },
            error: (error) => {
                console.error('Login error:', error)
                this.error = 'Login failed. Please try again.'
                this.isLoading = false
            },
        })

        // Listen for interaction status changes
        this.msalBroadcastService.inProgress$
            .pipe(
                filter((status: InteractionStatus) => status === InteractionStatus.None),
                takeUntil(this._destroying$)
            )
            .subscribe(() => {
                this.setLoginDisplay()
                this.isLoading = false
            })

        // Listen for account changes
        this.msalBroadcastService.msalSubject$
            .pipe(
                filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.LOGIN_SUCCESS),
                takeUntil(this._destroying$)
            )
            .subscribe((eventMsg) => {
                console.log('MSAL Event - Login Success:', eventMsg)
                this.setLoginDisplay()
                this.onLoginSuccess()
            })
    }

    ngOnDestroy(): void {
        this._destroying$.next(undefined)
        this._destroying$.complete()
    }

    setLoginDisplay(): void {
        try {
            this.loginDisplay = this.authService.instance.getAllAccounts().length > 0
        } catch (error) {
            console.error('Error checking login display:', error)
            this.loginDisplay = false
        }
    }

    async loginWithRedirect(): Promise<void> {
        this.isLoading = true
        this.error = null

        try {
            // Ensure MSAL is initialized before login
            await this.authService.instance.initialize()

            this.authService.loginRedirect({
                scopes: ['user.read', 'openid', 'profile'],
                prompt: 'select_account',
            })
        } catch (error) {
            console.error('Redirect login initialization error:', error)
            this.error = 'Authentication system not ready. Please try again.'
            this.isLoading = false
        }
    }

    async loginWithPopup(): Promise<void> {
        this.isLoading = true
        this.error = null

        try {
            // Ensure MSAL is initialized before login
            await this.authService.instance.initialize()

            this.authService
                .loginPopup({
                    scopes: ['user.read', 'openid', 'profile'],
                    prompt: 'select_account',
                })
                .subscribe({
                    next: (result) => {
                        console.log('Popup Login Success - Authentication Result:', result)
                        this.setLoginDisplay()
                        this.onLoginSuccess()
                        this.isLoading = false
                    },
                    error: (error) => {
                        console.error('Popup login error:', error)
                        this.error = 'Login failed. Please try again.'
                        this.isLoading = false
                    },
                })
        } catch (error) {
            console.error('Popup login initialization error:', error)
            this.error = 'Authentication system not ready. Please try again.'
            this.isLoading = false
        }
    }

    onLoginSuccess(): void {
        if (this.loginDisplay) {
            console.log('Login successful, redirecting to dashboard...')
            this.router.navigate(['/dashboard'])
        }
    }

    // Get user info if available
    get userInfo() {
        const accounts = this.authService.instance.getAllAccounts()
        if (accounts.length > 0) {
            return accounts[0]
        }
        return null
    }
}
