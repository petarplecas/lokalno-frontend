import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authService: { isAuthenticated: jest.Mock };
  let router: { createUrlTree: jest.Mock };

  beforeEach(() => {
    authService = { isAuthenticated: jest.fn() };
    router = { createUrlTree: jest.fn().mockReturnValue('/auth/login' as unknown as UrlTree) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
      teardown: { destroyAfterEach: true },
    });
  });

  it('should return true when authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect to /auth/login when not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);

    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });
});
