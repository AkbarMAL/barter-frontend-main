# Backend API Integration Guide

## Overview
Your Next.js frontend has been fully adapted to work with the Laravel backend API. All authentication endpoints have been integrated with proper role handling, seller activation, and social authentication support.

## Changes Made

### 1. **Type Definitions** (`types/auth.ts`)
- Updated `User` interface to include role-based fields: `is_buyer`, `is_seller`, `is_admin`
- Added `roles` array field for role management
- Added `SellerProfile` and `UserProfile` types
- Added new response types: `ActivateSellerResponse`, `SocialAuthCallback`

### 2. **Authentication Service** (`services/authentication.ts`)
- Enhanced role checking with new functions: `isSeller()`, `isBuyer()`, `isAdmin()`
- Added `getUserRoles()` to get array of user roles
- Added `getSellerProfile()` to retrieve seller profile data
- Added `updateCurrentUser()` for updating stored user data
- Enhanced `logout()` with API call support
- Maintained backward compatibility with existing functions

### 3. **Auth Utils** (`lib/auth-utils.ts`)
- Added `canAccessAdmin()` for admin role checking
- Added `getUserRolesArray()` for roles management
- Added `getSellerProfileData()` and `getShopName()` helpers
- Added `getUserAvatar()` for profile image handling
- Updated to use new authentication service functions

### 4. **Register Page** (`app/register/page.tsx`)
- Removed role selection (all users now start as buyers)
- Removed shop_name field from registration
- Added optional WhatsApp number field
- Updated API request to match backend requirements
- Enhanced error handling with validation display
- Added auto-redirect to home after successful registration
- Updated social auth buttons placeholders

### 5. **Login Page** (`app/login/page.tsx`)
- Updated to handle new `roles`, `is_seller`, `seller_profile` in response
- Added seller dashboard redirect for seller users
- Enhanced error messages for different error scenarios (401, 403, 422)
- Added Google OAuth login integration
- Added Facebook OAuth login integration
- Improved UX with error state management

### 6. **Seller Service** (`services/seller.ts`) - NEW
Service for managing seller-specific operations:
- `activateSeller(data)` - POST /api/v1/seller/activate
- `deactivateSeller()` - POST /api/v1/seller/deactivate
- `updateSellerProfile(data)` - PUT /api/v1/seller/profile
- `getCurrentUserInfo()` - GET /api/v1/me
- `updateUserProfile(data)` - PUT /api/v1/me
- `changePassword(data)` - POST /api/v1/change-password
- `unlinkSocialAccount(provider)` - DELETE /api/v1/auth/social/{provider}

### 7. **Social Auth Service** (`services/social-auth.ts`) - NEW
Service for OAuth flows:
- `handleOAuthCallback(params)` - Process OAuth response
- `initiateGoogleLogin(redirectUrl)` - Start Google OAuth flow
- `initiateFacebookLogin(redirectUrl)` - Start Facebook OAuth flow
- `isSocialAuthUser()` - Check if user logged in via OAuth
- `getUserProvider()` - Get user's OAuth provider
- Session management helpers

### 8. **OAuth Callback Pages** - NEW
- `app/auth/google/callback/page.tsx` - Google OAuth callback handler
- `app/auth/facebook/callback/page.tsx` - Facebook OAuth callback handler
- Both pages handle OAuth response and redirect user appropriately

## API Integration Reference

### Authentication Endpoints
```
POST /api/v1/register          - Register new user (buyer by default)
POST /api/v1/login            - Login with email/password
GET  /api/v1/login/google     - Google OAuth redirect
GET  /api/v1/login/google/callback - Google OAuth callback
GET  /api/v1/login/facebook   - Facebook OAuth redirect
GET  /api/v1/login/facebook/callback - Facebook OAuth callback
POST /api/v1/logout           - Logout user
```

### User Profile Endpoints
```
GET  /api/v1/me                    - Get current user info
PUT  /api/v1/me                    - Update user profile
POST /api/v1/change-password       - Change password
DELETE /api/v1/auth/social/{provider} - Unlink social account
```

### Seller Endpoints
```
POST /api/v1/seller/activate   - Activate seller mode
POST /api/v1/seller/deactivate - Deactivate seller mode
PUT  /api/v1/seller/profile    - Update seller profile
```

## Usage Examples

### Check User Role
```typescript
import { isSeller, isBuyer, isAdmin } from "@/services/authentication";

if (isSeller()) {
  // Show seller dashboard
}

if (isBuyer()) {
  // Show buyer marketplace
}
```

### Get User Information
```typescript
import { getCurrentUser, getSellerProfile } from "@/services/authentication";
import { getUserId, getShopName } from "@/lib/auth-utils";

const user = getCurrentUser();
const shopName = getShopName();
const sellerProfile = getSellerProfile();
```

