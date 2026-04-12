import { getAuthToken, getCurrentUser, isAuthenticated, isSeller, isBuyer, isAdmin, getUserRoles, getSellerProfile } from "@/services/authentication";

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
 * Check if user is admin
 */
export const canAccessAdmin = (): boolean => {
  return isAuthenticated() && isAdmin();
};

/**
 * Get user roles array
 */
export const getUserRolesArray = (): string[] => {
  return getUserRoles();
};

/**
 * Get user role string (for backward compatibility, returns primary role)
 */
export const getUserRole = (): string | null => {
  const roles = getUserRoles();
  if (isSeller()) return "seller";
  if (isBuyer()) return "buyer";
  return null;
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
 * Get user avatar
 */
export const getUserAvatar = (): string | null => {
  const user = getCurrentUser();
  return user?.avatar || null;
};

/**
 * Get seller profile
 */
export const getSellerProfileData = () => {
  return getSellerProfile();
};

/**
 * Get seller shop name
 */
export const getShopName = (): string | null => {
  const sellerProfile = getSellerProfile();
  return sellerProfile?.shop_name || null;
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
