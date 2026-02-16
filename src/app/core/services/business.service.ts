import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BusinessListItem,
  BusinessDetail,
  MyBusiness,
  BusinessStats,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  PaginatedResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  registerBusiness(data: CreateBusinessRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/businesses/register`,
      data,
    );
  }

  getMyBusiness(): Observable<MyBusiness> {
    return this.http.get<MyBusiness>(`${this.apiUrl}/businesses/me`);
  }

  updateMyBusiness(data: UpdateBusinessRequest): Observable<MyBusiness> {
    return this.http.patch<MyBusiness>(`${this.apiUrl}/businesses/me`, data);
  }

  getMyStats(): Observable<BusinessStats> {
    return this.http.get<BusinessStats>(`${this.apiUrl}/businesses/me/stats`);
  }

  getBusinesses(page = 1, limit = 20, category?: string): Observable<PaginatedResponse<BusinessListItem>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (category) params = params.set('category', category);
    return this.http.get<PaginatedResponse<BusinessListItem>>(
      `${this.apiUrl}/businesses`,
      { params },
    );
  }

  getBusiness(id: string): Observable<BusinessDetail> {
    return this.http.get<BusinessDetail>(`${this.apiUrl}/businesses/${id}`);
  }
}
