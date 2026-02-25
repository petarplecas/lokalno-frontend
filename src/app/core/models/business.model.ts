export enum BusinessStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum SubscriptionTier {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export const BUSINESS_CATEGORIES = [
  'RESTORANI',
  'KAFICI',
  'BAROVI',
  'FAST_FOOD',
  'PEKARE',
  'POSLASTICARNICE',
  'SUPERMARKETI',
  'PRODAVNICE',
  'KOZMETIKA',
  'FRIZERSKI_SALONI',
  'FITNESS',
  'ZABAVA',
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export interface BusinessListItem {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  logoUrl: string | null;
  address: string;
  latitude: number;
  longitude: number;
  followersCount: number;
  status: BusinessStatus;
  activeDiscountsCount: number;
}

export interface BusinessDetail extends BusinessListItem {
  description: string | null;
  phone: string;
  website: string | null;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
}

export interface MyBusiness {
  id: string;
  userId: string;
  name: string;
  category: string;
  subCategory: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string | null;
  logoUrl: string | null;
  status: BusinessStatus;
  subscriptionTier: SubscriptionTier;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  followersCount: number;
  totalDiscountsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessStats {
  businessId: string;
  businessName: string;
  status: BusinessStatus;
  discounts: {
    count: number;
    limit: number | null;
    remaining: number | null;
  };
  followers: {
    count: number;
  };
  subscription: {
    tier: SubscriptionTier;
    isTrialActive: boolean;
    isSubscriptionActive: boolean;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    daysRemaining: number;
  };
}

export interface CreateBusinessRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name: string;
  category: string;
  subCategory: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  website?: string;
  logoUrl?: string;
}

export interface UpdateBusinessRequest {
  name?: string;
  category?: string;
  subCategory?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  logoUrl?: string;
}

export interface FavoriteBusinessItem {
  followedAt: string;
  id: string;
  name: string;
  category: string;
  subCategory: string;
  logoUrl: string | null;
  address: string;
  followersCount: number;
  activeDiscountsCount: number;
}
