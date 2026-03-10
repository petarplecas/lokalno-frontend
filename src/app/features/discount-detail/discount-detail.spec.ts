import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
// Router is used via TestBed.inject(Router) in setup()
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DiscountDetail } from './discount-detail';
import { DiscountService } from '../../core/services/discount.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  Discount,
  DiscountType,
  DiscountStatus,
  CouponStatus,
} from '../../core/models';

// ── Factory helpers ──────────────────────────────────────────
function makeDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: 'd1',
    title: 'Test Popust',
    description: 'Opis popusta',
    imageUrl: 'https://example.com/img.jpg',
    discountType: DiscountType.PERCENT,
    discountValue: 20,
    oldPrice: null,
    newPrice: null,
    validFrom: '2025-01-01',
    validUntil: '2099-12-31', // far future — no urgency by default
    daysOfWeek: [1, 2, 3, 4, 5],
    timeStart: null,
    timeEnd: null,
    minPurchase: null,
    hasCoupons: true,
    totalCoupons: 100,
    availableCoupons: 50,
    couponDuration: 24,
    templateStyle: null,
    tags: [],
    status: DiscountStatus.ACTIVE,
    views: 100,
    saves: 5,
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00',
    business: {
      id: 'b1',
      name: 'Test Biznis',
      logoUrl: null,
      category: 'Restoran',
      subCategory: 'Picerija',
      address: 'Beograd, Knez Mihailova 1',
      latitude: 44.8,
      longitude: 20.4,
    },
    ...overrides,
  };
}

function makeCouponResponse() {
  return {
    message: 'Success',
    coupon: {
      id: 'c1',
      code: 'KUP-ABCD',
      status: CouponStatus.ACTIVE,
      expiresAt: '2099-12-31T23:59:59',
      createdAt: '2025-01-01',
      discount: { id: 'd1', title: 'Test', business: { id: 'b1', name: 'Test Biznis' } },
    },
  };
}

// ── Shared mocks ──────────────────────────────────────────────
const mockDiscountService = {
  getDiscount: jest.fn(),
  claimCoupon: jest.fn(),
};
const mockUserService = {
  isSaved: jest.fn().mockReturnValue(of(false)),
  isFavorite: jest.fn().mockReturnValue(of(false)),
  saveDiscount: jest.fn().mockReturnValue(of({ message: 'ok' })),
  removeSavedDiscount: jest.fn().mockReturnValue(of({ message: 'ok' })),
  addFavorite: jest.fn().mockReturnValue(of({ message: 'ok' })),
  removeFavorite: jest.fn().mockReturnValue(of({ message: 'ok' })),
};
const mockAuthService = { isAuthenticated: signal(true) };
const mockToastService = { success: jest.fn(), error: jest.fn() };
let routerNavigateSpy: jest.SpyInstance;

// ── Setup helper ──────────────────────────────────────────────
async function setup(discount = makeDiscount()) {
  mockDiscountService.getDiscount.mockReturnValue(of(discount));
  mockDiscountService.claimCoupon.mockReset();
  mockToastService.success.mockReset();
  mockToastService.error.mockReset();

  await TestBed.configureTestingModule({
    imports: [DiscountDetail],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' } } } },
      { provide: DiscountService, useValue: mockDiscountService },
      { provide: UserService, useValue: mockUserService },
      { provide: AuthService, useValue: mockAuthService },
      { provide: ToastService, useValue: mockToastService },
    ],
  }).compileComponents();

  const router = TestBed.inject(Router);
  routerNavigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

  const fixture = TestBed.createComponent(DiscountDetail);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// ─────────────────────────────────────────────────────────────

