import { getAuthToken, getCurrentUser, isAuthenticated, isSeller, isBuyer } from "@/services/authentication";

/**
 * Check if user can access seller features
 */
export const canAccessSeller = (): boolean => {
  return isAuthenticated() && isSeller();
};

/**
 * Check if user can access buyer features
 */
export const canAccessBuyer = (): boolean => {
  return isAuthenticated() && isBuyer();
};

/**
 * Get user role string
 */
export const getUserRole = (): string | null => {
  const user = getCurrentUser();
  return user?.role || null;
};

/**
 * Get user ID
 */
export const getUserId = (): number | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

/**
 * Get user name
 */
export const getUserName = (): string | null => {
  const user = getCurrentUser();
  return user?.name || null;
};

/**
 * Get user email
 */
export const getUserEmail = (): string | null => {
  const user = getCurrentUser();
  return user?.email || null;
};

/**
 * Get Bearer token for API calls
 */
export const getBearerToken = (): string | null => {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : null;
};

/**
 * Create Authorization header
 */
export const getAuthHeader = (): Record<string, string> | null => {
  const token = getAuthToken();
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
  };
};
