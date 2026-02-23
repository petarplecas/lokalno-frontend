import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPassword } from './forgot-password';
import { AuthService } from '../../../core/services/auth.service';

describe('ForgotPassword', () => {
  const mockAuthService = {
    forgotPassword: jest.fn(),
  };

  beforeEach(async () => {
    mockAuthService.forgotPassword.mockReset();

    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ForgotPassword);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render email input and submit button', () => {
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[formControlName="email"]')).toBeTruthy();
    expect(el.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();
    expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
  });

  it('should show validation error when email is touched but empty', () => {
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.email.markAsTouched();
    fixture.detectChanges();
    const errors = (fixture.nativeElement as HTMLElement).querySelectorAll('.error-message');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should show success state after successful submission', () => {
    mockAuthService.forgotPassword.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.email.setValue('test@example.com');
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.componentInstance.success()).toBe(true);
  });

  it('should show success state even on server error (security)', () => {
    mockAuthService.forgotPassword.mockReturnValue(
      throwError(() => ({ status: 404 })),
    );
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.email.setValue('nepostoji@example.com');
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.componentInstance.success()).toBe(true);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('should call authService.forgotPassword with email value', () => {
    mockAuthService.forgotPassword.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.email.setValue('test@example.com');
    fixture.componentInstance.onSubmit();
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('should show loading state during submission', () => {
    mockAuthService.forgotPassword.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]');
    expect(btn?.getAttribute('disabled')).not.toBeNull();
  });
});
