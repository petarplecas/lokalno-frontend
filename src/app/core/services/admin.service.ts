import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BusinessListItem,
  BusinessDetail,
  BusinessStatus,
  PaginatedResponse,
  ApiMessage,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/businesses`;

  getPendingBusinesses(page = 1, limit = 20): Observable<PaginatedResponse<BusinessListItem>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<BusinessListItem>>(
      `${this.url}/pending`,
      { params },
    );
  }

  getAllBusinesses(page = 1, limit = 20, status?: BusinessStatus): Observable<PaginatedResponse<BusinessListItem>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedResponse<BusinessListItem>>(this.url, { params });
  }

  getBusiness(id: string): Observable<BusinessDetail> {
    return this.http.get<BusinessDetail>(`${this.url}/${id}`);
  }

  updateBusinessStatus(id: string, status: BusinessStatus): Observable<ApiMessage> {
    return this.http.patch<ApiMessage>(`${this.url}/${id}/status`, { status });
  }
}
