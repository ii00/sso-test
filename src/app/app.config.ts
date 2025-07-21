import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, withFetch } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

import { APP_ROUTES } from './app.routes'
import { environment } from '../environments/environment'

// MSAL imports
import { IPublicClientApplication, PublicClientApplication, InteractionType, BrowserCacheLocation, LogLevel } from '@azure/msal-browser'
import {
    MsalInterceptor,
    MSAL_INSTANCE,
    MsalInterceptorConfiguration,
    MsalGuardConfiguration,
    MSAL_GUARD_CONFIG,
    MSAL_INTERCEPTOR_CONFIG,
    MsalService,
    MsalGuard,
    MsalBroadcastService,
} from '@azure/msal-angular'

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1

// MSAL Logger callback
export function loggerCallback(logLevel: LogLevel, message: string): void {
    if (logLevel === LogLevel.Error) {
        console.error('MSAL Error:', message)
    } else if (logLevel === LogLevel.Warning) {
        console.warn('MSAL Warning:', message)
    } else if (logLevel === LogLevel.Info) {
        console.info('MSAL Info:', message)
    }
}

// MSAL Instance Factory
export function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
        auth: {
            clientId: environment.msalConfig.auth.clientId,
            authority: environment.msalConfig.auth.authority,
            redirectUri: environment.msalConfig.auth.redirectUri,
            postLogoutRedirectUri: environment.msalConfig.auth.postLogoutRedirectUri,
        },
        cache: {
            cacheLocation: BrowserCacheLocation.LocalStorage,
            storeAuthStateInCookie: isIE,
        },
        system: {
            allowPlatformBroker: false, // Disables WAM Broker
            loggerOptions: {
                loggerCallback,
                logLevel: LogLevel.Info,
                piiLoggingEnabled: false,
            },
        },
    })
}

// MSAL Guard Configuration Factory
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Redirect,
        authRequest: {
            scopes: [...environment.apiConfig.scopes],
        },
        loginFailedRoute: '/login-failed',
    }
}

// MSAL Interceptor Configuration Factory
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
    const protectedResourceMap = new Map<string, string[]>()
    protectedResourceMap.set(environment.apiConfig.uri, environment.apiConfig.scopes)

    return {
        interactionType: InteractionType.Redirect,
        protectedResourceMap,
    }
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(APP_ROUTES),
        importProvidersFrom(BrowserModule),
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi(), withFetch()),
        // MSAL Providers
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true,
        },
        {
            provide: MSAL_INSTANCE,
            useFactory: MSALInstanceFactory,
        },
        {
            provide: MSAL_GUARD_CONFIG,
            useFactory: MSALGuardConfigFactory,
        },
        {
            provide: MSAL_INTERCEPTOR_CONFIG,
            useFactory: MSALInterceptorConfigFactory,
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService,
    ],
}
