export interface User {
  id: number;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'both';
  phone?: string;
  avatar?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}