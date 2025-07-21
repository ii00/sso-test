export const environment = {
    production: false,
    msalConfig: {
        auth: {
            clientId: 'ffb57570-a86b-415a-83ad-9754e0dd1b37', // Your Client ID ✅
            authority: 'https://login.microsoftonline.com/common', // Use 'common' for multi-tenant or replace with your Tenant ID
            redirectUri: 'http://localhost:4200',
            postLogoutRedirectUri: 'http://localhost:4200',
        },
    },
    apiConfig: {
        scopes: ['user.read', 'openid', 'profile', 'api://ffb57570-a86b-415a-83ad-9754e0dd1b37/Task.Write'], // Scopes your app needs
        uri: 'https://graph.microsoft.com/v1.0/me', // Microsoft Graph API endpoint
    },
}
