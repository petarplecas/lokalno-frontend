import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Login } from './login';
import { AuthService } from '../../../core/services/auth.service';
import { Role, User } from '../../../core/models/user.model';
import { of, throwError } from 'rxjs';

describe('Login', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
    city: null,
    latitude: null,
    longitude: null,
    avatarUrl: null,
    emailVerified: true,
    createdAt: '2024-01-01',
  };

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    mockAuthService.login.mockReset();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'home', component: Login },
          { path: 'business/dashboard', component: Login },
          { path: 'admin/businesses', component: Login },
        ]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render login form', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const el = fixture.nativeElement;
    expect(el.querySelector('input[formControlName="email"]')).toBeTruthy();
    expect(el.querySelector('input[formControlName="password"]')).toBeTruthy();
    expect(el.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should show validation errors on touched invalid fields', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.controls.email.markAsTouched();
    component.form.controls.password.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.error-message');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should call authService.login with form values', () => {
    mockAuthService.login.mockReturnValue(of(mockUser));
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'test@test.com', password: 'password123' });
    component.onSubmit();
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
  });

  it('should navigate to /home for USER role', () => {
    mockAuthService.login.mockReturnValue(of(mockUser));
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      email: 'test@test.com',
      password: 'password123',
    });
    fixture.componentInstance.onSubmit();
    expect(navSpy).toHaveBeenCalledWith(['/home']);
  });

  it('should navigate to /business/dashboard for BUSINESS role', () => {
    const businessUser = { ...mockUser, role: Role.BUSINESS };
    mockAuthService.login.mockReturnValue(of(businessUser));
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      email: 'test@test.com',
      password: 'password123',
    });
    fixture.componentInstance.onSubmit();
    expect(navSpy).toHaveBeenCalledWith(['/business/dashboard']);
  });

  it('should navigate to /admin/businesses for ADMIN role', () => {
    const adminUser = { ...mockUser, role: Role.ADMIN };
    mockAuthService.login.mockReturnValue(of(adminUser));
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      email: 'test@test.com',
      password: 'password123',
    });
    fixture.componentInstance.onSubmit();
    expect(navSpy).toHaveBeenCalledWith(['/admin/businesses']);
  });

  it('should show error message on login failure', () => {
    mockAuthService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      email: 'test@test.com',
      password: 'wrong',
    });
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Invalid credentials');
    expect(fixture.nativeElement.querySelector('.auth-error')).toBeTruthy();
  });

  it('should show loading state during submission', () => {
    mockAuthService.login.mockReturnValue(of(mockUser));
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      email: 'test@test.com',
      password: 'password123',
    });
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('app-spinner')).toBeTruthy();
  });
});
