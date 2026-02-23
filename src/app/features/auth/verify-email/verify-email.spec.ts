import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { VerifyEmail } from './verify-email';
import { AuthService } from '../../../core/services/auth.service';

const makeActivatedRoute = (token: string | null) => ({
  snapshot: { queryParamMap: { get: () => token } },
});

describe('VerifyEmail', () => {
  const mockAuthService = {
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
  };

  const setupComponent = async (token: string | null = 'valid-token') => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: makeActivatedRoute(token) },
      ],
    }).compileComponents();
  };

  beforeEach(() => {
    mockAuthService.verifyEmail.mockReset();
    mockAuthService.resendVerification.mockReset();
  });

  it('should create', async () => {
    mockAuthService.verifyEmail.mockReturnValue(of(undefined));
    await setupComponent();
    const fixture = TestBed.createComponent(VerifyEmail);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in loading state', async () => {
    mockAuthService.verifyEmail.mockReturnValue(of(undefined));
    await setupComponent();
    const fixture = TestBed.createComponent(VerifyEmail);
    // Before detectChanges, loading should still be true initially
    expect(fixture.componentInstance.loading()).toBe(true);
  });

  it('should auto-verify on init with valid token', async () => {
    mockAuthService.verifyEmail.mockReturnValue(of(undefined));
    await setupComponent('my-verify-token');
    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('my-verify-token');
  });

  it('should show success state after successful verification', async () => {
    mockAuthService.verifyEmail.mockReturnValue(of(undefined));
    await setupComponent();
    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.success()).toBe(true);
  });

  it('should show error state when token is missing', async () => {
    await setupComponent(null);
    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBeTruthy();
    expect(mockAuthService.verifyEmail).not.toHaveBeenCalled();
  });

  it('should show error state when verification fails', async () => {
    mockAuthService.verifyEmail.mockReturnValue(
      throwError(() => ({ error: { message: 'Link za verifikaciju je nevažeći ili je istekao' } })),
    );
    await setupComponent();
    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe('Link za verifikaciju je nevažeći ili je istekao');
  });

  it('should call resendVerification and show resend success', async () => {
    mockAuthService.verifyEmail.mockReturnValue(
      throwError(() => ({ error: { message: 'Istekao token' } })),
    );
    mockAuthService.resendVerification.mockReturnValue(of(undefined));
    await setupComponent();
    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    fixture.componentInstance.resend();
    fixture.detectChanges();
    expect(mockAuthService.resendVerification).toHaveBeenCalled();
    expect(fixture.componentInstance.resendSuccess()).toBe(true);
  });

  it('should show resend success even on resend error (security)', async () => {
    mockAuthService.verifyEmail.mockReturnValue(
      throwError(() => ({ error: { message: 'Istekao token' } })),
    );
    mockAuthService.resendVerification.mockReturnValue(
      throwError(() => ({ status: 500 })),
    );
    await setupComponent();
    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    fixture.componentInstance.resend();
    fixture.detectChanges();
    expect(fixture.componentInstance.resendSuccess()).toBe(true);
  });
});
