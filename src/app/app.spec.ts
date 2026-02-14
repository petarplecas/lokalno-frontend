import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/services/auth.service';
import { of } from 'rxjs';

describe('App', () => {
  let mockIsInitialized: jest.Mock;

  const createMockAuthService = (initialized: boolean) => {
    mockIsInitialized = jest.fn().mockReturnValue(initialized);
    return {
      isInitialized: mockIsInitialized,
      initializeAuth: jest.fn().mockReturnValue(of(true)),
    };
  };

  const setup = async (initialized = true) => {
    const mockAuthService = createMockAuthService(initialized);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
    return { mockAuthService };
  };

  afterEach(() => TestBed.resetTestingModule());

  it('should create the app', async () => {
    await setup();
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call initializeAuth on init', async () => {
    const { mockAuthService } = await setup();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(mockAuthService.initializeAuth).toHaveBeenCalled();
  });

  it('should show spinner when not initialized', async () => {
    await setup(false);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('app-spinner');
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
    expect(spinner).toBeTruthy();
    expect(routerOutlet).toBeNull();
  });

  it('should show router-outlet when initialized', async () => {
    await setup(true);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.app-loading');
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
    expect(spinner).toBeNull();
    expect(routerOutlet).toBeTruthy();
  });

  it('should always show toast container', async () => {
    await setup(true);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const toastContainer = fixture.nativeElement.querySelector('app-toast-container');
    expect(toastContainer).toBeTruthy();
  });
});
