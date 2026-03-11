import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dashboard } from './dashboard';
import { BusinessService } from '../../../core/services/business.service';
import { DiscountService } from '../../../core/services/discount.service';
import {
  MyBusiness,
  BusinessStats,
  BusinessStatus,
  SubscriptionTier,
  Discount,
  DiscountType,
  DiscountStatus,
} from '../../../core/models';

function makeBusiness(overrides: Partial<MyBusiness> = {}): MyBusiness {
  return {
    id: 'biz-1',
    userId: 'user-1',
    name: 'Test Biznis',
    category: 'RESTORANI',
    subCategory: 'Picerija',
    description: null,
    address: 'Beograd',
    latitude: 44.8,
    longitude: 20.4,
    phone: '0601234567',
    website: null,
    logoUrl: null,
    status: BusinessStatus.APPROVED,
    subscriptionTier: SubscriptionTier.BASIC,
    trialEndsAt: null,
    subscriptionEndsAt: null,
    followersCount: 0,
    totalDiscountsCount: 0,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    ...overrides,
  };
}

function makeStats(overrides: Partial<BusinessStats> = {}): BusinessStats {
  return {
    businessId: 'biz-1',
    businessName: 'Test Biznis',
    status: BusinessStatus.APPROVED,
    discounts: { count: 2, limit: 5, remaining: 3 },
    followers: { count: 10 },
    subscription: {
      tier: SubscriptionTier.BASIC,
      isTrialActive: false,
      isSubscriptionActive: true,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      daysRemaining: 30,
    },
    ...overrides,
  };
}

function makeDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: 'disc-1',
    title: 'Test Popust',
    description: 'Opis',
    imageUrl: 'https://example.com/img.jpg',
    discountType: DiscountType.PERCENT,
    discountValue: 20,
    oldPrice: null,
    newPrice: null,
    validFrom: '2025-01-01T00:00:00.000Z',
    validUntil: '2025-12-31T00:00:00.000Z',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    timeStart: null,
    timeEnd: null,
    minPurchase: null,
    hasCoupons: false,
    totalCoupons: null,
    availableCoupons: null,
    couponDuration: 24,
    templateStyle: null,
    tags: [],
    status: DiscountStatus.ACTIVE,
    views: 0,
    saves: 0,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    business: {
      id: 'biz-1',
      name: 'Test Biznis',
      logoUrl: null,
      category: 'RESTORANI',
      subCategory: 'Picerija',
      address: 'Beograd',
      latitude: 44.8,
      longitude: 20.4,
    },
    ...overrides,
  };
}

