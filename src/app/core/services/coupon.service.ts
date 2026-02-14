import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CouponDetail, ApiMessage } from '../models';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/coupons`;

  getCoupon(code: string): Observable<CouponDetail> {
    return this.http.get<CouponDetail>(`${this.url}/${code}`);
  }

  useCoupon(code: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.url}/${code}/use`, {});
  }
}
