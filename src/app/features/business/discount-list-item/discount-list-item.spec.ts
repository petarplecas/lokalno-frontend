import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DiscountListItem } from './discount-list-item';
import { Discount, DiscountType, DiscountStatus } from '../../../core/models';

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
    hasCoupons: true,
    totalCoupons: 100,
    availableCoupons: 67,
    couponDuration: 24,
    templateStyle: null,
    tags: [],
    status: DiscountStatus.ACTIVE,
    views: 124,
    saves: 18,
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

describe('DiscountListItem', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscountListItem],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  function createComponent(discount = makeDiscount()) {
    const fixture = TestBed.createComponent(DiscountListItem);
    fixture.componentRef.setInput('discount', discount);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  describe('couponPercent', () => {
    it('returns null when hasCoupons=false', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: false }));
      expect(component.couponPercent()).toBeNull();
    });

    it('returns null when totalCoupons=null', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: null }));
      expect(component.couponPercent()).toBeNull();
    });

    it('returns null when availableCoupons=null', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: 100, availableCoupons: null }));
      expect(component.couponPercent()).toBeNull();
    });

    it('returns correct percentage: availableCoupons/totalCoupons*100 rounded', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: 100, availableCoupons: 67 }));
      expect(component.couponPercent()).toBe(67);
    });

    it('returns 0 when availableCoupons=0', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: 100, availableCoupons: 0 }));
      expect(component.couponPercent()).toBe(0);
    });

    it('returns 100 when all coupons available', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: 50, availableCoupons: 50 }));
      expect(component.couponPercent()).toBe(100);
    });

    it('rounds non-integer percentages', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: 3, availableCoupons: 1 }));
      // 1/3 * 100 = 33.33... → 33
      expect(component.couponPercent()).toBe(33);
    });
  });

  describe('statusClass', () => {
    it('returns "active" for ACTIVE', () => {
      const { component } = createComponent(makeDiscount({ status: DiscountStatus.ACTIVE }));
      expect(component.statusClass()).toBe('active');
    });

    it('returns "expired" for EXPIRED', () => {
      const { component } = createComponent(makeDiscount({ status: DiscountStatus.EXPIRED }));
      expect(component.statusClass()).toBe('expired');
    });

    it('returns "deactivated" for DEACTIVATED', () => {
      const { component } = createComponent(makeDiscount({ status: DiscountStatus.DEACTIVATED }));
      expect(component.statusClass()).toBe('deactivated');
    });

    it('returns "draft" for DRAFT', () => {
      const { component } = createComponent(makeDiscount({ status: DiscountStatus.DRAFT }));
      expect(component.statusClass()).toBe('draft');
    });
  });

  describe('statusLabel', () => {
    it('returns "Aktivan" for ACTIVE', () => {
      const { component } = createComponent(makeDiscount({ status: DiscountStatus.ACTIVE }));
      expect(component.statusLabel()).toBe('Aktivan');
    });

    it('returns "Istekao" for EXPIRED', () => {
      const { component } = createComponent(makeDiscount({ status: DiscountStatus.EXPIRED }));
      expect(component.statusLabel()).toBe('Istekao');
    });

    it('returns "Deaktiviran" for DEACTIVATED', () => {
      const { component } = createComponent(makeDiscount({ status: DiscountStatus.DEACTIVATED }));
      expect(component.statusLabel()).toBe('Deaktiviran');
    });

    it('returns "Nacrt" for DRAFT', () => {
      const { component } = createComponent(makeDiscount({ status: DiscountStatus.DRAFT }));
      expect(component.statusLabel()).toBe('Nacrt');
    });
  });

  describe('toggleMenu / closeMenu', () => {
    it('toggleMenu opens menu when closed', () => {
      const { component } = createComponent();
      expect(component.menuOpen()).toBe(false);
      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);
    });

    it('toggleMenu closes menu when open', () => {
      const { component } = createComponent();
      component.toggleMenu();
      component.toggleMenu();
      expect(component.menuOpen()).toBe(false);
    });

    it('closeMenu sets menuOpen=false', () => {
      const { component } = createComponent();
      component.toggleMenu(); // open
      component.closeMenu();
      expect(component.menuOpen()).toBe(false);
    });
  });

  describe('onDelete', () => {
    it('should emit deleted event with discount id', () => {
      const { component } = createComponent(makeDiscount({ id: 'disc-42' }));
      let emittedId: string | undefined;
      component.deleted.subscribe((id) => (emittedId = id));

      component.onDelete();

      expect(emittedId).toBe('disc-42');
    });

    it('should close menu on delete', () => {
      const { component } = createComponent();
      component.deleted.subscribe(() => {}); // subscribe to avoid unhandled
      component.toggleMenu(); // open
      component.onDelete();
      expect(component.menuOpen()).toBe(false);
    });
  });
});
