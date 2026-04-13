
/**
 * Generate random state for OAuth CSRF protection
 */
export const generateOAuthState = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

/**
 * Get current auth token from localStorage or cookie
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
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
 * Save auth data after login and store refresh token if provided
 */
export const saveAuthData = (
  token: string,
  user: any,
  refreshToken?: string,
) => {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("token", token);
  document.cookie = `token=${token}; path=/; samesite=lax; max-age=86400`;
  document.cookie = `auth_token=${token}; path=/; samesite=lax; max-age=86400`;
  localStorage.setItem("current_user", JSON.stringify(user));

  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
    document.cookie = `refresh_token=${refreshToken}; path=/; samesite=lax; max-age=2592000`;
  }
};

/**
 * Refresh auth token using refresh token
 */
export const refreshAuthToken = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const apiBase =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://127.0.0.1:8000";

    const response = await fetch(
      `${apiBase}/api/v1/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      if (data.data?.token) {
        localStorage.setItem("auth_token", data.data.token);
        localStorage.setItem("token", data.data.token);
        document.cookie = `token=${data.data.token}; path=/; samesite=lax; max-age=86400`;
        document.cookie = `auth_token=${data.data.token}; path=/; samesite=lax; max-age=86400`;
        return true;
      }
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
  }

  return false;
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
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("dashboard_data");
  localStorage.removeItem("seller_dashboard_data");

  // Clear cookies
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "auth_token=; path=/; max-age=0";
  document.cookie = "refresh_token=; path=/; max-age=0";

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
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("dashboard_data");
  localStorage.removeItem("seller_dashboard_data");

  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "auth_token=; path=/; max-age=0";
  document.cookie = "refresh_token=; path=/; max-age=0";
};