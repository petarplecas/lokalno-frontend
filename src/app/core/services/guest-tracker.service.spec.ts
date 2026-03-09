import { TestBed } from '@angular/core/testing';
import { GuestTrackerService } from './guest-tracker.service';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'guest-viewed-discounts';
const DISMISS_KEY = 'guest-badge-dismissed';

describe('GuestTrackerService', () => {
  let service: GuestTrackerService;
  const mockAuthService = { isAuthenticated: jest.fn(() => false) };

  beforeEach(() => {
    localStorage.clear();
    mockAuthService.isAuthenticated.mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });
    service = TestBed.inject(GuestTrackerService);
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });

  it('should not show badge below threshold', () => {
    service.trackView('d1');
    service.trackView('d2');
    service.trackView('d3');
    service.trackView('d4');
    expect(service.shouldShowBadge()).toBe(false);
  });

  it('should show badge after 5 unique discounts', () => {
    ['d1', 'd2', 'd3', 'd4', 'd5'].forEach((id) => service.trackView(id));
    expect(service.shouldShowBadge()).toBe(true);
  });

  it('should not count same discount twice', () => {
    service.trackView('d1');
    service.trackView('d1');
    service.trackView('d1');
    service.trackView('d1');
    service.trackView('d1');
    expect(service.shouldShowBadge()).toBe(false);
  });

  it('should not track views for authenticated users', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    ['d1', 'd2', 'd3', 'd4', 'd5'].forEach((id) => service.trackView(id));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should hide badge when dismissed', () => {
    ['d1', 'd2', 'd3', 'd4', 'd5'].forEach((id) => service.trackView(id));
    expect(service.shouldShowBadge()).toBe(true);
    service.dismiss();
    expect(service.shouldShowBadge()).toBe(false);
  });

  it('should re-show badge after dismiss expiry (7 days)', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, eightDaysAgo.toString());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['d1', 'd2', 'd3', 'd4', 'd5']));

    // Re-create service to pick up localStorage state
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });
    const freshService = TestBed.inject(GuestTrackerService);

    expect(freshService.shouldShowBadge()).toBe(true);
    expect(localStorage.getItem(DISMISS_KEY)).toBeNull();
  });
});
