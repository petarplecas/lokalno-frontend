import { inject, Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  Role,
  AuthResponse,
  RefreshResponse,
  LoginRequest,
  RegisterRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly authUrl = `${environment.apiUrl}/auth`;

  // State — access token lives ONLY in memory (signal)
  private readonly currentUser = signal<User | null>(null);
  private readonly accessToken = signal<string | null>(null);
  private readonly initialized = signal(false);

  // Public computed state
  readonly user = this.currentUser.asReadonly();
  readonly token = this.accessToken.asReadonly();
  readonly isInitialized = this.initialized.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isBusinessUser = computed(
    () => this.currentUser()?.role === Role.BUSINESS,
  );
  readonly isAdmin = computed(() => this.currentUser()?.role === Role.ADMIN);
  readonly userRole = computed(() => this.currentUser()?.role ?? null);

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.currentUser.set(res.user);
          this.accessToken.set(res.accessToken);
        }),
        map((res) => res.user),
      );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/register`, data, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.currentUser.set(res.user);
          this.accessToken.set(res.accessToken);
        }),
        map((res) => res.user),
      );
  }

  /**
   * Refresh access token using HttpOnly cookie.
   * Called by the auth interceptor on 401, and on app init (silent refresh).
   */
  refreshAccessToken(): Observable<boolean> {
    return this.http
      .post<RefreshResponse>(`${this.authUrl}/refresh`, {}, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => this.accessToken.set(res.accessToken)),
        map(() => true),
        catchError(() => {
          this.clearState();
          return of(false);
        }),
      );
  }

  logout(): void {
    this.http
      .post(`${this.authUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        complete: () => {
          this.clearState();
          void this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.clearState();
          void this.router.navigate(['/auth/login']);
        },
      });
  }

  /**
   * Silent refresh on app startup — recovers session from HttpOnly cookie.
   */
  initializeAuth(): Observable<boolean> {
    return this.refreshAccessToken().pipe(
      switchMap((refreshed) => {
        if (!refreshed) {
          this.initialized.set(true);
          return of(false);
        }
        // After getting access token, fetch user profile
        return this.http
          .get<{ user: User }>(`${this.authUrl}/me`)
          .pipe(
            tap((res) => this.currentUser.set(res.user)),
            map(() => true),
            catchError(() => of(false)),
          );
      }),
      tap(() => this.initialized.set(true)),
      catchError(() => {
        this.initialized.set(true);
        return of(false);
      }),
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http
      .post<void>(`${this.authUrl}/forgot-password`, { email })
      .pipe(map(() => undefined));
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http
      .post<void>(`${this.authUrl}/reset-password`, { token, password })
      .pipe(map(() => undefined));
  }

  verifyEmail(token: string): Observable<void> {
    return this.http
      .post<void>(`${this.authUrl}/verify-email`, { token })
      .pipe(map(() => undefined));
  }

  resendVerification(): Observable<void> {
    return this.http
      .post<void>(`${this.authUrl}/resend-verification`, {}, { withCredentials: true })
      .pipe(map(() => undefined));
  }

  private clearState(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
  }
}
