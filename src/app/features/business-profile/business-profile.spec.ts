import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BusinessProfile } from './business-profile';
import { BusinessService } from '../../core/services/business.service';
import { DiscountService } from '../../core/services/discount.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  BusinessDetail,
  BusinessStatus,
  SubscriptionTier,
} from '../../core/models/business.model';
import { Router } from '@angular/router';
import {
  Discount,
  DiscountType,
  DiscountStatus,
  PaginatedResponse,
} from '../../core/models';

// Mock IntersectionObserver for jsdom (needed for InfiniteScrollDirective)
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
(globalThis as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  unobserve: jest.fn(),
}));

const mockBusiness: BusinessDetail = {
  id: 'b1',
  name: 'Restoran Tradicija',
  category: 'RESTORANI',
  subCategory: 'Srpska hrana',
  logoUrl: null,
  address: 'Kneza Miloša 1, Beograd',
  latitude: 44.82,
  longitude: 20.46,
  followersCount: 42,
  status: BusinessStatus.APPROVED,
  activeDiscountsCount: 2,
  description: 'Odlična srpska kuhinja',
  phone: '+381631234567',
  website: 'https://tradicija.rs',
  subscriptionTier: SubscriptionTier.BASIC,
  createdAt: '2024-01-01',
};

const mockDiscount: Discount = {
  id: 'd1',
  title: 'Test Popust',
  description: null,
  imageUrl: 'https://example.com/img.jpg',
  discountType: DiscountType.PERCENT,
  discountValue: 20,
  oldPrice: null,
  newPrice: null,
  validFrom: '2024-01-01',
  validUntil: '2024-12-31',
  daysOfWeek: [1, 2, 3, 4, 5],
  timeStart: null,
  timeEnd: null,
  minPurchase: null,
  hasCoupons: false,
  totalCoupons: null,
  availableCoupons: null,
  couponDuration: null,
  templateStyle: null,
  tags: [],
  status: DiscountStatus.ACTIVE,
  views: 10,
  saves: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  business: {
    id: 'b1',
    name: 'Restoran Tradicija',
    logoUrl: null,
    category: 'RESTORANI',
    subCategory: 'Srpska hrana',
    address: 'Kneza Miloša 1, Beograd',
    latitude: 44.82,
    longitude: 20.46,
  },
};

const mockDiscountsResponse: PaginatedResponse<Discount> = {
  data: [mockDiscount],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

const mockEmptyDiscountsResponse: PaginatedResponse<Discount> = {
  data: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
};

describe('BusinessProfile', () => {
  const mockBusinessService = {
    getBusiness: jest.fn(),
  };
  const mockDiscountService = {
    getDiscounts: jest.fn(),
  };
  const mockUserService = {
    isFavorite: jest.fn().mockReturnValue(of(false)),
    addFavorite: jest.fn().mockReturnValue(of({ message: 'ok' })),
    removeFavorite: jest.fn().mockReturnValue(of({ message: 'ok' })),
  };
  const mockAuthService = {
    isAuthenticated: jest.fn().mockReturnValue(true),
  };
  const mockToastService = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    mockBusinessService.getBusiness.mockReturnValue(of(mockBusiness));
    mockDiscountService.getDiscounts.mockReturnValue(of(mockDiscountsResponse));
    mockUserService.isFavorite.mockReturnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [BusinessProfile],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'b1' } } },
        },
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: DiscountService, useValue: mockDiscountService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load business and discounts on init', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();

    expect(mockBusinessService.getBusiness).toHaveBeenCalledWith('b1');
    expect(mockDiscountService.getDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'b1', status: DiscountStatus.ACTIVE }),
    );
    expect(fixture.componentInstance.business()).toEqual(mockBusiness);
    expect(fixture.componentInstance.discounts().length).toBe(1);
  });

  it('should display business name', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('.biz-profile__name');
    expect(name.textContent).toContain('Restoran Tradicija');
  });

  it('should display business description', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();
    const desc = fixture.nativeElement.querySelector('.biz-profile__description');
    expect(desc.textContent).toContain('Odlična srpska kuhinja');
  });

  it('should display phone contact link', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();
    const phoneLink = fixture.nativeElement.querySelector('a[href^="tel:"]');
    expect(phoneLink).toBeTruthy();
    expect(phoneLink.textContent).toContain('+381631234567');
  });

  it('should display website contact link', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();
    const webLink = fixture.nativeElement.querySelector('a[href="https://tradicija.rs"]');
    expect(webLink).toBeTruthy();
  });

  it('should render discount cards', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-discount-card');
    expect(cards.length).toBe(1);
  });

  it('should show empty state when no active discounts', () => {
    mockDiscountService.getDiscounts.mockReturnValue(of(mockEmptyDiscountsResponse));
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should hide spinner after data loads', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    const spinner = fixture.nativeElement.querySelector('.biz-profile__loading');
    expect(spinner).toBeNull();
    const content = fixture.nativeElement.querySelector('.biz-profile');
    expect(content).toBeTruthy();
  });

  it('should toggle follow state', () => {
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();

    fixture.componentInstance.toggleFavorite();
    expect(mockUserService.addFavorite).toHaveBeenCalledWith('b1');
    expect(fixture.componentInstance.isFavorite()).toBe(true);
  });

  it('should unfollow when already following', () => {
    mockUserService.isFavorite.mockReturnValue(of(true));
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();

    fixture.componentInstance.toggleFavorite();
    expect(mockUserService.removeFavorite).toHaveBeenCalledWith('b1');
    expect(fixture.componentInstance.isFavorite()).toBe(false);
  });

  it('should redirect to login when unauthenticated user tries to follow', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);
    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.toggleFavorite();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should load more discounts on infinite scroll', () => {
    const multiPageResponse: PaginatedResponse<Discount> = {
      data: [mockDiscount],
      meta: { total: 20, page: 1, limit: 10, totalPages: 2 },
    };
    mockDiscountService.getDiscounts.mockReturnValue(of(multiPageResponse));

    const fixture = TestBed.createComponent(BusinessProfile);
    fixture.detectChanges();

    expect(fixture.componentInstance.hasMore()).toBe(true);

    mockDiscountService.getDiscounts.mockReturnValue(of({
      data: [{ ...mockDiscount, id: 'd2' }],
      meta: { total: 20, page: 2, limit: 10, totalPages: 2 },
    }));

    fixture.componentInstance.onLoadMore();
    fixture.detectChanges();

    expect(fixture.componentInstance.discounts().length).toBe(2);
    expect(fixture.componentInstance.hasMore()).toBe(false);
  });
});
