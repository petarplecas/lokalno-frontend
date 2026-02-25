import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PendingBusinesses } from './pending-businesses';
import { AdminService } from '../../../core/services/admin.service';
import {
  BusinessListItem,
  BusinessStatus,
  PaginatedResponse,
} from '../../../core/models';

const mockBusiness: BusinessListItem = {
  id: 'b1',
  name: 'Test Biznis',
  category: 'RESTORANI',
  subCategory: 'Italijanski',
  logoUrl: null,
  address: 'Beograd, Knez Mihailova 1',
  latitude: 44.81,
  longitude: 20.46,
  followersCount: 42,
  status: BusinessStatus.PENDING,
  activeDiscountsCount: 3,
};

const mockResponse: PaginatedResponse<BusinessListItem> = {
  data: [mockBusiness],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};

const emptyResponse: PaginatedResponse<BusinessListItem> = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

describe('PendingBusinesses', () => {
  const mockAdminService = {
    getPendingBusinesses: jest.fn(),
    getAllBusinesses: jest.fn(),
  };

  beforeEach(async () => {
    mockAdminService.getPendingBusinesses.mockReturnValue(of(mockResponse));
    mockAdminService.getAllBusinesses.mockReturnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [PendingBusinesses],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminService, useValue: mockAdminService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    mockAdminService.getPendingBusinesses.mockReset();
    mockAdminService.getAllBusinesses.mockReset();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PendingBusinesses);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load pending businesses on init', () => {
    const fixture = TestBed.createComponent(PendingBusinesses);
    fixture.detectChanges();
    expect(mockAdminService.getPendingBusinesses).toHaveBeenCalledWith(1);
  });

  it('should render 4 tabs', () => {
    const fixture = TestBed.createComponent(PendingBusinesses);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('.admin-businesses__tab');
    expect(tabs.length).toBe(5);
    expect(tabs[0].textContent.trim()).toBe('Na čekanju');
    expect(tabs[4].textContent.trim()).toBe('Svi');
  });

  it('should switch to Approved tab and call getAllBusinesses', () => {
    const fixture = TestBed.createComponent(PendingBusinesses);
    fixture.detectChanges();
    mockAdminService.getAllBusinesses.mockClear();
    mockAdminService.getAllBusinesses.mockReturnValue(of(emptyResponse));

    const tabs = fixture.nativeElement.querySelectorAll('.admin-businesses__tab');
    tabs[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe(1);
    expect(mockAdminService.getAllBusinesses).toHaveBeenCalledWith(1, 20, BusinessStatus.APPROVED);
  });

  it('should switch to All tab with no status filter', () => {
    const fixture = TestBed.createComponent(PendingBusinesses);
    fixture.detectChanges();
    mockAdminService.getAllBusinesses.mockClear();
    mockAdminService.getAllBusinesses.mockReturnValue(of(emptyResponse));

    const tabs = fixture.nativeElement.querySelectorAll('.admin-businesses__tab');
    tabs[4].click();
    fixture.detectChanges();

    expect(mockAdminService.getAllBusinesses).toHaveBeenCalledWith(1, 20, undefined);
  });

  it('should render business cards', () => {
    const fixture = TestBed.createComponent(PendingBusinesses);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.admin-businesses__card');
    expect(cards.length).toBe(1);
  });

  it('should show empty state when no businesses', () => {
    mockAdminService.getPendingBusinesses.mockReturnValue(of(emptyResponse));
    const fixture = TestBed.createComponent(PendingBusinesses);
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should display total count', () => {
    const fixture = TestBed.createComponent(PendingBusinesses);
    fixture.detectChanges();
    const count = fixture.nativeElement.querySelector('.admin-businesses__count');
    expect(count.textContent).toContain('1');
  });

  it('should return correct status labels', () => {
    const fixture = TestBed.createComponent(PendingBusinesses);
    const comp = fixture.componentInstance;
    expect(comp.statusLabel(BusinessStatus.PENDING)).toBe('Na čekanju');
    expect(comp.statusLabel(BusinessStatus.APPROVED)).toBe('Odobren');
    expect(comp.statusLabel(BusinessStatus.SUSPENDED)).toBe('Suspendovan');
  });
});
