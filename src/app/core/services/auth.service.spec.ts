import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role, User } from '../models';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.USER,
    city: null,
    latitude: null,
    longitude: null,
    avatarUrl: null,
    emailVerified: false,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const authUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: jest.fn().mockResolvedValue(true) },
        },
      ],
      teardown: { destroyAfterEach: true },
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================
  // INITIAL STATE
  // ============================================
  describe('initial state', () => {
    it('should not be authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should have null user', () => {
      expect(service.user()).toBeNull();
    });

    it('should have null token', () => {
      expect(service.token()).toBeNull();
    });

    it('should not be initialized', () => {
      expect(service.isInitialized()).toBe(false);
    });
  });

  // ============================================
  // LOGIN
  // ============================================
  describe('login', () => {
    it('should POST to /auth/login with credentials and withCredentials', () => {
      const credentials = { email: 'test@example.com', password: 'password123' };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${authUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      expect(req.request.withCredentials).toBe(true);

      req.flush({ user: mockUser, accessToken: 'access-123' });
    });

    it('should set user and accessToken signals on success', () => {
      service
        .login({ email: 'test@example.com', password: 'password123' })
        .subscribe();

      const req = httpMock.expectOne(`${authUrl}/login`);
      req.flush({ user: mockUser, accessToken: 'access-123' });

      expect(service.user()).toEqual(mockUser);
      expect(service.token()).toBe('access-123');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return the user', () => {
      let result: User | undefined;

      service
        .login({ email: 'test@example.com', password: 'password123' })
        .subscribe((user) => (result = user));

      const req = httpMock.expectOne(`${authUrl}/login`);
      req.flush({ user: mockUser, accessToken: 'access-123' });

      expect(result).toEqual(mockUser);
    });
  });

  // ============================================
  // REGISTER
  // ============================================
  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should POST to /auth/register with withCredentials', () => {
      service.register(registerData).subscribe();

      const req = httpMock.expectOne(`${authUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      expect(req.request.withCredentials).toBe(true);

      req.flush({ user: mockUser, accessToken: 'access-456' });
    });

    it('should set user and accessToken signals on success', () => {
      service.register(registerData).subscribe();

      const req = httpMock.expectOne(`${authUrl}/register`);
      req.flush({ user: mockUser, accessToken: 'access-456' });

      expect(service.user()).toEqual(mockUser);
      expect(service.token()).toBe('access-456');
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  // ============================================
  // REFRESH ACCESS TOKEN
  // ============================================
  describe('refreshAccessToken', () => {
    it('should POST to /auth/refresh with withCredentials', () => {
      service.refreshAccessToken().subscribe();

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);

      req.flush({ accessToken: 'new-access-token' });
    });

    it('should update accessToken signal on success', () => {
      service.refreshAccessToken().subscribe();

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      req.flush({ accessToken: 'new-access-token' });

      expect(service.token()).toBe('new-access-token');
    });

    it('should return true on success', () => {
      let result: boolean | undefined;

      service.refreshAccessToken().subscribe((v) => (result = v));

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      req.flush({ accessToken: 'new-access-token' });

      expect(result).toBe(true);
    });

    it('should clear state and return false on error', () => {
      // First, set some state
      service.login({ email: 'a@b.com', password: '12345678' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush({ user: mockUser, accessToken: 'old-token' });
      expect(service.isAuthenticated()).toBe(true);

      let result: boolean | undefined;
      service.refreshAccessToken().subscribe((v) => (result = v));

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(result).toBe(false);
      expect(service.user()).toBeNull();
      expect(service.token()).toBeNull();
    });
  });

  // ============================================
  // LOGOUT
  // ============================================
  describe('logout', () => {
    beforeEach(() => {
      // Login first
      service.login({ email: 'a@b.com', password: '12345678' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush({ user: mockUser, accessToken: 'token' });
    });

    it('should POST to /auth/logout with withCredentials', () => {
      service.logout();

      const req = httpMock.expectOne(`${authUrl}/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });

    it('should clear state and navigate to /auth/login on success', () => {
      service.logout();

      httpMock.expectOne(`${authUrl}/logout`).flush({});

      expect(service.user()).toBeNull();
      expect(service.token()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should clear state and navigate even on error', () => {
      service.logout();

      httpMock
        .expectOne(`${authUrl}/logout`)
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(service.user()).toBeNull();
      expect(service.token()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ============================================
  // INITIALIZE AUTH
  // ============================================
  describe('initializeAuth', () => {
    it('should attempt refresh then fetch /auth/me', () => {
      service.initializeAuth().subscribe();

      // First: refresh call
      const refreshReq = httpMock.expectOne(`${authUrl}/refresh`);
      refreshReq.flush({ accessToken: 'restored-token' });

      // Second: /auth/me call
      const meReq = httpMock.expectOne(`${authUrl}/me`);
      meReq.flush({ user: mockUser });

      expect(service.user()).toEqual(mockUser);
      expect(service.token()).toBe('restored-token');
      expect(service.isInitialized()).toBe(true);
    });

    it('should set initialized=true even when refresh fails', () => {
      let result: boolean | undefined;
      service.initializeAuth().subscribe((v) => (result = v));

      const refreshReq = httpMock.expectOne(`${authUrl}/refresh`);
      refreshReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(result).toBe(false);
      expect(service.isInitialized()).toBe(true);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should set initialized=true even when /me fails', () => {
      let result: boolean | undefined;
      service.initializeAuth().subscribe((v) => (result = v));

      httpMock.expectOne(`${authUrl}/refresh`).flush({ accessToken: 'token' });
      httpMock
        .expectOne(`${authUrl}/me`)
        .flush(null, { status: 500, statusText: 'Error' });

      expect(result).toBe(false);
      expect(service.isInitialized()).toBe(true);
    });
  });

  // ============================================
  // COMPUTED SIGNALS
  // ============================================
  describe('computed signals', () => {
    it('isBusinessUser should be true for BUSINESS role', () => {
      const businessUser = { ...mockUser, role: Role.BUSINESS };
      service.login({ email: 'a@b.com', password: '12345678' }).subscribe();
      httpMock
        .expectOne(`${authUrl}/login`)
        .flush({ user: businessUser, accessToken: 'token' });

      expect(service.isBusinessUser()).toBe(true);
      expect(service.isAdmin()).toBe(false);
    });

    it('isAdmin should be true for ADMIN role', () => {
      const adminUser = { ...mockUser, role: Role.ADMIN };
      service.login({ email: 'a@b.com', password: '12345678' }).subscribe();
      httpMock
        .expectOne(`${authUrl}/login`)
        .flush({ user: adminUser, accessToken: 'token' });

      expect(service.isAdmin()).toBe(true);
      expect(service.isBusinessUser()).toBe(false);
    });

    it('userRole should return the current role', () => {
      expect(service.userRole()).toBeNull();

      service.login({ email: 'a@b.com', password: '12345678' }).subscribe();
      httpMock
        .expectOne(`${authUrl}/login`)
        .flush({ user: mockUser, accessToken: 'token' });

      expect(service.userRole()).toBe(Role.USER);
    });
  });
});
