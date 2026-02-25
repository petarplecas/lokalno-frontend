import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { BusinessReview } from './business-review';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessDetail, BusinessStatus, SubscriptionTier } from '../../../core/models';

const mockBusiness: BusinessDetail = {
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
  description: 'Opis biznisa',
  phone: '+381601234567',
  website: 'https://test.rs',
  subscriptionTier: SubscriptionTier.BASIC,
  createdAt: '2024-06-01T12:00:00',
};

describe('BusinessReview', () => {
  const mockAdminService = {
    getBusiness: jest.fn(),
    updateBusinessStatus: jest.fn(),
  };

  const mockToastService = {
    success: jest.fn(),
    error: jest.fn(),
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: jest.fn().mockReturnValue('b1'),
      },
    },
  };

  beforeEach(async () => {
    mockAdminService.getBusiness.mockReturnValue(of(mockBusiness));
    mockAdminService.updateBusinessStatus.mockReturnValue(of({ message: 'OK' }));

    await TestBed.configureTestingModule({
      imports: [BusinessReview],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockAdminService.getBusiness.mockReset();
    mockAdminService.updateBusinessStatus.mockReset();
    mockToastService.success.mockReset();
    mockToastService.error.mockReset();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load business on init', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    expect(mockAdminService.getBusiness).toHaveBeenCalledWith('b1');
  });

  it('should display business name', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('.business-review__title-block h1');
    expect(h1.textContent.trim()).toBe('Test Biznis');
  });

  it('should show status badge for pending business', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('.business-review__status--pending');
    expect(status).toBeTruthy();
    expect(status.textContent.trim()).toBe('Na čekanju');
  });

  it('should display business details', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.business-review__row');
    expect(rows.length).toBeGreaterThanOrEqual(7);
  });

  it('should show approve and reject buttons for pending business', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.business-review__actions button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent.trim()).toContain('Odobri');
    expect(buttons[1].textContent.trim()).toContain('Odbij');
  });

  it('should open approve dialog on click', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.showApproveDialog()).toBe(false);
    comp.openApproveDialog();
    expect(comp.showApproveDialog()).toBe(true);
  });

  it('should call updateBusinessStatus with APPROVED on confirm', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.onApproveConfirm(true);
    expect(mockAdminService.updateBusinessStatus).toHaveBeenCalledWith('b1', BusinessStatus.APPROVED);
  });

  it('should call updateBusinessStatus with SUSPENDED on reject confirm', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.onRejectConfirm(true);
    expect(mockAdminService.updateBusinessStatus).toHaveBeenCalledWith('b1', BusinessStatus.REJECTED);
  });

  it('should not call updateBusinessStatus when dialog is cancelled', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.onApproveConfirm(false);
    expect(mockAdminService.updateBusinessStatus).not.toHaveBeenCalled();

    comp.onRejectConfirm(false);
    expect(mockAdminService.updateBusinessStatus).not.toHaveBeenCalled();
  });

  it('should return correct status labels', () => {
    const fixture = TestBed.createComponent(BusinessReview);
    const comp = fixture.componentInstance;
    expect(comp.statusLabel(BusinessStatus.PENDING)).toBe('Na čekanju');
    expect(comp.statusLabel(BusinessStatus.APPROVED)).toBe('Odobren');
    expect(comp.statusLabel(BusinessStatus.SUSPENDED)).toBe('Suspendovan');
  });
});
