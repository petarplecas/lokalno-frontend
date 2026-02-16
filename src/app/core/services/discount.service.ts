import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Discount,
  DiscountFilters,
  DiscountStatus,
  CreateDiscountRequest,
  UpdateDiscountRequest,
  PaginatedResponse,
  ClaimCouponResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class DiscountService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/discounts`;

  getDiscounts(filters: Partial<DiscountFilters> = {}): Observable<PaginatedResponse<Discount>> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.discountType) params = params.set('discountType', filters.discountType);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.businessId) params = params.set('businessId', filters.businessId);
    if (filters.latitude != null) params = params.set('latitude', filters.latitude);
    if (filters.longitude != null) params = params.set('longitude', filters.longitude);
    if (filters.radiusKm != null) params = params.set('radiusKm', filters.radiusKm);
    if (filters.tags?.length) params = params.set('tags', filters.tags.join(','));

    return this.http.get<PaginatedResponse<Discount>>(this.url, { params });
  }

  getDiscount(id: string): Observable<Discount> {
    return this.http.get<Discount>(`${this.url}/${id}`);
  }

  createDiscount(data: CreateDiscountRequest): Observable<Discount> {
    return this.http.post<Discount>(this.url, data);
  }

  updateDiscount(id: string, data: UpdateDiscountRequest): Observable<Discount> {
    return this.http.patch<Discount>(`${this.url}/${id}`, data);
  }

  deleteDiscount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  updateStatus(id: string, status: DiscountStatus): Observable<Discount> {
    return this.http.patch<Discount>(`${this.url}/${id}/status`, { status });
  }

  claimCoupon(id: string): Observable<ClaimCouponResponse> {
    return this.http.post<ClaimCouponResponse>(`${this.url}/${id}/claim-coupon`, {});
  }
}
