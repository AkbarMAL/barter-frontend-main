
/**
 * Get current auth token from localStorage or cookie
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("current_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  const token = getAuthToken();
  return !!token;
};

/**
 * Check if user is seller (can be seller or both buyer+seller)
 */
export const isSeller = (): boolean => {
  if (typeof window === "undefined") return false;
  const userStr = localStorage.getItem("current_user");
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return user.role === "seller" || user.role === "both";
  } catch {
    return false;
  }
};

/**
 * Check if user is buyer
 */
export const isBuyer = (): boolean => {
  if (typeof window === "undefined") return false;
  const userStr = localStorage.getItem("current_user");
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return user.role === "buyer" || user.role === "both";
  } catch {
    return false;
  }
};

/**
 * Save auth data after login
 */
export const saveAuthData = (token: string, user: any) => {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("token", token);
  document.cookie = `token=${token}; path=/; samesite=lax; max-age=86400`;
  document.cookie = `auth_token=${token}; path=/; samesite=lax; max-age=86400`;
  localStorage.setItem("current_user", JSON.stringify(user));
};

/**
 * Logout from application
 */
export const logout = () => {
  if (typeof window === "undefined") return;
  
  // Clear localStorage
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token");
  localStorage.removeItem("current_user");
  localStorage.removeItem("dashboard_data");
  localStorage.removeItem("seller_dashboard_data");
  
  // Clear cookies
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "auth_token=; path=/; max-age=0";
  
  // Redirect to login
  window.location.href = "/login";
};

/**
 * Clear all auth data (without redirect)
 */
export const clearAuthData = () => {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token");
  localStorage.removeItem("current_user");
  localStorage.removeItem("dashboard_data");
  localStorage.removeItem("seller_dashboard_data");
  
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "auth_token=; path=/; max-age=0";
};