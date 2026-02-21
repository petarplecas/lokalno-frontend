import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EditDiscount } from './edit-discount';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { Discount, DiscountType, DiscountStatus } from '../../../core/models';

const mockDiscount: Discount = {
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
  daysOfWeek: [1, 2, 3, 4, 5],
  timeStart: null,
  timeEnd: null,
  minPurchase: null,
  hasCoupons: true,
  totalCoupons: 50,
  availableCoupons: 30,
  couponDuration: 24,
  templateStyle: null,
  tags: ['hrana', 'restoran'],
  status: DiscountStatus.ACTIVE,
  views: 100,
  saves: 10,
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
};

describe('EditDiscount', () => {
  const mockDiscountService = {
    getDiscount: jest.fn(),
    updateDiscount: jest.fn(),
    deleteDiscount: jest.fn(),
  };
  const mockToastService = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDiscountService.getDiscount.mockReturnValue(of(mockDiscount));

    await TestBed.configureTestingModule({
      imports: [EditDiscount],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 'disc-1' } } },
        },
        { provide: DiscountService, useValue: mockDiscountService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  function createComponent() {
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EditDiscount);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, router };
  }

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / populateForm', () => {
    it('should call getDiscount with id from route params', () => {
      createComponent();
      expect(mockDiscountService.getDiscount).toHaveBeenCalledWith('disc-1');
    });

    it('should populate title and description', () => {
      const { component } = createComponent();
      expect(component.form.controls.title.value).toBe('Test Popust');
      expect(component.form.controls.description.value).toBe('Opis');
    });

    it('should populate imageUrl', () => {
      const { component } = createComponent();
      expect(component.form.controls.imageUrl.value).toBe('https://example.com/img.jpg');
    });

    it('should split ISO date to date-only format', () => {
      const { component } = createComponent();
      expect(component.form.controls.validFrom.value).toBe('2025-01-01');
      expect(component.form.controls.validUntil.value).toBe('2025-12-31');
    });

    it('should join daysOfWeek as comma-separated string', () => {
      const { component } = createComponent();
      expect(component.form.controls.daysOfWeek.value).toBe('1,2,3,4,5');
    });

    it('should join tags as comma-separated string', () => {
      const { component } = createComponent();
      expect(component.form.controls.tags.value).toBe('hrana, restoran');
    });

    it('should set loading=false after successful load', () => {
      const { component } = createComponent();
      expect(component.loading()).toBe(false);
    });

    it('should set error signal on load failure', () => {
      mockDiscountService.getDiscount.mockReturnValue(throwError(() => new Error('not found')));
      const { component } = createComponent();
      expect(component.error()).toBe('Popust nije pronađen');
      expect(component.loading()).toBe(false);
    });
  });

  describe('onDiscountTypeChange', () => {
    it('BOGO: should clear validators and set discountValue to 1', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      component.onDiscountTypeChange();
      expect(component.form.controls.discountValue.value).toBe(1);
      expect(component.form.controls.discountValue.valid).toBe(true);
    });

    it('PERCENT: should restore required+min(1) validators', () => {
      const { component } = createComponent();
      // First BOGO (clears validators)
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      component.onDiscountTypeChange();
      // Then PERCENT (should restore validators)
      component.form.controls.discountType.setValue(DiscountType.PERCENT);
      component.onDiscountTypeChange();

      component.form.controls.discountValue.setValue(0);
      expect(component.form.controls.discountValue.valid).toBe(false);

      component.form.controls.discountValue.setValue(10);
      expect(component.form.controls.discountValue.valid).toBe(true);
    });
  });

  describe('Step navigation', () => {
    it('should start on step 0', () => {
      const { component } = createComponent();
      expect(component.currentStep()).toBe(0);
    });

    it('next() should advance when step is valid', () => {
      const { component } = createComponent();
      // Step 0 (imageUrl) is already populated from populateForm
      component.next();
      expect(component.currentStep()).toBe(1);
    });

    it('next() should not advance when step is invalid', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('');
      component.next();
      expect(component.currentStep()).toBe(0);
    });

    it('prev() should go back', () => {
      const { component } = createComponent();
      component.next(); // step 1
      component.prev();
      expect(component.currentStep()).toBe(0);
    });

    it('prev() should not go below 0', () => {
      const { component } = createComponent();
      component.prev();
      expect(component.currentStep()).toBe(0);
    });

    it('goToStep() should navigate to earlier step', () => {
      const { component } = createComponent();
      component.next(); // step 1
      component.goToStep(0);
      expect(component.currentStep()).toBe(0);
    });

    it('goToStep() should not navigate to later step', () => {
      const { component } = createComponent();
      component.goToStep(5);
      expect(component.currentStep()).toBe(0);
    });
  });

  describe('onSubmit', () => {
    it('should call updateDiscount with correct payload', () => {
      mockDiscountService.updateDiscount.mockReturnValue(of(mockDiscount));

      const { component } = createComponent();
      component.onSubmit();

      expect(mockDiscountService.updateDiscount).toHaveBeenCalledWith(
        'disc-1',
        expect.objectContaining({
          title: 'Test Popust',
          discountType: DiscountType.PERCENT,
          discountValue: 20,
          imageUrl: 'https://example.com/img.jpg',
        }),
      );
    });

    it('should parse daysOfWeek from comma string in payload', () => {
      mockDiscountService.updateDiscount.mockReturnValue(of(mockDiscount));

      const { component } = createComponent();
      component.onSubmit();

      expect(mockDiscountService.updateDiscount).toHaveBeenCalledWith(
        'disc-1',
        expect.objectContaining({
          validity: expect.objectContaining({
            daysOfWeek: [1, 2, 3, 4, 5],
          }),
        }),
      );
    });

    it('BOGO: should send discountValue=1 in payload', () => {
      mockDiscountService.updateDiscount.mockReturnValue(of(mockDiscount));

      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      component.onDiscountTypeChange();
      component.onSubmit();

      expect(mockDiscountService.updateDiscount).toHaveBeenCalledWith(
        'disc-1',
        expect.objectContaining({ discountValue: 1 }),
      );
    });

    it('should show success toast and navigate on success', () => {
      mockDiscountService.updateDiscount.mockReturnValue(of(mockDiscount));

      const { component } = createComponent();
      component.onSubmit();

      expect(mockToastService.success).toHaveBeenCalledWith('Popust je ažuriran!');
    });

    it('should set error and saving=false on failure', () => {
      mockDiscountService.updateDiscount.mockReturnValue(
        throwError(() => ({ error: { message: 'Ažuriranje nije uspelo' } })),
      );

      const { component } = createComponent();
      component.onSubmit();

      expect(component.saving()).toBe(false);
      expect(component.error()).toBe('Ažuriranje nije uspelo');
    });

    it('should navigate to invalid step if form is incomplete', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue(''); // invalidate step 0
      component.onSubmit();
      expect(component.currentStep()).toBe(0);
      expect(component.error()).toContain('Slika');
    });
  });

  describe('Delete flow', () => {
    it('onDelete should set showDeleteDialog=true', () => {
      const { component } = createComponent();
      component.onDelete();
      expect(component.showDeleteDialog()).toBe(true);
    });

    it('onCancelDelete should set showDeleteDialog=false', () => {
      const { component } = createComponent();
      component.onDelete();
      component.onCancelDelete();
      expect(component.showDeleteDialog()).toBe(false);
    });

    it('onConfirmDelete should call deleteDiscount and navigate on success', () => {
      mockDiscountService.deleteDiscount.mockReturnValue(of({ message: 'deleted' }));

      const { component } = createComponent();
      component.onConfirmDelete();

      expect(mockDiscountService.deleteDiscount).toHaveBeenCalledWith('disc-1');
      expect(mockToastService.success).toHaveBeenCalledWith('Popust je obrisan');
    });

    it('onConfirmDelete should set deleting=false and close dialog on error', () => {
      mockDiscountService.deleteDiscount.mockReturnValue(
        throwError(() => ({ error: { message: 'Brisanje nije uspelo' } })),
      );

      const { component } = createComponent();
      component.onConfirmDelete();

      expect(component.deleting()).toBe(false);
      expect(component.showDeleteDialog()).toBe(false);
      expect(component.error()).toBe('Brisanje nije uspelo');
    });
  });
});
