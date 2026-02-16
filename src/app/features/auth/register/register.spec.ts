import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Register } from './register';
import { AuthService } from '../../../core/services/auth.service';
import { Role, User } from '../../../core/models/user.model';
import { of, throwError } from 'rxjs';

describe('Register', () => {
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
    emailVerified: false,
    createdAt: '2024-01-01',
  };

  const mockAuthService = {
    register: jest.fn(),
  };

  const validFormData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  beforeEach(async () => {
    mockAuthService.register.mockReset();

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'home', component: Register }]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Register);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render registration form', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const el = fixture.nativeElement;
    expect(el.querySelector('input[formControlName="firstName"]')).toBeTruthy();
    expect(el.querySelector('input[formControlName="lastName"]')).toBeTruthy();
    expect(el.querySelector('input[formControlName="email"]')).toBeTruthy();
    expect(el.querySelector('input[formControlName="password"]')).toBeTruthy();
    expect(el.querySelector('input[formControlName="confirmPassword"]')).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.markAllAsTouched();
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.error-message');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate email format', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.controls.email.setValue('invalid');
    component.form.controls.email.markAsTouched();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector(
      'input[formControlName="email"] ~ .error-message',
    );
    expect(error).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.controls.password.setValue('short');
    component.form.controls.password.markAsTouched();
    fixture.detectChanges();
    expect(component.form.controls.password.errors?.['minlength']).toBeTruthy();
  });

  it('should validate password match', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.patchValue({
      password: 'password123',
      confirmPassword: 'different',
    });
    component.form.updateValueAndValidity();
    expect(component.form.errors?.['passwordMismatch']).toBeTruthy();
  });

  it('should call authService.register with form values', () => {
    mockAuthService.register.mockReturnValue(of(mockUser));
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue(validFormData);
    fixture.componentInstance.onSubmit();
    expect(mockAuthService.register).toHaveBeenCalledWith({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      password: 'password123',
    });
  });

  it('should navigate to /home on success', () => {
    mockAuthService.register.mockReturnValue(of(mockUser));
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue(validFormData);
    fixture.componentInstance.onSubmit();
    expect(navSpy).toHaveBeenCalledWith(['/home']);
  });

  it('should show error message on failure', () => {
    mockAuthService.register.mockReturnValue(
      throwError(() => ({ error: { message: 'Email already exists' } })),
    );
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue(validFormData);
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Email already exists');
    expect(fixture.nativeElement.querySelector('.auth-error')).toBeTruthy();
  });

  it('should show loading spinner during submission', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('app-spinner')).toBeTruthy();
  });
});