describe('Dashboard', () => {
  const mockBusinessService = {
    getMyBusiness: jest.fn(),
    getMyStats: jest.fn(),
  };
  const mockDiscountService = {
    getDiscounts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockBusinessService.getMyBusiness.mockReturnValue(of(makeBusiness()));
    mockBusinessService.getMyStats.mockReturnValue(of(makeStats()));
    mockDiscountService.getDiscounts.mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: DiscountService, useValue: mockDiscountService },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  function createComponent() {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / loading', () => {
    it('should call getMyBusiness on init', () => {
      createComponent();
      expect(mockBusinessService.getMyBusiness).toHaveBeenCalled();
    });

    it('should call getMyStats after business loads', () => {
      createComponent();
      expect(mockBusinessService.getMyStats).toHaveBeenCalled();
    });

    it('should call getDiscounts with businessId after business loads', () => {
      createComponent();
      expect(mockDiscountService.getDiscounts).toHaveBeenCalledWith(
        expect.objectContaining({ businessId: 'biz-1' }),
      );
    });

    it('should set loading=false after stats load', () => {
      const { component } = createComponent();
      expect(component.loading()).toBe(false);
    });

    it('should set loadingDiscounts=false after discounts load', () => {
      const { component } = createComponent();
      expect(component.loadingDiscounts()).toBe(false);
    });

    it('should set business signal from loaded data', () => {
      const { component } = createComponent();
      expect(component.business()?.id).toBe('biz-1');
    });

    it('should set stats signal from loaded data', () => {
      const { component } = createComponent();
      expect(component.stats()?.discounts.count).toBe(2);
    });

    it('should set loading=false on business error', () => {
      mockBusinessService.getMyBusiness.mockReturnValue(throwError(() => new Error('Not found')));
      const { component } = createComponent();
      expect(component.loading()).toBe(false);
    });

    it('should set loading=false on stats error', () => {
      mockBusinessService.getMyStats.mockReturnValue(throwError(() => new Error('Stats error')));
      const { component } = createComponent();
      expect(component.loading()).toBe(false);
    });
  });

  describe('expiringDiscounts', () => {
    it('should return empty array when no discounts', () => {
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }));
      const { component } = createComponent();
      expect(component.expiringDiscounts()).toEqual([]);
    });

    it('should include ACTIVE discounts expiring in ≤3 days', () => {
      const soon = new Date(Date.now() + 2 * 86400000).toISOString(); // 2 days from now
      const discount = makeDiscount({ status: DiscountStatus.ACTIVE, validUntil: soon });
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [discount], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }));

      const { component } = createComponent();
      expect(component.expiringDiscounts()).toHaveLength(1);
      expect(component.expiringDiscounts()[0].id).toBe('disc-1');
    });

    it('should NOT include ACTIVE discounts expiring in >3 days', () => {
      const later = new Date(Date.now() + 5 * 86400000).toISOString(); // 5 days from now
      const discount = makeDiscount({ status: DiscountStatus.ACTIVE, validUntil: later });
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [discount], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }));

      const { component } = createComponent();
      expect(component.expiringDiscounts()).toHaveLength(0);
    });

    it('should NOT include non-ACTIVE discounts even if date is close', () => {
      const soon = new Date(Date.now() + 1 * 86400000).toISOString();
      const discount = makeDiscount({ status: DiscountStatus.EXPIRED, validUntil: soon });
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [discount], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }));

      const { component } = createComponent();
      expect(component.expiringDiscounts()).toHaveLength(0);
    });

    it('should NOT include already expired discounts (days < 0)', () => {
      const past = new Date(Date.now() - 1 * 86400000).toISOString(); // yesterday
      const discount = makeDiscount({ status: DiscountStatus.ACTIVE, validUntil: past });
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [discount], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }));

      const { component } = createComponent();
      expect(component.expiringDiscounts()).toHaveLength(0);
    });

    it('should include discount expiring today (0 days remaining)', () => {
      const today = new Date(Date.now() + 1000).toISOString(); // 1 second from now
      const discount = makeDiscount({ status: DiscountStatus.ACTIVE, validUntil: today });
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [discount], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }));

      const { component } = createComponent();
      expect(component.expiringDiscounts()).toHaveLength(1);
    });
  });

  describe('onDiscountDeleted', () => {
    it('should remove discount from list by id', () => {
      const d1 = makeDiscount({ id: 'disc-1' });
      const d2 = makeDiscount({ id: 'disc-2' });
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [d1, d2], meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }));

      const { component } = createComponent();
      expect(component.discounts()).toHaveLength(2);

      component.onDiscountDeleted('disc-1');

      expect(component.discounts()).toHaveLength(1);
      expect(component.discounts()[0].id).toBe('disc-2');
    });

    it('should not change list if id not found', () => {
      const d1 = makeDiscount({ id: 'disc-1' });
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [d1], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }));

      const { component } = createComponent();
      component.onDiscountDeleted('non-existent');

      expect(component.discounts()).toHaveLength(1);
    });

    it('should set discounts to loaded data', () => {
      const d1 = makeDiscount({ id: 'disc-1' });
      const d2 = makeDiscount({ id: 'disc-2' });
      mockDiscountService.getDiscounts.mockReturnValue(of({ data: [d1, d2], meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }));

      const { component } = createComponent();
      expect(component.discounts()).toHaveLength(2);
    });
  });
});
