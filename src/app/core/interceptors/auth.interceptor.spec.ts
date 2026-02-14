import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    token: jest.Mock;
    refreshAccessToken: jest.Mock;
    logout: jest.Mock;
  };

  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    authServiceMock = {
      token: jest.fn().mockReturnValue(null),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
      ],
      teardown: { destroyAfterEach: true },
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================
  // BEARER TOKEN ATTACHMENT
  // ============================================
  describe('Bearer token attachment', () => {
    it('should attach Bearer header for API requests when token exists', () => {
      authServiceMock.token.mockReturnValue('my-access-token');

      http.get(`${apiUrl}/users`).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/users`);
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer my-access-token',
      );
      req.flush({});
    });

    it('should NOT attach header when no token', () => {
      authServiceMock.token.mockReturnValue(null);

      http.get(`${apiUrl}/users`).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/users`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT attach header for /auth/login', () => {
      authServiceMock.token.mockReturnValue('my-token');

      http.post(`${apiUrl}/auth/login`, {}).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT attach header for /auth/register', () => {
      authServiceMock.token.mockReturnValue('my-token');

      http.post(`${apiUrl}/auth/register`, {}).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/register`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT attach header for /auth/refresh', () => {
      authServiceMock.token.mockReturnValue('my-token');

      http.post(`${apiUrl}/auth/refresh`, {}).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT attach header for /auth/logout', () => {
      authServiceMock.token.mockReturnValue('my-token');

      http.post(`${apiUrl}/auth/logout`, {}).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/logout`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT attach header for external URLs', () => {
      authServiceMock.token.mockReturnValue('my-token');

      http.get('https://external-api.com/data').subscribe();

      const req = httpMock.expectOne('https://external-api.com/data');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  // ============================================
  // 401 REFRESH + RETRY
  // ============================================
  describe('401 refresh and retry', () => {
    it('should refresh and retry on 401 for API requests', () => {
      authServiceMock.token
        .mockReturnValueOnce('old-token')  // initial request
        .mockReturnValue('new-token');     // after refresh

      authServiceMock.refreshAccessToken.mockReturnValue(of(true));

      http.get(`${apiUrl}/users`).subscribe();

      // First request fails with 401
      const firstReq = httpMock.expectOne(`${apiUrl}/users`);
      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Retry request with new token
      const retryReq = httpMock.expectOne(`${apiUrl}/users`);
      expect(retryReq.request.headers.get('Authorization')).toBe(
        'Bearer new-token',
      );
      retryReq.flush({ data: 'success' });
    });

    it('should call logout when refresh fails on 401', () => {
      authServiceMock.token.mockReturnValue('old-token');
      authServiceMock.refreshAccessToken.mockReturnValue(of(false));

      http.get(`${apiUrl}/users`).subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(authServiceMock.logout).toHaveBeenCalled();
    });

    it('should NOT attempt refresh for auth endpoints on 401', () => {
      http
        .post(`${apiUrl}/auth/login`, {})
        .subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should pass through non-401 errors without refresh', () => {
      authServiceMock.token.mockReturnValue('my-token');

      let caughtError: any;
      http.get(`${apiUrl}/users`).subscribe({ error: (err) => (caughtError = err) });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush(null, { status: 500, statusText: 'Server Error' });

      expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
      expect(caughtError).toBeDefined();
      expect(caughtError.status).toBe(500);
    });
  });
});
