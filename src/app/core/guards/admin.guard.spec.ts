import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let authService: { userRole: jest.Mock; isAuthenticated: jest.Mock };
  let router: { createUrlTree: jest.Mock };

  const loginUrl = '/auth/login' as unknown as UrlTree;
  const homeUrl = '/' as unknown as UrlTree;

  beforeEach(() => {
    authService = {
      userRole: jest.fn(),
      isAuthenticated: jest.fn(),
    };
    router = {
      createUrlTree: jest.fn().mockImplementation((segments: string[]) => {
        return segments[0] === '/auth/login' ? loginUrl : homeUrl;
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
      teardown: { destroyAfterEach: true },
    });
  });

  it('should return true for ADMIN role', () => {
    authService.userRole.mockReturnValue(Role.ADMIN);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect to /auth/login when not authenticated', () => {
    authService.userRole.mockReturnValue(null);
    authService.isAuthenticated.mockReturnValue(false);

    TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should redirect to / for BUSINESS role', () => {
    authService.userRole.mockReturnValue(Role.BUSINESS);
    authService.isAuthenticated.mockReturnValue(true);

    TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should redirect to / for USER role', () => {
    authService.userRole.mockReturnValue(Role.USER);
    authService.isAuthenticated.mockReturnValue(true);

    TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
