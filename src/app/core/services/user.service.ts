import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  FavoriteBusinessItem,
  SavedDiscountItem,
  Coupon,
  CouponStatus,
  PaginatedResponse,
  ApiMessage,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users/me`;

  // Profile
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.url);
  }

  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.url, data);
  }

  changePassword(data: ChangePasswordRequest): Observable<ApiMessage> {
    return this.http.patch<ApiMessage>(`${this.url}/password`, data);
  }

  // Favorites
  getFavorites(page = 1, limit = 20): Observable<PaginatedResponse<FavoriteBusinessItem>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<FavoriteBusinessItem>>(`${this.url}/favorites`, { params });
  }

  isFavorite(businessId: string): Observable<boolean> {
    return this.http
      .get<{ isFavorite: boolean }>(`${this.url}/favorites/${businessId}`)
      .pipe(map((res) => res.isFavorite));
  }

  addFavorite(businessId: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.url}/favorites/${businessId}`, {});
  }

  removeFavorite(businessId: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.url}/favorites/${businessId}`);
  }

  // Saved Discounts
  getSavedDiscounts(page = 1, limit = 20): Observable<PaginatedResponse<SavedDiscountItem>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<SavedDiscountItem>>(`${this.url}/saved-discounts`, { params });
  }

  isSaved(discountId: string): Observable<boolean> {
    return this.http
      .get<{ isSaved: boolean }>(`${this.url}/saved-discounts/${discountId}`)
      .pipe(map((res) => res.isSaved));
  }

  saveDiscount(discountId: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.url}/saved-discounts/${discountId}`, {});
  }

  removeSavedDiscount(discountId: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.url}/saved-discounts/${discountId}`);
  }

  // Coupons
  getMyCoupons(page = 1, limit = 20, status?: CouponStatus): Observable<PaginatedResponse<Coupon>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedResponse<Coupon>>(`${this.url}/coupons`, { params });
  }
}
