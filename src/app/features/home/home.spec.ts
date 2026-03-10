import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { Home } from './home';
import { DiscountService } from '../../core/services/discount.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  Discount,
  DiscountType,
  DiscountStatus,
  PaginatedResponse,
} from '../../core/models';

// Mock IntersectionObserver for jsdom
(globalThis as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

const mockDiscount: Discount = {
  id: '1',
  title: 'Test Popust',
  description: 'Opis',
  imageUrl: 'https://example.com/img.jpg',
  discountType: DiscountType.PERCENT,
  discountValue: 20,
  oldPrice: null,
  newPrice: null,
  validFrom: '2024-01-01',
  validUntil: '2099-12-31',
  daysOfWeek: [1, 2, 3, 4, 5],
  timeStart: null,
  timeEnd: null,
  minPurchase: null,
  hasCoupons: true,
  totalCoupons: 100,
  availableCoupons: 50,
  couponDuration: 30,
  templateStyle: null,
  tags: ['hrana'],
  status: DiscountStatus.ACTIVE,
  views: 150,
  saves: 10,
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
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
};

const mockResponse: PaginatedResponse<Discount> = {
  data: [mockDiscount],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};

const mockEmptyResponse: PaginatedResponse<Discount> = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

describe('Home', () => {
  const mockDiscountService = { getDiscounts: jest.fn() };
  const mockUserService = {
    saveDiscount: jest.fn().mockReturnValue(of({ message: 'ok' })),
    removeSavedDiscount: jest.fn().mockReturnValue(of({ message: 'ok' })),
  };
  const mockAuthService = { isAuthenticated: jest.fn(() => false) };
  const mockToastService = { success: jest.fn(), error: jest.fn() };
  const mockRouter = { navigate: jest.fn() };

  beforeEach(async () => {
    mockDiscountService.getDiscounts.mockReturnValue(of(mockResponse));
    mockAuthService.isAuthenticated.mockReturnValue(false);

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DiscountService, useValue: mockDiscountService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    mockDiscountService.getDiscounts.mockReset();
    mockUserService.saveDiscount.mockReset();
    mockUserService.removeSavedDiscount.mockReset();
    mockToastService.success.mockReset();
    mockToastService.error.mockReset();
    mockRouter.navigate.mockReset();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Home);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load discounts on init', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(mockDiscountService.getDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sortBy: 'createdAt' }),
    );
  });

  it('should render discount cards (featured + grid = 2 for 1 discount)', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-discount-card');
    // 1 discount rendered twice: once in featured scroll, once in main grid
    expect(cards.length).toBe(2);
  });

  it('should render featured section', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const featured = fixture.nativeElement.querySelector('.home__featured');
    expect(featured).toBeTruthy();
  });

  it('should render category pills with emoji labels', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const pills = fixture.nativeElement.querySelectorAll('.home__pill');
    expect(pills.length).toBe(7);
    expect(pills[0].textContent.trim()).toContain('Sve');
  });

  it('should change active category on pill click', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    mockDiscountService.getDiscounts.mockClear();
    mockDiscountService.getDiscounts.mockReturnValue(of(mockResponse));

    const pills = fixture.nativeElement.querySelectorAll('.home__pill');
    pills[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeCategory()).toBe(1);
    expect(mockDiscountService.getDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'RESTORANI,KAFICI,FAST_FOOD,PEKARE,POSLASTICARNICE',
      }),
    );
  });

  it('should debounce search input', () => {
    jest.useFakeTimers();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    mockDiscountService.getDiscounts.mockClear();
    mockDiscountService.getDiscounts.mockReturnValue(of(mockResponse));

    const input = fixture.nativeElement.querySelector('.home__search-input');
    input.value = 'pizza';
    input.dispatchEvent(new Event('input'));

    expect(mockDiscountService.getDiscounts).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);

    expect(mockDiscountService.getDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'pizza' }),
    );
    jest.useRealTimers();
  });

  it('should show empty state when no results', () => {
    mockDiscountService.getDiscounts.mockReturnValue(of(mockEmptyResponse));
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should manage loading state', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.discounts.set([]);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.home__loading');
    expect(spinner).toBeTruthy();
    const grid = fixture.nativeElement.querySelector('.home__grid');
    expect(grid).toBeNull();
  });

  it('should display total count', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const count = fixture.nativeElement.querySelector('.home__count');
    expect(count.textContent).toContain('1');
  });

  it('should change sort and reload', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    mockDiscountService.getDiscounts.mockClear();
    mockDiscountService.getDiscounts.mockReturnValue(of(mockResponse));

    const select = fixture.nativeElement.querySelector('.home__sort');
    select.value = 'views';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(mockDiscountService.getDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'views' }),
    );
  });

  it('should load more on infinite scroll', () => {
    const multiPageResponse: PaginatedResponse<Discount> = {
      data: [mockDiscount],
      meta: { total: 40, page: 1, limit: 20, totalPages: 2 },
    };
    mockDiscountService.getDiscounts.mockReturnValue(of(multiPageResponse));

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    expect(fixture.componentInstance.hasMore()).toBe(true);

    mockDiscountService.getDiscounts.mockClear();
    const page2Response: PaginatedResponse<Discount> = {
      data: [{ ...mockDiscount, id: '2' }],
      meta: { total: 40, page: 2, limit: 20, totalPages: 2 },
    };
    mockDiscountService.getDiscounts.mockReturnValue(of(page2Response));

    fixture.componentInstance.onLoadMore();
    fixture.detectChanges();

    expect(mockDiscountService.getDiscounts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    );
    expect(fixture.componentInstance.discounts().length).toBe(2);
  });

  describe('save toggle', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      const fixture = TestBed.createComponent(Home);
      fixture.detectChanges();

      fixture.componentInstance.onSaveToggled({ discount: mockDiscount, save: true });

      expect(mockUserService.saveDiscount).not.toHaveBeenCalled();
    });

    it('should call saveDiscount and update set when authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockUserService.saveDiscount.mockReturnValue(of({ message: 'ok' }));
      const fixture = TestBed.createComponent(Home);
      fixture.detectChanges();

      fixture.componentInstance.onSaveToggled({ discount: mockDiscount, save: true });

      expect(mockUserService.saveDiscount).toHaveBeenCalledWith('1');
      expect(fixture.componentInstance.isDiscountSaved('1')).toBe(true);
    });

    it('should call removeSavedDiscount when unsaving', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockUserService.removeSavedDiscount.mockReturnValue(of({ message: 'ok' }));
      const fixture = TestBed.createComponent(Home);
      fixture.detectChanges();

      fixture.componentInstance.savedDiscountIds.update((s) => new Set([...s, '1']));
      fixture.componentInstance.onSaveToggled({ discount: mockDiscount, save: false });

      expect(mockUserService.removeSavedDiscount).toHaveBeenCalledWith('1');
      expect(fixture.componentInstance.isDiscountSaved('1')).toBe(false);
    });

    it('should compute featuredDiscounts as first 3 from discounts', () => {
      const multiDiscount: PaginatedResponse<Discount> = {
        data: [
          { ...mockDiscount, id: '1' },
          { ...mockDiscount, id: '2' },
          { ...mockDiscount, id: '3' },
          { ...mockDiscount, id: '4' },
        ],
        meta: { total: 4, page: 1, limit: 20, totalPages: 1 },
      };
      mockDiscountService.getDiscounts.mockReturnValue(of(multiDiscount));
      const fixture = TestBed.createComponent(Home);
      fixture.detectChanges();

      const featured = fixture.componentInstance.featuredDiscounts();
      expect(featured).toHaveLength(3);
      expect(featured.map((d) => d.id)).toEqual(['1', '2', '3']);
    });
  });
});
