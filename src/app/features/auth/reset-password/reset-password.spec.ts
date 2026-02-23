import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetPassword } from './reset-password';
import { AuthService } from '../../../core/services/auth.service';

const makeActivatedRoute = (token: string | null) => ({
  snapshot: { queryParamMap: { get: () => token } },
});

describe('ResetPassword', () => {
  const mockAuthService = {
    resetPassword: jest.fn(),
  };

  const setupComponent = async (token: string | null = 'valid-token') => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth/login', component: ResetPassword }]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: makeActivatedRoute(token) },
      ],
    }).compileComponents();
  };

  beforeEach(() => {
    mockAuthService.resetPassword.mockReset();
  });

  it('should create', async () => {
    await setupComponent();
    const fixture = TestBed.createComponent(ResetPassword);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show invalid token state when no token in URL', async () => {
    await setupComponent(null);
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    expect(fixture.componentInstance.invalidToken()).toBe(true);
  });

  it('should render password form when token present', async () => {
    await setupComponent('valid-token');
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[formControlName="password"]')).toBeTruthy();
    expect(el.querySelector('input[formControlName="confirmPassword"]')).toBeTruthy();
  });

  it('should not submit when form is invalid', async () => {
    await setupComponent();
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();
    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
  });

  it('should call authService.resetPassword with token and password', async () => {
    mockAuthService.resetPassword.mockReturnValue(of(undefined));
    await setupComponent('my-reset-token');
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ password: 'NovaLozinka123', confirmPassword: 'NovaLozinka123' });
    fixture.componentInstance.onSubmit();
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith('my-reset-token', 'NovaLozinka123');
  });

  it('should show success state after successful reset', async () => {
    mockAuthService.resetPassword.mockReturnValue(of(undefined));
    await setupComponent();
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ password: 'NovaLozinka123', confirmPassword: 'NovaLozinka123' });
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.componentInstance.success()).toBe(true);
  });

  it('should show error message on failed reset', async () => {
    mockAuthService.resetPassword.mockReturnValue(
      throwError(() => ({ error: { message: 'Link za resetovanje je nevažeći ili je istekao' } })),
    );
    await setupComponent();
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ password: 'NovaLozinka123', confirmPassword: 'NovaLozinka123' });
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Link za resetovanje je nevažeći ili je istekao');
  });

  it('should show validation error for password mismatch', async () => {
    await setupComponent();
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    const { form } = fixture.componentInstance;
    form.controls.password.setValue('NovaLozinka123');
    form.controls.confirmPassword.setValue('DrugaLozinka456');
    form.controls.confirmPassword.markAsTouched();
    fixture.detectChanges();
    expect(form.errors?.['passwordMismatch']).toBeTruthy();
  });

  it('should navigate to login after 3s on success', async () => {
    jest.useFakeTimers();
    mockAuthService.resetPassword.mockReturnValue(of(undefined));
    await setupComponent();
    const fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate');
    fixture.componentInstance.form.setValue({ password: 'NovaLozinka123', confirmPassword: 'NovaLozinka123' });
    fixture.componentInstance.onSubmit();
    jest.advanceTimersByTime(3000);
    expect(navSpy).toHaveBeenCalledWith(['/auth/login']);
    jest.useRealTimers();
  });
});
