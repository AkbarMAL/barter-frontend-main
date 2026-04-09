# Authorization & Middleware Guide

## Overview

Sistem autentikasi ini dirancang untuk e-commerce dengan fitur:
- 1 user bisa switch antara buyer dan seller
- Halaman publik dapat diakses tanpa login (/, /login, /register, /product/[id])
- Halaman protected memerlukan login (transactions, favorites, seller dashboard, dll)
- Automatic redirect ke login jika akses halaman protected tanpa token

## File Structure

### 1. `middleware.ts`
Middleware Next.js yang menghandle route protection:
- Proteksi halaman seller, transactions, favorites, notifications, purchases
- Allow publik pages tanpa token
- Redirect ke login page jika akses protected route tanpa token
- Redirect ke home jika sudah login mencoba akses login/register

### 2. `services/authentication.ts`
Core authentication functions:

```typescript
// Check auth status
isAuthenticated()      // Returns boolean
isSeller()            // Returns boolean
isBuyer()             // Returns boolean

// Get user info
getCurrentUser()      // Returns user object
getAuthToken()        // Returns token string

// Save/clear auth
saveAuthData(token, user)  // After login
logout()                   // Clear everything & redirect
clearAuthData()            // Clear without redirect
```

### 3. `lib/auth-utils.ts`
Helper utility functions for common auth checks:

```typescript
canAccessSeller()
canAccessBuyer()
getUserRole()
getUserId()
getBearerToken()
getAuthHeader()
```

### 4. `components/protected-route.tsx`
Protected route wrapper & auth hook:

```typescript
// In components/pages
import { ProtectedRoute, useAuth } from "@/components/protected-route";

// Wrap component
<ProtectedRoute requiredRole="seller">
  <SellerDashboard />
</ProtectedRoute>

// Or use hook
const { isAuthenticated, isSeller, user, loading } = useAuth();
```

## Usage Examples

### Login Page
```typescript
import { saveAuthData } from "@/services/authentication";

const handleLogin = async () => {
  const res = await api.post("/login", { email, password });
  const { token, user } = res.data.data;
  
  // Save auth using centralized function
  saveAuthData(token, user);
  router.push("/");
};
```

### Protect Seller Pages
```typescript
import { ProtectedRoute } from "@/components/protected-route";

export default function SellerDashboard() {
  return (
    <ProtectedRoute requiredRole="seller">
      <div>Seller Dashboard</div>
    </ProtectedRoute>
  );
}
```

### Use Auth Hook
```typescript
import { useAuth } from "@/components/protected-route";

export default function Sidebar() {
  const { user, isSeller, logout } = useAuth();
  
  return (
    <div>
      {user && <p>{user.name}</p>}
      {isSeller && <Link href="/seller">Dashboard Seller</Link>}
    </div>
  );
}
```

### API Calls with Auth
```typescript
import { getAuthHeader } from "@/lib/auth-utils";

const headers = getAuthHeader();
const res = await fetch("/api/my/products", { 
  headers: headers || {} 
});
```

## API Response Format

Backend harus return user object dengan field `role`:

```typescript
{
  success: true,
  data: {
    token: "xxxxx",
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "seller" | "buyer" | "both"
    }
  }
}
```

## LocalStorage Keys

- `auth_token` - Authentication token
- `token` - Backup token storage
- `current_user` - User object JSON
- `dashboard_data` - Cached dashboard data (buyer)
- `seller_dashboard_data` - Cached dashboard data (seller)

## Cookie Setup

Cookies are set untuk server-side middleware checking:
- `token` - Auth token (samesite=lax)
- `auth_token` - Backup token

## Protected Routes

```
/ ......................... PUBLIC
/login ..................... PUBLIC
/register .................. PUBLIC
/product/[id] .............. PUBLIC

/transactions .............. PROTECTED (buyer)
/favorites ................. PROTECTED (buyer)
/purchases ................. PROTECTED (buyer)
/notifications ............. PROTECTED
/seller/* .................. PROTECTED (seller)
```

## Logout Flow

```typescript
import { logout } from "@/services/authentication";

// Will:
// 1. Clear localStorage
// 2. Clear cookies
// 3. Redirect to /login
logout();
```

## Response Handling

```typescript
// Check if user has role for feature:
if (isSeller()) {
  // Show seller features
  // Access /seller routes
}

if (isBuyer()) {
  // Show buyer features
  // Access /transactions, /favorites
}

if (getCurrentUser()?.role === "both") {
  // User is both buyer & seller
  // Show both dashboards
}
```

## Tips

1. **Always save user object after login** dengan `saveAuthData(token, user)`
2. **Gunakan `useAuth()` hook** untuk conditional rendering berdasarkan auth status
3. **Wrap protected components** dengan `<ProtectedRoute>` untuk automatic redirect
4. **Use `getAuthHeader()`** untuk consistent API calls dengan token
5. **Clear cache on logout** - `clearAuthData()` membersihkan dashboard cache
