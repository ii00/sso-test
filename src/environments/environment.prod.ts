export const environment = {
    production: true,
    msalConfig: {
        auth: {
            clientId: 'YOUR_CLIENT_ID_HERE', // Replace with your Azure AD App Registration Client ID
            authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID_HERE', // Replace with your tenant ID or 'common'
            redirectUri: 'https://your-app-domain.com',
            postLogoutRedirectUri: 'https://your-app-domain.com',
        },
    },
    apiConfig: {
        scopes: ['user.read', 'openid', 'profile'], // Scopes your app needs
        uri: 'https://graph.microsoft.com/v1.0/me', // Microsoft Graph API endpoint
    },
}
