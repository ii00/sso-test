# MSAL Guard Configuration for Role-Based Access Control

This document explains how to configure Azure AD and MSAL to implement role-based access control in your Angular application.

## Overview

We've implemented two approaches for controlling access to the Archiving component:

1. **Simple Domain/Email-based Guard** (`ArchivingGuard`)
2. **Role-based Guard** (`RoleGuard`) - for Azure AD roles/groups

## Current Implementation

### 1. Simple Access Control (Currently Active)

**File: `src/app/guards/archiving.guard.ts`**

The current implementation uses simple email domain checking:

- Users with email containing "admin" can access archiving
- Users from specific domains can access archiving
- All other users are redirected to monitoring

### 2. Role-Based Access Control (Available)

**File: `src/app/guards/role.guard.ts`**

This guard can check:

- Azure AD roles from the `roles` claim
- Azure AD groups from the `groups` claim
- Custom permissions from the `permissions` claim
- Business rules (domain checks, etc.)

## How to Enable Role-Based Access

### Step 1: Configure Azure AD Application

1. **Go to Azure Portal** → Azure Active Directory → App registrations
2. **Select your application**
3. **Add App Roles** (App registrations → [Your App] → App roles):

```json
{
    "allowedMemberTypes": ["User"],
    "description": "Archive administrators can manage all archive data",
    "displayName": "Archive Admin",
    "id": "12345678-1234-1234-1234-123456789012",
    "isEnabled": true,
    "origin": "Application",
    "value": "Archive-Admin"
}
```

### Step 2: Assign Users to Roles

1. **Go to Enterprise applications** → [Your App] → Users and groups
2. **Add assignment**
3. **Select users and assign roles**

### Step 3: Update Token Configuration

1. **Go to App registrations** → [Your App] → Token configuration
2. **Add optional claim**:
    - Token type: ID
    - Claim: roles
    - Turn on "Microsoft Graph permissions"

### Step 4: Switch to Role-Based Guard

Update `src/app/dashboard/routes.ts`:

```typescript
{
    path: 'archiving',
    loadComponent: () => import('./archiving/archiving.component').then((m) => m.ArchivingComponent),
    canActivate: [MsalGuard, RoleGuard],
    data: {
        roles: ['Archive-Admin', 'Data-Manager'],
        permissions: ['archive.read', 'archive.write'],
    },
},
```

## Permission Service Usage

Use `PermissionService` in components to conditionally show/hide UI elements:

```typescript
// In component
canUserEdit = this.permissionService.hasRole(['Archive-Admin']);
canUserView = this.permissionService.hasPermission(['archive.read']);

// In template
<button *ngIf="canUserEdit">Edit Archive</button>
```

## Testing Access Control

### Test Users

1. **Admin User**: Email contains "admin" → Has archiving access
2. **Regular User**: Email doesn't contain "admin" → No archiving access

### How to Test:

1. **Login with different users**
2. **Check the dashboard navigation**:
    - Admin users see green "Admin" badge on Archiving tab
    - Regular users see red "Restricted" badge and grayed-out tab
3. **Try to access `/dashboard/archiving` directly**:
    - Admin users: Success
    - Regular users: Redirected to monitoring with alert

## Advanced Configuration

### Custom Business Logic

Modify the guards to implement your specific business rules:

```typescript
private checkBusinessRules(account: AccountInfo): boolean {
    // Example: Only users from specific departments
    const department = this.getUserClaim(account, 'department');
    return ['IT', 'Security', 'Archives'].includes(department);
}
```

### Multiple Permission Levels

```typescript
// routes.ts
data: {
    roles: ['Archive-Admin'], // Full access
    permissions: ['archive.read'], // Read-only access
}
```

### Group-Based Access

If using Azure AD groups instead of app roles:

```typescript
// The guard automatically checks both 'roles' and 'groups' claims
data: {
    roles: ['Archive-Administrators', 'Data-Managers'], // Group names
}
```

## Environment Configuration

Update your environment files to include role/permission configuration:

```typescript
// environment.ts
export const environment = {
    msalConfig: {
        // ... existing config
        requestedClaims: ['roles', 'groups', 'permissions'],
    },
}
```

## Troubleshooting

### Common Issues:

1. **Roles not appearing in token**:
    - Check app roles are created in Azure AD
    - Verify users are assigned to roles
    - Ensure "roles" claim is configured in token configuration

2. **Guard not triggering**:
    - Verify guard is imported and added to route
    - Check console for error messages
    - Ensure MSAL is properly initialized

3. **Permissions not working**:
    - Check token contents in browser dev tools
    - Verify claim names match your configuration
    - Test with different user accounts

### Debug Tips:

```typescript
// Add this to see token contents
console.log('Token claims:', account.idTokenClaims)
console.log('User roles:', this.permissionService.getUserRoles())
```

## Security Best Practices

1. **Always validate on backend** - Client-side guards are for UX only
2. **Use specific role names** - Avoid generic names like "admin"
3. **Implement principle of least privilege** - Give minimum required permissions
4. **Regular access reviews** - Periodically review user assignments
5. **Log access attempts** - Monitor who tries to access restricted areas
