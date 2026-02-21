import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CreateDiscount } from './create-discount';
import { DiscountService } from '../../../core/services/discount.service';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { DiscountType } from '../../../core/models';
import { PendingImageBlob } from '../../../shared/components/image-upload/image-upload';

describe('CreateDiscount', () => {
  const mockDiscountService = {
    createDiscount: jest.fn(),
    updateStatus: jest.fn(),
  };
  const mockUploadService = {
    getPresignedUrl: jest.fn(),
    uploadToS3: jest.fn(),
  };
  const mockToastService = {
    success: jest.fn(),
    error: jest.fn(),
  };
  const mockRouter = { navigate: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [CreateDiscount],
      providers: [
        provideRouter([]),
        { provide: DiscountService, useValue: mockDiscountService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  function createComponent() {
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CreateDiscount);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, router };
  }

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should start on step 0', () => {
      const { component } = createComponent();
      expect(component.currentStep()).toBe(0);
    });

    it('should have all 7 days selected by default', () => {
      const { component } = createComponent();
      expect(component.form.controls.daysOfWeek.value).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should have couponDuration=24 by default', () => {
      const { component } = createComponent();
      expect(component.form.controls.couponDuration.value).toBe(24);
    });

    it('should have loading=false and error=null', () => {
      const { component } = createComponent();
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });
  });

  describe('Day picker', () => {
    it('isDaySelected should return true for all days initially', () => {
      const { component } = createComponent();
      [1, 2, 3, 4, 5, 6, 7].forEach((d) => {
        expect(component.isDaySelected(d)).toBe(true);
      });
    });

    it('toggleDay should deselect a selected day', () => {
      const { component } = createComponent();
      component.toggleDay(1);
      expect(component.isDaySelected(1)).toBe(false);
      expect(component.form.controls.daysOfWeek.value).toEqual([2, 3, 4, 5, 6, 7]);
    });

    it('toggleDay should reselect a deselected day in sorted order', () => {
      const { component } = createComponent();
      component.toggleDay(3); // deselect 3
      component.toggleDay(3); // select 3 again
      expect(component.isDaySelected(3)).toBe(true);
      expect(component.form.controls.daysOfWeek.value).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('toggleDay should keep days sorted after adding out of order', () => {
      const { component } = createComponent();
      // Remove all then add in reverse
      [1, 2, 3, 4, 5, 6, 7].forEach((d) => component.toggleDay(d));
      component.toggleDay(5);
      component.toggleDay(2);
      expect(component.form.controls.daysOfWeek.value).toEqual([2, 5]);
    });
  });

  describe('getDurationLabel', () => {
    it('should return 1 sat for value 1', () => {
      const { component } = createComponent();
      expect(component.getDurationLabel(1)).toBe('1 sat');
    });

    it('should return 3 sata for value 3', () => {
      const { component } = createComponent();
      expect(component.getDurationLabel(3)).toBe('3 sata');
    });

    it('should return 6 sati for value 6', () => {
      const { component } = createComponent();
      expect(component.getDurationLabel(6)).toBe('6 sati');
    });

    it('should return 24 sata for value 24', () => {
      const { component } = createComponent();
      expect(component.getDurationLabel(24)).toBe('24 sata');
    });

    it('should return 7 dana for value 168', () => {
      const { component } = createComponent();
      expect(component.getDurationLabel(168)).toBe('7 dana');
    });

    it('should return fallback for unknown value', () => {
      const { component } = createComponent();
      expect(component.getDurationLabel(99)).toBe('99h');
    });

    it('should return fallback for null', () => {
      const { component } = createComponent();
      expect(component.getDurationLabel(null)).toBe('nullh');
    });
  });

  describe('onDiscountTypeChange', () => {
    it('BOGO: should clear discountValue validators and set value to 1', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      component.onDiscountTypeChange();
      expect(component.form.controls.discountValue.value).toBe(1);
      expect(component.form.controls.discountValue.valid).toBe(true);
    });

    it('NEW_PRICE: should set oldPrice and newPrice validators, clear discountValue min', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.NEW_PRICE);
      component.onDiscountTypeChange();

      // oldPrice and newPrice should be required
      component.form.controls.oldPrice.setValue(null);
      component.form.controls.newPrice.setValue(null);
      expect(component.form.controls.oldPrice.valid).toBe(false);
      expect(component.form.controls.newPrice.valid).toBe(false);
    });

    it('NEW_PRICE: valid when oldPrice and newPrice are set', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.NEW_PRICE);
      component.onDiscountTypeChange();
      component.form.controls.oldPrice.setValue(1000);
      component.form.controls.newPrice.setValue(800);
      expect(component.form.controls.oldPrice.valid).toBe(true);
      expect(component.form.controls.newPrice.valid).toBe(true);
    });

    it('PERCENT: should set discountValue with required+min(1) validators', () => {
      const { component } = createComponent();
      // First set BOGO to clear validators, then switch to PERCENT
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      component.onDiscountTypeChange();
      component.form.controls.discountType.setValue(DiscountType.PERCENT);
      component.onDiscountTypeChange();

      component.form.controls.discountValue.setValue(0);
      expect(component.form.controls.discountValue.valid).toBe(false);

      component.form.controls.discountValue.setValue(10);
      expect(component.form.controls.discountValue.valid).toBe(true);
    });

    it('FIXED: should set discountValue with required+min(1) validators', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.FIXED);
      component.onDiscountTypeChange();

      component.form.controls.discountValue.setValue(0);
      expect(component.form.controls.discountValue.valid).toBe(false);

      component.form.controls.discountValue.setValue(50);
      expect(component.form.controls.discountValue.valid).toBe(true);
    });
  });

  describe('Step navigation', () => {
    it('next() should not advance if current step is invalid', () => {
      const { component } = createComponent();
      // Step 0 requires imageUrl
      component.form.controls.imageUrl.setValue('');
      component.next();
      expect(component.currentStep()).toBe(0);
    });

    it('next() should advance when current step is valid', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('pending');
      component.next();
      expect(component.currentStep()).toBe(1);
    });

    it('next() should mark step fields as touched when invalid', () => {
      const { component } = createComponent();
      component.next(); // step 0 invalid (no image)
      expect(component.form.controls.imageUrl.touched).toBe(true);
    });

    it('prev() should not go below step 0', () => {
      const { component } = createComponent();
      component.prev();
      expect(component.currentStep()).toBe(0);
    });

    it('prev() should go back one step', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('pending');
      component.next(); // → step 1
      component.prev(); // → step 0
      expect(component.currentStep()).toBe(0);
    });

    it('goToStep() should navigate to earlier step', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('pending');
      component.next(); // step 1
      component.goToStep(0);
      expect(component.currentStep()).toBe(0);
    });

    it('goToStep() should not navigate to a later step', () => {
      const { component } = createComponent();
      component.goToStep(3);
      expect(component.currentStep()).toBe(0);
    });
  });

  describe('isStepValid', () => {
    it('should return false for step 0 when imageUrl is empty', () => {
      const { component } = createComponent();
      expect(component.isStepValid(0)).toBe(false);
    });

    it('should return true for step 0 when imageUrl is set', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('pending');
      expect(component.isStepValid(0)).toBe(true);
    });

    it('should return false for step 1 when title is empty', () => {
      const { component } = createComponent();
      expect(component.isStepValid(1)).toBe(false);
    });

    it('should return true for step 1 when title is set', () => {
      const { component } = createComponent();
      component.form.controls.title.setValue('Test Popust');
      expect(component.isStepValid(1)).toBe(true);
    });
  });

  describe('onPendingImage', () => {
    beforeEach(() => {
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:preview');
      global.URL.revokeObjectURL = jest.fn();
    });

    it('should set imageUrl to pending and pendingPreviewUrl when blob provided', () => {
      const { component } = createComponent();
      const pending: PendingImageBlob = {
        blob: new Blob(['img'], { type: 'image/webp' }),
        contentType: 'image/webp',
        filename: 'photo.webp',
      };
      component.onPendingImage(pending);
      expect(component.form.controls.imageUrl.value).toBe('pending');
      expect(component.pendingPreviewUrl()).toBe('blob:preview');
    });

    it('should clear imageUrl and pendingPreviewUrl when null provided', () => {
      const { component } = createComponent();
      component.onPendingImage(null);
      expect(component.form.controls.imageUrl.value).toBe('');
      expect(component.pendingPreviewUrl()).toBeNull();
    });
  });

  describe('onSubmit', () => {
    it('should navigate to invalid step when form is not fully valid', () => {
      const { component } = createComponent();
      // No image set → step 0 is invalid
      component.onSubmit();
      expect(component.currentStep()).toBe(0);
      expect(component.error()).toContain('Slika');
    });

    it('should call createDiscount without upload when no pendingImage', () => {
      const mockDiscount = { id: 'disc-1' };
      mockDiscountService.createDiscount.mockReturnValue(of(mockDiscount));
      mockDiscountService.updateStatus.mockReturnValue(of({ id: 'disc-1', status: 'ACTIVE' }));

      const { component } = createComponent();

      // Fill all required fields
      component.form.controls.imageUrl.setValue('https://example.com/img.jpg');
      component.form.controls.title.setValue('Test Popust');
      component.form.controls.discountValue.setValue(20);
      component.form.controls.validFrom.setValue('2025-01-01');
      component.form.controls.validUntil.setValue('2025-12-31');

      component.onSubmit();

      expect(mockDiscountService.createDiscount).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Popust',
          discountType: DiscountType.PERCENT,
          discountValue: 20,
          imageUrl: 'https://example.com/img.jpg',
        }),
      );
    });

    it('should set error on createDiscount failure', () => {
      mockDiscountService.createDiscount.mockReturnValue(
        throwError(() => ({ error: { message: 'Greška' } })),
      );

      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('https://example.com/img.jpg');
      component.form.controls.title.setValue('Test Popust');
      component.form.controls.discountValue.setValue(20);
      component.form.controls.validFrom.setValue('2025-01-01');
      component.form.controls.validUntil.setValue('2025-12-31');

      component.onSubmit();

      expect(component.error()).toBe('Greška');
      expect(component.loading()).toBe(false);
    });

    it('BOGO: should send discountValue=1 regardless of form value', () => {
      const mockDiscount = { id: 'disc-1' };
      mockDiscountService.createDiscount.mockReturnValue(of(mockDiscount));
      mockDiscountService.updateStatus.mockReturnValue(of({ id: 'disc-1', status: 'ACTIVE' }));

      const { component } = createComponent();

      component.form.controls.discountType.setValue(DiscountType.BOGO);
      component.onDiscountTypeChange();
      component.form.controls.imageUrl.setValue('https://example.com/img.jpg');
      component.form.controls.title.setValue('BOGO Popust');
      component.form.controls.validFrom.setValue('2025-01-01');
      component.form.controls.validUntil.setValue('2025-12-31');

      component.onSubmit();

      expect(mockDiscountService.createDiscount).toHaveBeenCalledWith(
        expect.objectContaining({ discountValue: 1 }),
      );
    });
  });
});
