import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DiscountCard } from './discount-card';
import { Discount, DiscountType, DiscountStatus } from '../../../core/models';

// ── Helpers ────────────────────────────────────────────────────────────────

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function isoHoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function baseDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: '1',
    title: 'Test Popust',
    description: null,
    imageUrl: 'https://example.com/img.jpg',
    discountType: DiscountType.PERCENT,
    discountValue: 20,
    oldPrice: null,
    newPrice: null,
    validFrom: isoDate(-1),
    validUntil: isoDate(30),
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
    views: 100,
    saves: 42,
    createdAt: isoDate(-10),
    updatedAt: isoDate(-10),
    business: {
      id: 'b1',
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

function createCard(discount: Discount, isSaved = false, featured = false) {
  TestBed.configureTestingModule({
    imports: [DiscountCard],
    teardown: { destroyAfterEach: true },
  });

  const fixture = TestBed.createComponent(DiscountCard);
  fixture.componentRef.setInput('discount', discount);
  fixture.componentRef.setInput('isSaved', isSaved);
  fixture.componentRef.setInput('featured', featured);
  fixture.detectChanges();
  return fixture;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('DiscountCard', () => {

  // ── Basic rendering ──────────────────────────────────────────────────────

  describe('basic rendering', () => {
    it('should create', () => {
      const fixture = createCard(baseDiscount());
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should display title', () => {
      const fixture = createCard(baseDiscount({ title: 'Pizza 30%' }));
      const title = fixture.nativeElement.querySelector('.discount-card__title');
      expect(title.textContent.trim()).toBe('Pizza 30%');
    });

    it('should display business name', () => {
      const fixture = createCard(baseDiscount());
      const biz = fixture.nativeElement.querySelector('.discount-card__business');
      expect(biz.textContent.trim()).toBe('Test Biznis');
    });

    it('should render image with correct src', () => {
      const fixture = createCard(baseDiscount());
      const img = fixture.nativeElement.querySelector('img');
      expect(img.getAttribute('src')).toBe('https://example.com/img.jpg');
    });

    it('should display saves count', () => {
      const fixture = createCard(baseDiscount({ saves: 99 }));
      const saves = fixture.nativeElement.querySelector('.discount-card__saves');
      expect(saves.textContent).toContain('99');
    });

    it('should show distance when distanceMeters is set', () => {
      const fixture = createCard(baseDiscount({ distanceMeters: 500 }));
      const distance = fixture.nativeElement.querySelector('.discount-card__distance');
      expect(distance).toBeTruthy();
    });

    it('should hide distance when distanceMeters is null', () => {
      const fixture = createCard(baseDiscount({ distanceMeters: null }));
      const distance = fixture.nativeElement.querySelector('.discount-card__distance');
      expect(distance).toBeNull();
    });
  });

  // ── Discount hero value ──────────────────────────────────────────────────

  describe('discount hero value', () => {
    it('should show -20% for PERCENT type', () => {
      const fixture = createCard(baseDiscount({ discountType: DiscountType.PERCENT, discountValue: 20 }));
      const hero = fixture.nativeElement.querySelector('.discount-card__discount-hero');
      expect(hero.textContent.trim()).toBe('-20%');
    });

    it('should show -500 RSD for FIXED type', () => {
      const fixture = createCard(baseDiscount({ discountType: DiscountType.FIXED, discountValue: 500 }));
      const hero = fixture.nativeElement.querySelector('.discount-card__discount-hero');
      expect(hero.textContent.trim()).toBe('-500 RSD');
    });

    it('should show 1+1 for BOGO type', () => {
      const fixture = createCard(baseDiscount({ discountType: DiscountType.BOGO, discountValue: 0 }));
      const hero = fixture.nativeElement.querySelector('.discount-card__discount-hero');
      expect(hero.textContent.trim()).toBe('1+1');
    });

    it('should show new price for NEW_PRICE type', () => {
      const fixture = createCard(baseDiscount({ discountType: DiscountType.NEW_PRICE, discountValue: 0, newPrice: 2500 }));
      const hero = fixture.nativeElement.querySelector('.discount-card__discount-hero');
      expect(hero.textContent.trim()).toBe('2500 RSD');
    });
  });

  // ── Type badge colors ────────────────────────────────────────────────────

  describe('type badge', () => {
    it('should have --percent class for PERCENT', () => {
      const fixture = createCard(baseDiscount({ discountType: DiscountType.PERCENT }));
      const badge = fixture.nativeElement.querySelector('.discount-card__type-badge');
      expect(badge.classList).toContain('discount-card__type-badge--percent');
    });

    it('should have --fixed class for FIXED', () => {
      const fixture = createCard(baseDiscount({ discountType: DiscountType.FIXED }));
      const badge = fixture.nativeElement.querySelector('.discount-card__type-badge');
      expect(badge.classList).toContain('discount-card__type-badge--fixed');
    });

    it('should have --new-price class for NEW_PRICE', () => {
      const fixture = createCard(baseDiscount({ discountType: DiscountType.NEW_PRICE }));
      const badge = fixture.nativeElement.querySelector('.discount-card__type-badge');
      expect(badge.classList).toContain('discount-card__type-badge--new-price');
    });

    it('should have --bogo class for BOGO', () => {
      const fixture = createCard(baseDiscount({ discountType: DiscountType.BOGO }));
      const badge = fixture.nativeElement.querySelector('.discount-card__type-badge');
      expect(badge.classList).toContain('discount-card__type-badge--bogo');
    });
  });

  // ── Price comparison row ─────────────────────────────────────────────────

  describe('price comparison row', () => {
    it('should show price row when both oldPrice and newPrice exist', () => {
      const fixture = createCard(baseDiscount({ oldPrice: 3000, newPrice: 2100 }));
      const row = fixture.nativeElement.querySelector('.discount-card__price-row');
      expect(row).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.discount-card__new-price').textContent).toContain('2,100');
      expect(fixture.nativeElement.querySelector('.discount-card__old-price').textContent).toContain('3,000');
    });

    it('should hide price row when oldPrice is null', () => {
      const fixture = createCard(baseDiscount({ oldPrice: null, newPrice: 2100 }));
      const row = fixture.nativeElement.querySelector('.discount-card__price-row');
      expect(row).toBeNull();
    });

    it('should hide price row when newPrice is null', () => {
      const fixture = createCard(baseDiscount({ oldPrice: 3000, newPrice: null }));
      const row = fixture.nativeElement.querySelector('.discount-card__price-row');
      expect(row).toBeNull();
    });
  });

  // ── Save button ──────────────────────────────────────────────────────────

  describe('save button', () => {
    it('should render save button', () => {
      const fixture = createCard(baseDiscount());
      const btn = fixture.nativeElement.querySelector('.discount-card__save-btn');
      expect(btn).toBeTruthy();
    });

    it('should not have --saved class when isSaved is false', () => {
      const fixture = createCard(baseDiscount(), false);
      const btn = fixture.nativeElement.querySelector('.discount-card__save-btn');
      expect(btn.classList).not.toContain('discount-card__save-btn--saved');
    });

    it('should have --saved class when isSaved is true', () => {
      const fixture = createCard(baseDiscount(), true);
      const btn = fixture.nativeElement.querySelector('.discount-card__save-btn');
      expect(btn.classList).toContain('discount-card__save-btn--saved');
    });

    it('should emit saveToggled with save=true when not saved', () => {
      const fixture = createCard(baseDiscount(), false);
      const emitted: { discount: Discount; save: boolean }[] = [];
      fixture.componentInstance.saveToggled.subscribe((e) => emitted.push(e));

      const btn = fixture.nativeElement.querySelector('.discount-card__save-btn');
      btn.click();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].save).toBe(true);
    });

    it('should emit saveToggled with save=false when already saved', () => {
      const fixture = createCard(baseDiscount(), true);
      const emitted: { discount: Discount; save: boolean }[] = [];
      fixture.componentInstance.saveToggled.subscribe((e) => emitted.push(e));

      const btn = fixture.nativeElement.querySelector('.discount-card__save-btn');
      btn.click();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].save).toBe(false);
    });

    it('should not trigger card click when save button is clicked', () => {
      const fixture = createCard(baseDiscount());
      const cardClicks: Discount[] = [];
      fixture.componentInstance.clicked.subscribe((d) => cardClicks.push(d));

      const btn = fixture.nativeElement.querySelector('.discount-card__save-btn');
      btn.click();

      expect(cardClicks).toHaveLength(0);
    });
  });

  // ── Card click ───────────────────────────────────────────────────────────

  describe('card click', () => {
    it('should emit clicked when article is clicked', () => {
      const discount = baseDiscount();
      const fixture = createCard(discount);
      const emitted: Discount[] = [];
      fixture.componentInstance.clicked.subscribe((d) => emitted.push(d));

      const article = fixture.nativeElement.querySelector('.discount-card');
      article.click();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].id).toBe('1');
    });
  });

  // ── Urgency signals ──────────────────────────────────────────────────────

  describe('urgencyLevel computed', () => {
    it('should return hot when expires today', () => {
      const fixture = createCard(baseDiscount({ validUntil: isoDate(0) }));
      expect(fixture.componentInstance.urgencyLevel()).toBe('hot');
    });

    it('should return hot when availableCoupons <= 3', () => {
      const fixture = createCard(baseDiscount({
        hasCoupons: true,
        totalCoupons: 100,
        availableCoupons: 2,
        validUntil: isoDate(30),
      }));
      expect(fixture.componentInstance.urgencyLevel()).toBe('hot');
    });

    it('should return warm when expires in 1-3 days', () => {
      const fixture = createCard(baseDiscount({ validUntil: isoDate(2) }));
      expect(fixture.componentInstance.urgencyLevel()).toBe('warm');
    });

    it('should return new when created within 48h', () => {
      const fixture = createCard(baseDiscount({
        createdAt: isoHoursAgo(24),
        validUntil: isoDate(30),
      }));
      expect(fixture.componentInstance.urgencyLevel()).toBe('new');
    });

    it('should return null when no urgency conditions met', () => {
      const fixture = createCard(baseDiscount({
        validUntil: isoDate(30),
        createdAt: isoDate(-5),
      }));
      expect(fixture.componentInstance.urgencyLevel()).toBeNull();
    });
  });

  describe('urgency badge in template', () => {
    it('should render hot badge and contain urgency text', () => {
      const fixture = createCard(baseDiscount({ validUntil: isoDate(0) }));
      const badge = fixture.nativeElement.querySelector('.discount-card__urgency-badge--hot');
      expect(badge).toBeTruthy();
    });

    it('should render warm badge', () => {
      const fixture = createCard(baseDiscount({ validUntil: isoDate(2) }));
      const badge = fixture.nativeElement.querySelector('.discount-card__urgency-badge--warm');
      expect(badge).toBeTruthy();
    });

    it('should render new badge', () => {
      const fixture = createCard(baseDiscount({ createdAt: isoHoursAgo(10), validUntil: isoDate(30) }));
      const badge = fixture.nativeElement.querySelector('.discount-card__urgency-badge--new');
      expect(badge).toBeTruthy();
    });

    it('should not render urgency badge when null', () => {
      const fixture = createCard(baseDiscount({ validUntil: isoDate(30), createdAt: isoDate(-5) }));
      const badge = fixture.nativeElement.querySelector('.discount-card__urgency-badge');
      expect(badge).toBeNull();
    });
  });

  // ── Coupon progress bar ──────────────────────────────────────────────────

  describe('coupon bar', () => {
    it('should show coupon bar when hasCoupons=true and coupons are set', () => {
      const fixture = createCard(baseDiscount({
        hasCoupons: true,
        totalCoupons: 50,
        availableCoupons: 25,
      }));
      const bar = fixture.nativeElement.querySelector('.discount-card__coupon-bar');
      expect(bar).toBeTruthy();
    });

    it('should hide coupon bar when hasCoupons=false', () => {
      const fixture = createCard(baseDiscount({ hasCoupons: false }));
      const bar = fixture.nativeElement.querySelector('.discount-card__coupon-bar');
      expect(bar).toBeNull();
    });

    it('should compute correct fill percent', () => {
      const fixture = createCard(baseDiscount({
        hasCoupons: true,
        totalCoupons: 100,
        availableCoupons: 40,
      }));
      expect(fixture.componentInstance.couponFillPercent()).toBe(40);
    });

    it('should flag isCouponCritical when fill <= 20%', () => {
      const fixture = createCard(baseDiscount({
        hasCoupons: true,
        totalCoupons: 100,
        availableCoupons: 15,
      }));
      expect(fixture.componentInstance.isCouponCritical()).toBe(true);
    });

    it('should not flag isCouponCritical when fill > 20%', () => {
      const fixture = createCard(baseDiscount({
        hasCoupons: true,
        totalCoupons: 100,
        availableCoupons: 50,
      }));
      expect(fixture.componentInstance.isCouponCritical()).toBe(false);
    });

    it('should apply --critical class to fill when critical', () => {
      const fixture = createCard(baseDiscount({
        hasCoupons: true,
        totalCoupons: 100,
        availableCoupons: 10,
      }));
      const fill = fixture.nativeElement.querySelector('.discount-card__coupon-bar-fill');
      expect(fill.classList).toContain('discount-card__coupon-bar-fill--critical');
    });
  });

  // ── Featured variant ─────────────────────────────────────────────────────

  describe('featured variant', () => {
    it('should add --featured class when featured=true', () => {
      const fixture = createCard(baseDiscount(), false, true);
      const article = fixture.nativeElement.querySelector('.discount-card');
      expect(article.classList).toContain('discount-card--featured');
    });

    it('should not add --featured class when featured=false', () => {
      const fixture = createCard(baseDiscount(), false, false);
      const article = fixture.nativeElement.querySelector('.discount-card');
      expect(article.classList).not.toContain('discount-card--featured');
    });
  });
});
