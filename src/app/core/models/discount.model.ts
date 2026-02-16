export enum DiscountType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
  NEW_PRICE = 'NEW_PRICE',
  BOGO = 'BOGO',
  COUPON = 'COUPON',
}

export enum DiscountStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
  EXPIRED = 'EXPIRED',
}

export interface DiscountBusiness {
  id: string;
  name: string;
  logoUrl: string | null;
  category: string;
  subCategory: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Discount {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  discountType: DiscountType;
  discountValue: number;
  oldPrice: number | null;
  newPrice: number | null;
  validFrom: string;
  validUntil: string;
  daysOfWeek: number[];
  timeStart: string | null;
  timeEnd: string | null;
  minPurchase: number | null;
  hasCoupons: boolean;
  totalCoupons: number | null;
  availableCoupons: number | null;
  couponDuration: number | null;
  templateStyle: string | null;
  tags: string[];
  status: DiscountStatus;
  views: number;
  saves: number;
  createdAt: string;
  updatedAt: string;
  business: DiscountBusiness;
  distanceMeters?: number | null;
}

export interface SavedDiscountItem {
  savedAt: string;
  id: string;
  title: string;
  imageUrl: string;
  discountType: DiscountType;
  discountValue: number;
  oldPrice: number | null;
  newPrice: number | null;
  status: DiscountStatus;
  validFrom: string;
  validUntil: string;
  business: {
    id: string;
    name: string;
    logoUrl: string | null;
    category: string;
  };
}

export interface DiscountFilters {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'views' | 'saves' | 'validUntil';
  sortOrder?: 'asc' | 'desc';
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  search?: string;
  discountType?: DiscountType;
  status?: DiscountStatus;
  businessId?: string;
  category?: string;
  tags?: string[];
}

export interface CreateDiscountRequest {
  title: string;
  description?: string;
  imageUrl: string;
  discountType: DiscountType;
  discountValue: number;
  oldPrice?: number;
  newPrice?: number;
  validity: {
    validFrom: string;
    validUntil: string;
    daysOfWeek: number[];
    timeStart?: string;
    timeEnd?: string;
    minPurchase?: number;
  };
  couponSettings?: {
    hasCoupons: boolean;
    totalCoupons?: number;
    couponDuration?: number;
  };
  templateStyle?: string;
  tags: string[];
}

export interface UpdateDiscountRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  discountType?: DiscountType;
  discountValue?: number;
  oldPrice?: number;
  newPrice?: number;
  validity?: {
    validFrom: string;
    validUntil: string;
    daysOfWeek: number[];
    timeStart?: string;
    timeEnd?: string;
    minPurchase?: number;
  };
  couponSettings?: {
    hasCoupons: boolean;
    totalCoupons?: number;
    couponDuration?: number;
  };
  templateStyle?: string;
  tags?: string[];
}
