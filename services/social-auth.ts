import api from "@/services/api";
import { saveAuthData, updateCurrentUser } from "@/services/authentication";

/**
 * Handle OAuth callback from backend
 * This function processes the callback from Google/Facebook OAuth flow
 * The backend returns: state, token, token_type, user
 */
export const handleOAuthCallback = async (
  params: URLSearchParams
): Promise<{ success: boolean; user: any; token: string }> => {
  try {
    const success = params.get("success") === "true";
    const token = params.get("token");
    const tokenType = params.get("token_type");
    const userJson = params.get("user");
    const state = params.get("state");

    if (!success) {
      const message = params.get("message");
      throw new Error(message || "OAuth authentication failed");
    }

    if (!token || !userJson) {
      throw new Error("Invalid OAuth callback response");
    }

    const user = JSON.parse(decodeURIComponent(userJson));

    // Save auth data
    saveAuthData(token, user);

    return {
      success: true,
      user,
      token,
    };
  } catch (error) {
    console.error("OAuth callback error:", error);
    throw error;
  }
};

/**
 * Initiate Google OAuth login
 * Calls backend to get OAuth URL and redirects
 */
export const initiateGoogleLogin = async (redirectUrl: string = "/"): Promise<void> => {
  try {
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    const currentUrl = window.location.href.split("?")[0].split("#")[0];

    // Store redirect info in sessionStorage
    sessionStorage.setItem("oauth_redirect", redirectUrl);
    sessionStorage.setItem("oauth_state", state);

    // Build callback URL
    const callbackUrl = `${currentUrl}?provider=google`;

    // Call backend to get Google OAuth URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    
    const response = await fetch(
      `${backendUrl}/api/v1/login/google?state=${state}&redirect_uri=${encodeURIComponent(callbackUrl)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to get Google OAuth URL");
    }

    if (!data.redirect_url) {
      throw new Error("No redirect URL from backend");
    }

    // Redirect to Google
    window.location.href = data.redirect_url;
  } catch (error) {
    console.error("Google login initiation error:", error);
    throw error;
  }
};

/**
 * Initiate Facebook OAuth login
 * Calls backend to get OAuth URL and redirects
 */
export const initiateFacebookLogin = async (redirectUrl: string = "/"): Promise<void> => {
  try {
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    const currentUrl = window.location.href.split("?")[0].split("#")[0];

    // Store redirect info in sessionStorage
    sessionStorage.setItem("oauth_redirect", redirectUrl);
    sessionStorage.setItem("oauth_state", state);

    // Build callback URL
    const callbackUrl = `${currentUrl}?provider=facebook`;

    // Call backend to get Facebook OAuth URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    
    const response = await fetch(
      `${backendUrl}/api/v1/login/facebook?state=${state}&redirect_uri=${encodeURIComponent(callbackUrl)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to get Facebook OAuth URL");
    }

    if (!data.redirect_url) {
      throw new Error("No redirect URL from backend");
    }

    // Redirect to Facebook
    window.location.href = data.redirect_url;
  } catch (error) {
    console.error("Facebook login initiation error:", error);
    throw error;
  }
};

/**
 * Get OAuth redirect URL from sessionStorage
 */
export const getOAuthRedirectUrl = (): string => {
  if (typeof window === "undefined") return "/";
  return sessionStorage.getItem("oauth_redirect") || "/";
};

/**
 * Get OAuth state from sessionStorage
 */
export const getOAuthState = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("oauth_state");
};

/**
 * Clear OAuth session data
 */
export const clearOAuthSession = (): void => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("oauth_redirect");
  sessionStorage.removeItem("oauth_state");
};

/**
 * Check if user is using social authentication
 */
export const isSocialAuthUser = (): boolean => {
  if (typeof window === "undefined") return false;
  const userStr = localStorage.getItem("current_user");
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return !!(user.provider && user.provider_id);
  } catch {
    return false;
  }
};

/**
 * Get user's social provider
 */
export const getUserProvider = (): string | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("current_user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.provider || null;
  } catch {
    return null;
  }
};
