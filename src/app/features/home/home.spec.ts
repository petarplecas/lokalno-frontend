import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Home } from './home';
import { DiscountService } from '../../core/services/discount.service';
import {
  Discount,
  DiscountType,
  DiscountStatus,
  PaginatedResponse,
} from '../../core/models';

// Mock IntersectionObserver for jsdom
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
(globalThis as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
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
  tags: ['hrana'],
  status: DiscountStatus.ACTIVE,
  views: 150,
  saves: 10,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
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
  const mockDiscountService = {
    getDiscounts: jest.fn(),
  };

  beforeEach(async () => {
    mockDiscountService.getDiscounts.mockReturnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DiscountService, useValue: mockDiscountService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    mockDiscountService.getDiscounts.mockReset();
    TestBed.resetTestingModule();
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

  it('should render discount cards', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-discount-card');
    expect(cards.length).toBe(1);
  });

  it('should render category pills', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const pills = fixture.nativeElement.querySelectorAll('.home__pill');
    expect(pills.length).toBe(7);
    expect(pills[0].textContent.trim()).toBe('Sve');
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
    fixture.detectChanges(); // ngOnInit runs, data loads

    // Manually set loading to true to test template binding
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
});
