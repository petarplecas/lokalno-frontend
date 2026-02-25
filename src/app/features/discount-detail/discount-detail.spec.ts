import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
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

const mockDiscount: Discount = {
  id: 'd1',
  title: 'Test Popust',
  description: 'Opis popusta',
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
  hasCoupons: true,
  totalCoupons: 100,
  availableCoupons: 50,
  couponDuration: 30,
  templateStyle: null,
  tags: [],
  status: DiscountStatus.ACTIVE,
  views: 100,
  saves: 5,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  business: {
    id: 'b1',
    name: 'Test Biznis',
    logoUrl: null,
    category: 'RESTORANI',
    subCategory: 'Picerija',
    address: 'Beograd, Knez Mihailova 1',
    latitude: 44.8,
    longitude: 20.4,
  },
};

describe('DiscountDetail', () => {
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
  const mockAuthService = {
    isAuthenticated: jest.fn().mockReturnValue(true),
  };
  const mockToastService = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    mockDiscountService.getDiscount.mockReturnValue(of(mockDiscount));
    mockDiscountService.claimCoupon.mockReset();

    await TestBed.configureTestingModule({
      imports: [DiscountDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'd1' } } },
        },
        { provide: DiscountService, useValue: mockDiscountService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('should create', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load discount on init', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();
    expect(mockDiscountService.getDiscount).toHaveBeenCalledWith('d1');
    expect(fixture.componentInstance.discount()).toEqual(mockDiscount);
  });

  it('should display discount title', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.detail__title');
    expect(title.textContent).toContain('Test Popust');
  });

  it('should display business name', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('.detail__business-info strong');
    expect(name.textContent).toContain('Test Biznis');
  });

  it('should show claim button for discount with coupons', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.detail__cta-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Pokupite kupon');
  });

  it('should open claim dialog', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();
    fixture.componentInstance.openClaimDialog();
    fixture.detectChanges();
    expect(fixture.componentInstance.showClaimDialog()).toBe(true);
    const dialog = fixture.nativeElement.querySelector('app-confirm-dialog');
    expect(dialog).toBeTruthy();
  });

  it('should claim coupon on confirm', () => {
    const mockCouponRes = {
      message: 'Success',
      coupon: {
        id: 'c1',
        code: 'KUP-ABCD',
        status: CouponStatus.ACTIVE,
        expiresAt: '2024-12-31T23:59:59',
        createdAt: '2024-01-01',
        discount: { id: 'd1', title: 'Test', business: { id: 'b1', name: 'Biz' } },
      },
    };
    mockDiscountService.claimCoupon.mockReturnValue(of(mockCouponRes));

    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();
    fixture.componentInstance.onClaimConfirm(true);
    fixture.detectChanges();

    expect(mockDiscountService.claimCoupon).toHaveBeenCalledWith('d1');
    expect(fixture.componentInstance.claimedCoupon()).toEqual(mockCouponRes.coupon);
  });

  it('should toggle favorite state', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();

    fixture.componentInstance.toggleFavorite();
    expect(mockUserService.addFavorite).toHaveBeenCalledWith('b1');
    expect(fixture.componentInstance.isFavorite()).toBe(true);
  });

  it('should toggle save state', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();

    fixture.componentInstance.toggleSave();
    expect(mockUserService.saveDiscount).toHaveBeenCalledWith('d1');
    expect(fixture.componentInstance.isSaved()).toBe(true);
  });

  it('should remove saved discount when already saved', () => {
    mockUserService.isSaved.mockReturnValue(of(true));
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();

    fixture.componentInstance.toggleSave();
    expect(mockUserService.removeSavedDiscount).toHaveBeenCalledWith('d1');
    expect(fixture.componentInstance.isSaved()).toBe(false);
  });

  it('should render business name as link to business profile', () => {
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.detail__business-link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/businesses/b1');
  });

  it('should show error toast on fetch failure', () => {
    mockDiscountService.getDiscount.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(DiscountDetail);
    fixture.detectChanges();
    expect(mockToastService.error).toHaveBeenCalledWith('Popust nije pronađen');
  });
});
