import api from "@/services/api";
import { ActivateSellerRequest, ActivateSellerResponse, User } from "@/types/auth";

/**
 * Activate seller mode for current user
 * POST /api/v1/seller/activate
 */
export const activateSeller = async (
  data: ActivateSellerRequest
): Promise<ActivateSellerResponse> => {
  try {
    const res = await api.post("/seller/activate", data);
    return res.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Deactivate seller mode for current user
 * POST /api/v1/seller/deactivate
 */
export const deactivateSeller = async (): Promise<{
  success: boolean;
  message: string;
  roles: string[];
}> => {
  try {
    const res = await api.post("/seller/deactivate", {});
    return res.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update seller profile
 * PUT /api/v1/seller/profile
 */
export const updateSellerProfile = async (data: {
  shop_name?: string;
  shop_description?: string;
  shop_banner?: File;
}): Promise<{
  success: boolean;
  message: string;
  data: any;
}> => {
  try {
    const formData = new FormData();
    
    if (data.shop_name) {
      formData.append("shop_name", data.shop_name);
    }
    if (data.shop_description) {
      formData.append("shop_description", data.shop_description);
    }
    if (data.shop_banner) {
      formData.append("shop_banner", data.shop_banner);
    }

    const res = await api.put("/seller/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return res.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user info with seller profile
 * GET /api/v1/me
 */
export const getCurrentUserInfo = async (): Promise<{
  success: boolean;
  data: User;
}> => {
  try {
    const res = await api.get("/me");
    return res.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 * PUT /api/v1/me
 */
export const updateUserProfile = async (data: {
  name?: string;
  wa_number?: string;
  avatar?: File;
  bio?: string;
  address?: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{
  success: boolean;
  message: string;
  data: User;
}> => {
  try {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const res = await api.put("/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return res.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Change user password
 * POST /api/v1/change-password
 */
export const changePassword = async (data: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const res = await api.post("/change-password", data);
    return res.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Unlink social account
 * DELETE /api/v1/auth/social/{provider}
 */
export const unlinkSocialAccount = async (provider: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const res = await api.delete(`/auth/social/${provider}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};
