import { DiscountType } from './discount.model';

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
}

export interface Coupon {
  id: string;
  code: string;
  status: CouponStatus;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  discount: {
    id: string;
    title: string;
    imageUrl: string;
    discountType: DiscountType;
    discountValue: number;
    oldPrice: number | null;
    newPrice: number | null;
    business: {
      id: string;
      name: string;
      logoUrl: string | null;
      address: string;
    };
  };
}

export interface CouponDetail {
  id: string;
  code: string;
  status: CouponStatus;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  discount: {
    id: string;
    title: string;
    imageUrl: string;
    discountType: DiscountType;
    discountValue: number;
    oldPrice: number | null;
    newPrice: number | null;
    business: {
      id: string;
      name: string;
      logoUrl: string | null;
      address: string;
    };
  };
}

export interface ClaimCouponResponse {
  message: string;
  coupon: {
    id: string;
    code: string;
    status: CouponStatus;
    expiresAt: string;
    createdAt: string;
    discount: {
      id: string;
      title: string;
      business: {
        id: string;
        name: string;
      };
    };
  };
}
