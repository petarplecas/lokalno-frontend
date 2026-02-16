import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Coupons } from './coupons';
import { UserService } from '../../core/services/user.service';
import {
  Coupon,
  CouponStatus,
  DiscountType,
  PaginatedResponse,
} from '../../core/models';

const mockCoupon: Coupon = {
  id: 'c1',
  code: 'KUP-TEST',
  status: CouponStatus.ACTIVE,
  expiresAt: '2024-12-31T23:59:59',
  usedAt: null,
  createdAt: '2024-01-01',
  discount: {
    id: 'd1',
    title: 'Test Popust',
    imageUrl: 'https://example.com/img.jpg',
    discountType: DiscountType.PERCENT,
    discountValue: 20,
    oldPrice: null,
    newPrice: null,
    business: {
      id: 'b1',
      name: 'Test Biznis',
      logoUrl: null,
      address: 'Beograd',
    },
  },
};

const mockResponse: PaginatedResponse<Coupon> = {
  data: [mockCoupon],
  meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
};

const emptyResponse: PaginatedResponse<Coupon> = {
  data: [],
  meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
};

describe('Coupons', () => {
  const mockUserService = {
    getMyCoupons: jest.fn(),
  };

  beforeEach(async () => {
    mockUserService.getMyCoupons.mockReturnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [Coupons],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserService, useValue: mockUserService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    mockUserService.getMyCoupons.mockReset();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Coupons);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load active coupons on init', () => {
    const fixture = TestBed.createComponent(Coupons);
    fixture.detectChanges();
    expect(mockUserService.getMyCoupons).toHaveBeenCalledWith(1, 50, CouponStatus.ACTIVE);
  });

  it('should render 3 tabs', () => {
    const fixture = TestBed.createComponent(Coupons);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('.coupons__tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0].textContent.trim()).toBe('Aktivni');
    expect(tabs[1].textContent.trim()).toBe('Iskorišćeni');
    expect(tabs[2].textContent.trim()).toBe('Istekli');
  });

  it('should switch tab and reload coupons', () => {
    const fixture = TestBed.createComponent(Coupons);
    fixture.detectChanges();
    mockUserService.getMyCoupons.mockClear();
    mockUserService.getMyCoupons.mockReturnValue(of(emptyResponse));

    const tabs = fixture.nativeElement.querySelectorAll('.coupons__tab');
    tabs[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe(1);
    expect(mockUserService.getMyCoupons).toHaveBeenCalledWith(1, 50, CouponStatus.USED);
  });

  it('should render coupon cards', () => {
    const fixture = TestBed.createComponent(Coupons);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-coupon-card');
    expect(cards.length).toBe(1);
  });

  it('should show empty state when no coupons', () => {
    mockUserService.getMyCoupons.mockReturnValue(of(emptyResponse));
    const fixture = TestBed.createComponent(Coupons);
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
  });
});
