export interface SocialMediaItem {
  name: string;
  url: string;
}

export interface UserProfile {
  id?: number;
  user_id?: number;
  bio?: string;
  address?: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  social_media?: SocialMediaItem[];
}

export interface SellerProfile {
  id?: number;
  user_id?: number;
  shop_name: string;
  shop_description?: string;
  shop_banner?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  wa_number?: string;
  is_buyer: boolean;
  is_seller: boolean;
  is_admin: boolean;
  is_active: boolean;
  is_verified?: boolean;
  provider?: string;
  provider_id?: string;
  profile?: UserProfile;
  seller_profile?: SellerProfile | null;
  roles?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    roles: string[];
    seller_profile?: SellerProfile | null;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    roles: string[];
  };
}

export interface ActivateSellerRequest {
  shop_name: string;
  shop_description?: string;
  wa_number?: string;
}

export interface ActivateSellerResponse {
  success: boolean;
  message: string;
  data: User;
  roles: string[];
}

export interface SocialAuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  token: string;
  refreshToken?: string;
}

export interface SocialAuthCallback {
  success: boolean;
  token: string;
  token_type: string;
  user: User;
  roles: string[];
}