### Activate Seller Mode
```typescript
import { activateSeller } from "@/services/seller";
import { updateCurrentUser } from "@/services/authentication";

try {
  const response = await activateSeller({
    shop_name: "My Shop",
    shop_description: "Shop description",
    wa_number: "628123456789"
  });
  
  // Update local user data
  updateCurrentUser(response.data);
} catch (error) {
  console.error("Failed to activate seller:", error);
}
```

### Update Seller Profile
```typescript
import { updateSellerProfile } from "@/services/seller";

const formData = {
  shop_name: "Updated Shop Name",
  shop_description: "Updated description",
  shop_banner: fileObject // File instance
};

try {
  const response = await updateSellerProfile(formData);
  console.log("Profile updated:", response.data);
} catch (error) {
  console.error("Failed to update:", error);
}
```

### Update User Profile
```typescript
import { updateUserProfile } from "@/services/seller";

try {
  const response = await updateUserProfile({
    name: "John Doe",
    wa_number: "628987654321",
    avatar: avatarFile,
    bio: "My bio",
    city: "Jakarta"
  });
} catch (error) {
  console.error("Update failed:", error);
}
```

### Change Password
```typescript
import { changePassword } from "@/services/seller";

try {
  const response = await changePassword({
    current_password: "current123",
    new_password: "newpassword123",
    new_password_confirmation: "newpassword123"
  });
} catch (error) {
  console.error("Password change failed:", error);
}
```

## Environment Variables
Add to your `.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Response Data Structure

### Login/Register Response
```typescript
{
  success: true,
  message: "Login berhasil.",
  data: {
    user: {
      id: 1,
      name: "John",
      email: "john@example.com",
      phone: "628123456789",
      is_buyer: true,
      is_seller: false,
      is_admin: false,
      is_active: true,
      avatar: "avatar-url",
      roles: ["buyer"],
      profile: { /* UserProfile */ },
      sellerProfile: null
    },
    token: "auth-token-string",
    roles: ["buyer"],
    is_seller: false,
    seller_profile: null
  }
}
```

### Activate Seller Response
```typescript
{
  success: true,
  message: "Mode seller berhasil diaktifkan!",
  data: {
    // Full user object with updated seller profile
  },
  roles: ["buyer", "seller"]
}
```

## Role Management

### User Roles
- **buyer** - Can purchase products (default for all new users)
- **seller** - Can list and sell products (activated explicitly)
- **admin** - Full system access (set by backend only)

### Role Checking
```typescript
// Check if user has multiple roles
const roles = getUserRoles(); // Returns: ['buyer'] or ['buyer', 'seller']

// Check specific roles
if (isSeller() && isBuyer()) {
  console.log("User is both buyer and seller");
}
```

## Social Authentication Flow

1. User clicks "Login with Google/Facebook"
2. Frontend redirects to backend OAuth endpoint with state parameter
3. Backend handles OAuth provider interaction
4. User approves on provider's platform
5. Backend receives auth code and exchanges for access token
6. Backend gets user info and creates/updates local user
7. Backend redirects back to frontend callback page with token and user data
8. Frontend processes callback and saves auth credentials
9. User is logged in

## Protected Routes

Use the existing `protected-route.tsx` component to protect authenticated-only pages:

```typescript
"use client";

import { ProtectedRoute } from "@/components/protected-route";

export default function SellerDashboard() {
  return (
    <ProtectedRoute requiredRole="seller">
      <div>Seller Dashboard Content</div>
    </ProtectedRoute>
  );
}
```

## Error Handling

The API service includes automatic token management via interceptors. All requests automatically include the Bearer token from localStorage.

### Common Error Codes
- **401** - Unauthorized: Invalid or expired token
- **403** - Forbidden: User account disabled
- **422** - Unprocessable Entity: Validation failed
- **500** - Server error

## Next Steps

1. **Test Registration**: Verify user registration creates buyers correctly
2. **Test Login**: Verify login returns correct roles and seller profile
3. **Test Seller Activation**: Create page to activate seller mode
4. **Test OAuth**: Set up Google/Facebook OAuth credentials and test
5. **Create Seller Pages**: Build seller dashboard, product management, etc.
6. **Create Buyer Pages**: Build buyer marketplace, orders, etc.

## Important Notes

- All users are created as `is_buyer: true` by default
- `is_seller` is set to `true` only when user explicitly activates seller mode
- Social auth users are auto-verified
- Social auth users can unlink their account if they have a password set
- Seller profile is only available if `is_seller: true`
- Sensitive endpoints (like seller activation) require authentication

---
Last Updated: 2024