describe('DiscountDetail', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ── Init & loading ────────────────────────────────────────
  describe('ngOnInit', () => {
    it('should create component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should call getDiscount with route id', async () => {
      await setup();
      expect(mockDiscountService.getDiscount).toHaveBeenCalledWith('d1');
    });

    it('should set discount signal after load', async () => {
      const d = makeDiscount({ title: 'Moj Popust' });
      const { component } = await setup(d);
      expect(component.discount()?.title).toBe('Moj Popust');
    });

    it('should set loading to false after load', async () => {
      const { component } = await setup();
      expect(component.loading()).toBe(false);
    });

    it('should show error toast and set loading false on fetch error', async () => {
      mockToastService.error.mockReset();

      await TestBed.configureTestingModule({
        imports: [DiscountDetail],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' } } } },
          { provide: DiscountService, useValue: { ...mockDiscountService, getDiscount: jest.fn().mockReturnValue(throwError(() => new Error('fail'))) } },
          { provide: UserService, useValue: mockUserService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: ToastService, useValue: mockToastService },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(DiscountDetail);
      fixture.detectChanges();

      expect(mockToastService.error).toHaveBeenCalledWith('Popust nije pronađen');
      expect(fixture.componentInstance.loading()).toBe(false);
    });
  });

  // ── Hero section ─────────────────────────────────────────
  describe('hero section', () => {
    it('should display hero title', async () => {
      const { fixture } = await setup();
      const el = fixture.nativeElement.querySelector('.detail__hero-title');
      expect(el.textContent).toContain('Test Popust');
    });

    it('should display hero discount value', async () => {
      const { fixture } = await setup();
      const el = fixture.nativeElement.querySelector('.detail__hero-value');
      expect(el).toBeTruthy();
      expect(el.textContent.trim()).toBeTruthy();
    });

    it('should display type badge', async () => {
      const { fixture } = await setup();
      const badge = fixture.nativeElement.querySelector('.detail__type-badge');
      expect(badge).toBeTruthy();
    });

    it('should apply correct type badge class for PERCENT', async () => {
      const { fixture } = await setup(makeDiscount({ discountType: DiscountType.PERCENT }));
      const badge = fixture.nativeElement.querySelector('.detail__type-badge');
      expect(badge.classList).toContain('detail__type-badge--percent');
    });

    it('should apply correct type badge class for FIXED', async () => {
      const { fixture } = await setup(makeDiscount({ discountType: DiscountType.FIXED }));
      const badge = fixture.nativeElement.querySelector('.detail__type-badge');
      expect(badge.classList).toContain('detail__type-badge--fixed');
    });

    it('should apply correct type badge class for NEW_PRICE', async () => {
      const { fixture } = await setup(makeDiscount({ discountType: DiscountType.NEW_PRICE }));
      const badge = fixture.nativeElement.querySelector('.detail__type-badge');
      expect(badge.classList).toContain('detail__type-badge--new-price');
    });

    it('should apply correct type badge class for BOGO', async () => {
      const { fixture } = await setup(makeDiscount({ discountType: DiscountType.BOGO }));
      const badge = fixture.nativeElement.querySelector('.detail__type-badge');
      expect(badge.classList).toContain('detail__type-badge--bogo');
    });
  });

  // ── Urgency computed signals ──────────────────────────────
  describe('urgencyLevel', () => {
    it('should return null when discount expires far in the future', async () => {
      const d = makeDiscount({ validUntil: '2099-12-31', availableCoupons: 50, createdAt: '2020-01-01T00:00:00' });
      const { component } = await setup(d);
      expect(component.urgencyLevel()).toBeNull();
    });

    it('should return "hot" when expires within 1 day', async () => {
      const tomorrow = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const { component } = await setup(makeDiscount({ validUntil: tomorrow }));
      expect(component.urgencyLevel()).toBe('hot');
    });

    it('should return "hot" when availableCoupons <= 3', async () => {
      const { component } = await setup(makeDiscount({ availableCoupons: 2 }));
      expect(component.urgencyLevel()).toBe('hot');
    });

    it('should return "warm" when expires within 3 days', async () => {
      const twoDaysOut = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const { component } = await setup(makeDiscount({ validUntil: twoDaysOut, availableCoupons: 50 }));
      expect(component.urgencyLevel()).toBe('warm');
    });

    it('should return "new" when created within 48 hours', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { component } = await setup(makeDiscount({
        validUntil: '2099-12-31',
        availableCoupons: 50,
        createdAt: oneHourAgo,
      }));
      expect(component.urgencyLevel()).toBe('new');
    });
  });

  describe('urgencyLabel', () => {
    it('should return "Ostalo N kupona" for hot with low coupons', async () => {
      const { component } = await setup(makeDiscount({ availableCoupons: 2 }));
      expect(component.urgencyLabel()).toBe('Ostalo 2 kupona');
    });

    it('should return "Ističe danas" for hot due to expiry', async () => {
      const soon = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const { component } = await setup(makeDiscount({ validUntil: soon, availableCoupons: 50 }));
      expect(component.urgencyLabel()).toBe('Ističe danas');
    });

    it('should return "Ističe za N dana" for warm', async () => {
      const twoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const { component } = await setup(makeDiscount({ validUntil: twoDays, availableCoupons: 50 }));
      expect(component.urgencyLabel()).toMatch(/Ističe za \d+ dana/);
    });

    it('should return "Novo" for new discount', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { component } = await setup(makeDiscount({
        validUntil: '2099-12-31',
        availableCoupons: 50,
        createdAt: oneHourAgo,
      }));
      expect(component.urgencyLabel()).toBe('Novo');
    });

    it('should show urgency badge in DOM when urgency level is set', async () => {
      const { fixture } = await setup(makeDiscount({ availableCoupons: 1 }));
      const badge = fixture.nativeElement.querySelector('.detail__urgency-badge');
      expect(badge).toBeTruthy();
    });

    it('should not show urgency badge when no urgency', async () => {
      const d = makeDiscount({ validUntil: '2099-12-31', availableCoupons: 50, createdAt: '2020-01-01T00:00:00' });
      const { fixture } = await setup(d);
      const badge = fixture.nativeElement.querySelector('.detail__urgency-badge');
      expect(badge).toBeNull();
    });
  });

  // ── Coupon computed signals ───────────────────────────────
  describe('couponFillPercent', () => {
    it('should calculate fill percent correctly', async () => {
      const { component } = await setup(makeDiscount({ totalCoupons: 100, availableCoupons: 60 }));
      expect(component.couponFillPercent()).toBe(60);
    });

    it('should return null when hasCoupons is false', async () => {
      const { component } = await setup(makeDiscount({ hasCoupons: false, totalCoupons: null, availableCoupons: null }));
      expect(component.couponFillPercent()).toBeNull();
    });

    it('should return null when totalCoupons is null', async () => {
      const { component } = await setup(makeDiscount({ hasCoupons: true, totalCoupons: null }));
      expect(component.couponFillPercent()).toBeNull();
    });
  });

  describe('isCouponCritical', () => {
    it('should be true when fill <= 20%', async () => {
      const { component } = await setup(makeDiscount({ totalCoupons: 100, availableCoupons: 10 }));
      expect(component.isCouponCritical()).toBe(true);
    });

    it('should be false when fill > 20%', async () => {
      const { component } = await setup(makeDiscount({ totalCoupons: 100, availableCoupons: 50 }));
      expect(component.isCouponCritical()).toBe(false);
    });
  });

  // ── Schedule computed signals ─────────────────────────────
  describe('daysLabel', () => {
    it('should return "Pon – Pet" for weekdays [1-5]', async () => {
      const { component } = await setup(makeDiscount({ daysOfWeek: [1, 2, 3, 4, 5] }));
      expect(component.daysLabel()).toBe('Pon – Pet');
    });

    it('should return "Vikend" for [6, 7]', async () => {
      const { component } = await setup(makeDiscount({ daysOfWeek: [6, 7] }));
      expect(component.daysLabel()).toBe('Vikend');
    });

    it('should return "Svakog dana" for 7 days', async () => {
      const { component } = await setup(makeDiscount({ daysOfWeek: [1, 2, 3, 4, 5, 6, 7] }));
      expect(component.daysLabel()).toBe('Svakog dana');
    });

    it('should return "Svakog dana" for empty array', async () => {
      const { component } = await setup(makeDiscount({ daysOfWeek: [] }));
      expect(component.daysLabel()).toBe('Svakog dana');
    });

    it('should return abbreviated day names for partial selection', async () => {
      const { component } = await setup(makeDiscount({ daysOfWeek: [1, 3, 5] }));
      expect(component.daysLabel()).toBe('Pon, Sre, Pet');
    });
  });

  describe('timeLabel', () => {
    it('should return "Ceo dan" when timeStart/timeEnd are null', async () => {
      const { component } = await setup(makeDiscount({ timeStart: null, timeEnd: null }));
      expect(component.timeLabel()).toBe('Ceo dan');
    });

    it('should return formatted time range', async () => {
      const { component } = await setup(makeDiscount({ timeStart: '10:00', timeEnd: '22:00' }));
      expect(component.timeLabel()).toBe('10:00 – 22:00');
    });
  });

  // ── Conditions computed signal ────────────────────────────
  describe('conditions', () => {
    it('should include minPurchase when set', async () => {
      const { component } = await setup(makeDiscount({ minPurchase: 500 }));
      expect(component.conditions().some(c => c.includes('500'))).toBe(true);
    });

    it('should not include minPurchase when null', async () => {
      const { component } = await setup(makeDiscount({ minPurchase: null }));
      expect(component.conditions().some(c => c.includes('Minimalna'))).toBe(false);
    });

    it('should include time when timeStart/timeEnd are set', async () => {
      const { component } = await setup(makeDiscount({ timeStart: '12:00', timeEnd: '15:00' }));
      expect(component.conditions().some(c => c.includes('12:00'))).toBe(true);
    });

    it('should include coupon duration in hours', async () => {
      const { component } = await setup(makeDiscount({ couponDuration: 48 }));
      expect(component.conditions().some(c => c.includes('48 sati'))).toBe(true);
    });

    it('should format 1 hour coupon duration correctly', async () => {
      const { component } = await setup(makeDiscount({ couponDuration: 1 }));
      expect(component.conditions().some(c => c.includes('1 sat'))).toBe(true);
    });

    it('should format 168 hour coupon duration as "7 dana"', async () => {
      const { component } = await setup(makeDiscount({ couponDuration: 168 }));
      expect(component.conditions().some(c => c.includes('7 dana'))).toBe(true);
    });
  });

  // ── Business strip ────────────────────────────────────────
  describe('business strip', () => {
    it('should display business name', async () => {
      const { fixture } = await setup();
      const name = fixture.nativeElement.querySelector('.detail__business-info strong');
      expect(name.textContent).toContain('Test Biznis');
    });

    it('should display business category', async () => {
      const { fixture } = await setup();
      const cat = fixture.nativeElement.querySelector('.detail__business-category');
      expect(cat.textContent).toContain('Restoran');
    });

    it('should render business name as link to business profile', async () => {
      const { fixture } = await setup();
      const link = fixture.nativeElement.querySelector('.detail__business-link');
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toContain('/businesses/b1');
    });

    it('should display business logo initial', async () => {
      const { fixture } = await setup();
      const logo = fixture.nativeElement.querySelector('.detail__business-logo');
      expect(logo.textContent.trim()).toBe('T');
    });
  });

  // ── Quick stats ───────────────────────────────────────────
  describe('quick stats', () => {
    it('should render stats section', async () => {
      const { fixture } = await setup();
      const stats = fixture.nativeElement.querySelector('.detail__stats');
      expect(stats).toBeTruthy();
    });

    it('should show coupon stat when hasCoupons is true', async () => {
      const { fixture } = await setup(makeDiscount({ hasCoupons: true, totalCoupons: 100, availableCoupons: 50 }));
      const couponFill = fixture.nativeElement.querySelector('.detail__coupon-fill');
      expect(couponFill).toBeTruthy();
    });

    it('should not show coupon stat when hasCoupons is false', async () => {
      const { fixture } = await setup(makeDiscount({ hasCoupons: false }));
      const couponFill = fixture.nativeElement.querySelector('.detail__coupon-fill');
      expect(couponFill).toBeNull();
    });

    it('should apply critical class on coupon fill when <= 20%', async () => {
      const { fixture } = await setup(makeDiscount({ totalCoupons: 100, availableCoupons: 10 }));
      const fill = fixture.nativeElement.querySelector('.detail__coupon-fill');
      expect(fill.classList).toContain('detail__coupon-fill--critical');
    });
  });

  // ── Price comparison ──────────────────────────────────────
  describe('price comparison', () => {
    it('should show price section when oldPrice and newPrice are set', async () => {
      const { fixture } = await setup(makeDiscount({ oldPrice: 3000, newPrice: 2100 }));
      const section = fixture.nativeElement.querySelector('.detail__price-section');
      expect(section).toBeTruthy();
    });

    it('should not show price section when prices are null', async () => {
      const { fixture } = await setup(makeDiscount({ oldPrice: null, newPrice: null }));
      const section = fixture.nativeElement.querySelector('.detail__price-section');
      expect(section).toBeNull();
    });

    it('should show savings pill for PERCENT type', async () => {
      const { fixture } = await setup(makeDiscount({
        discountType: DiscountType.PERCENT,
        discountValue: 30,
        oldPrice: 3000,
        newPrice: 2100,
      }));
      const savings = fixture.nativeElement.querySelector('.detail__price-savings');
      expect(savings).toBeTruthy();
      expect(savings.textContent).toContain('30%');
    });
  });

  // ── Social proof ──────────────────────────────────────────
  describe('social proof', () => {
    it('should display saves count', async () => {
      const { fixture } = await setup(makeDiscount({ saves: 42 }));
      const social = fixture.nativeElement.querySelector('.detail__social');
      expect(social.textContent).toContain('42');
    });

    it('should display views count', async () => {
      const { fixture } = await setup(makeDiscount({ views: 1200 }));
      const social = fixture.nativeElement.querySelector('.detail__social');
      expect(social.textContent).toContain('1');
    });
  });

  // ── Tags ──────────────────────────────────────────────────
  describe('tags', () => {
    it('should display tags when present', async () => {
      const { fixture } = await setup(makeDiscount({ tags: ['pizza', 'promo'] }));
      const tags = fixture.nativeElement.querySelectorAll('.detail__tag');
      expect(tags.length).toBe(2);
      expect(tags[0].textContent).toContain('pizza');
    });

    it('should not render tags section when tags are empty', async () => {
      const { fixture } = await setup(makeDiscount({ tags: [] }));
      const tagsContainer = fixture.nativeElement.querySelector('.detail__tags');
      expect(tagsContainer).toBeNull();
    });
  });

  // ── Description ───────────────────────────────────────────
  describe('description', () => {
    it('should display description when set', async () => {
      const { fixture } = await setup(makeDiscount({ description: 'Opis popusta za test' }));
      const desc = fixture.nativeElement.querySelector('.detail__description');
      expect(desc.textContent).toContain('Opis popusta za test');
    });

    it('should not render description when null', async () => {
      const { fixture } = await setup(makeDiscount({ description: null }));
      const desc = fixture.nativeElement.querySelector('.detail__description');
      expect(desc).toBeNull();
    });
  });

  // ── Sticky CTA ────────────────────────────────────────────
  describe('sticky CTA', () => {
    it('should show CTA when discount has coupons and none claimed', async () => {
      const { fixture } = await setup();
      const btn = fixture.nativeElement.querySelector('.detail__cta-btn');
      expect(btn).toBeTruthy();
      expect(btn.textContent.trim()).toContain('Preuzmi kupon');
    });

    it('should disable CTA button when availableCoupons is 0', async () => {
      const { fixture } = await setup(makeDiscount({ availableCoupons: 0 }));
      const btn = fixture.nativeElement.querySelector('.detail__cta-btn');
      expect(btn.disabled).toBe(true);
      expect(btn.textContent.trim()).toContain('Nema dostupnih kupona');
    });

    it('should not show CTA when hasCoupons is false', async () => {
      const { fixture } = await setup(makeDiscount({ hasCoupons: false }));
      const btn = fixture.nativeElement.querySelector('.detail__cta-btn');
      expect(btn).toBeNull();
    });

    it('should show coupon progress bar in CTA', async () => {
      const { fixture } = await setup(makeDiscount({ totalCoupons: 100, availableCoupons: 50 }));
      const fill = fixture.nativeElement.querySelector('.detail__cta-fill');
      expect(fill).toBeTruthy();
    });

    it('should apply critical class on CTA fill when <= 20%', async () => {
      const { fixture } = await setup(makeDiscount({ totalCoupons: 100, availableCoupons: 10 }));
      const fill = fixture.nativeElement.querySelector('.detail__cta-fill');
      expect(fill.classList).toContain('detail__cta-fill--critical');
    });
  });

  // ── Claim dialog ──────────────────────────────────────────
  describe('openClaimDialog', () => {
    it('should show confirm dialog', async () => {
      const { fixture, component } = await setup();
      component.openClaimDialog();
      fixture.detectChanges();
      expect(component.showClaimDialog()).toBe(true);
      const dialog = fixture.nativeElement.querySelector('app-confirm-dialog');
      expect(dialog).toBeTruthy();
    });

    it('should redirect unauthenticated user to login', async () => {
      mockAuthService.isAuthenticated.set(false);
      const { component } = await setup();
      component.openClaimDialog();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/auth/login']);
      mockAuthService.isAuthenticated.set(true);
    });
  });

  describe('onClaimConfirm', () => {
    it('should claim coupon and set claimedCoupon signal', async () => {
      const res = makeCouponResponse();
      const { fixture, component } = await setup();
      mockDiscountService.claimCoupon.mockReturnValue(of(res));

      component.onClaimConfirm(true);
      fixture.detectChanges();

      expect(mockDiscountService.claimCoupon).toHaveBeenCalledWith('d1');
      expect(component.claimedCoupon()).toEqual(res.coupon);
    });

    it('should show success toast after claiming', async () => {
      const { component } = await setup();
      mockDiscountService.claimCoupon.mockReturnValue(of(makeCouponResponse()));
      component.onClaimConfirm(true);
      expect(mockToastService.success).toHaveBeenCalledWith('Kupon je preuzet!');
    });

    it('should decrement availableCoupons signal', async () => {
      const { component } = await setup(makeDiscount({ availableCoupons: 50 }));
      mockDiscountService.claimCoupon.mockReturnValue(of(makeCouponResponse()));
      component.onClaimConfirm(true);
      expect(component.discount()?.availableCoupons).toBe(49);
    });

    it('should not claim when confirmed is false', async () => {
      const { component } = await setup();
      component.onClaimConfirm(false);
      expect(mockDiscountService.claimCoupon).not.toHaveBeenCalled();
    });

    it('should show error toast on claim failure', async () => {
      const { component } = await setup();
      mockDiscountService.claimCoupon.mockReturnValue(
        throwError(() => ({ error: { message: 'Već si preuzeo' } })),
      );
      component.onClaimConfirm(true);
      expect(mockToastService.error).toHaveBeenCalledWith('Već si preuzeo');
    });

    it('should hide CTA and show claimed coupon after claim', async () => {
      const { fixture, component } = await setup();
      mockDiscountService.claimCoupon.mockReturnValue(of(makeCouponResponse()));
      component.onClaimConfirm(true);
      fixture.detectChanges();

      const couponCode = fixture.nativeElement.querySelector('.detail__coupon-code');
      const ctaBtn = fixture.nativeElement.querySelector('.detail__cta-btn');
      expect(couponCode).toBeTruthy();
      expect(couponCode.textContent).toContain('KUP-ABCD');
      expect(ctaBtn).toBeNull();
    });
  });

  describe('dismissCoupon', () => {
    it('should clear claimedCoupon signal', async () => {
      const { fixture, component } = await setup();
      mockDiscountService.claimCoupon.mockReturnValue(of(makeCouponResponse()));
      component.onClaimConfirm(true);
      fixture.detectChanges();

      component.dismissCoupon();
      fixture.detectChanges();

      expect(component.claimedCoupon()).toBeNull();
      expect(fixture.nativeElement.querySelector('.detail__coupon-code')).toBeNull();
    });
  });

  // ── Favorite ──────────────────────────────────────────────
  describe('toggleFavorite', () => {
    it('should add favorite when not favorited', async () => {
      mockUserService.isFavorite.mockReturnValue(of(false));
      const { component } = await setup();
      component.toggleFavorite();
      expect(mockUserService.addFavorite).toHaveBeenCalledWith('b1');
      expect(component.isFavorite()).toBe(true);
    });

    it('should remove favorite when already favorited', async () => {
      mockUserService.isFavorite.mockReturnValue(of(true));
      const { component } = await setup();
      component.toggleFavorite();
      expect(mockUserService.removeFavorite).toHaveBeenCalledWith('b1');
      expect(component.isFavorite()).toBe(false);
    });

    it('should redirect unauthenticated user to login', async () => {
      mockAuthService.isAuthenticated.set(false);
      const { component } = await setup();
      component.toggleFavorite();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/auth/login']);
      mockAuthService.isAuthenticated.set(true);
    });

    it('should apply active class to fav button when favorited', async () => {
      mockUserService.isFavorite.mockReturnValue(of(true));
      const { fixture } = await setup();
      const btn = fixture.nativeElement.querySelector('.detail__fav-btn');
      expect(btn.classList).toContain('detail__fav-btn--active');
    });
  });

  // ── Save ──────────────────────────────────────────────────
  describe('toggleSave', () => {
    it('should save discount when not saved', async () => {
      mockUserService.isSaved.mockReturnValue(of(false));
      const { component } = await setup();
      component.toggleSave();
      expect(mockUserService.saveDiscount).toHaveBeenCalledWith('d1');
      expect(component.isSaved()).toBe(true);
    });

    it('should remove saved discount when already saved', async () => {
      mockUserService.isSaved.mockReturnValue(of(true));
      const { component } = await setup();
      component.toggleSave();
      expect(mockUserService.removeSavedDiscount).toHaveBeenCalledWith('d1');
      expect(component.isSaved()).toBe(false);
    });

    it('should redirect unauthenticated user to login', async () => {
      mockAuthService.isAuthenticated.set(false);
      const { component } = await setup();
      component.toggleSave();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/auth/login']);
      mockAuthService.isAuthenticated.set(true);
    });

    it('should apply saved class to save button in hero', async () => {
      mockUserService.isSaved.mockReturnValue(of(true));
      const { fixture } = await setup();
      const btn = fixture.nativeElement.querySelector('.detail__save-btn');
      expect(btn.classList).toContain('detail__save-btn--saved');
    });
  });
});
