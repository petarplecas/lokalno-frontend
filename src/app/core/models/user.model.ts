export enum Role {
  USER = 'USER',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface UserProfile extends User {
  stats: {
    favoritesCount: number;
    savedDiscountsCount: number;
    couponsCount: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
