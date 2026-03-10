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

    it('should have showAdvanced=false by default', () => {
      const { component } = createComponent();
      expect(component.showAdvanced()).toBe(false);
    });

    it('should have validFrom set to today', () => {
      const { component } = createComponent();
      const today = new Date().toISOString().split('T')[0];
      expect(component.form.controls.validFrom.value).toBe(today);
    });

    it('should have validUntil set to today+30 days', () => {
      const { component } = createComponent();
      const plus30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      expect(component.form.controls.validUntil.value).toBe(plus30);
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

  describe('livePreviewLabel', () => {
    it('should return -X% for PERCENT with value', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.PERCENT);
      component.form.controls.discountValue.setValue(20);
      expect(component.livePreviewLabel()).toBe('-20%');
    });

    it('should return -?% for PERCENT with value 0', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.PERCENT);
      component.form.controls.discountValue.setValue(0);
      expect(component.livePreviewLabel()).toBe('-?%');
    });

    it('should return -X RSD for FIXED with value', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.FIXED);
      component.form.controls.discountValue.setValue(500);
      expect(component.livePreviewLabel()).toBe('-500 RSD');
    });

    it('should return nova cena for NEW_PRICE without newPrice', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.NEW_PRICE);
      component.form.controls.newPrice.setValue(null);
      expect(component.livePreviewLabel()).toBe('Nova cena');
    });

    it('should return X RSD for NEW_PRICE with newPrice set', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.NEW_PRICE);
      component.form.controls.newPrice.setValue(1500);
      expect(component.livePreviewLabel()).toBe('1500 RSD');
    });

    it('should return 1+1 for BOGO', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      expect(component.livePreviewLabel()).toBe('1+1');
    });
  });

  describe('titleLength and descLength', () => {
    it('should reflect title length', () => {
      const { component } = createComponent();
      component.form.controls.title.setValue('Kafa');
      expect(component.titleLength()).toBe(4);
    });

    it('should reflect description length', () => {
      const { component } = createComponent();
      component.form.controls.description.setValue('Opis popusta');
      expect(component.descLength()).toBe(12);
    });
  });

  describe('selectDiscountType', () => {
    it('should set discountType and call onDiscountTypeChange', () => {
      const { component } = createComponent();
      component.selectDiscountType(DiscountType.BOGO);
      expect(component.form.controls.discountType.value).toBe(DiscountType.BOGO);
      // BOGO clears discountValue validators → value 1
      expect(component.form.controls.discountValue.value).toBe(1);
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

    it('NEW_PRICE: should set oldPrice and newPrice validators', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.NEW_PRICE);
      component.onDiscountTypeChange();

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

  describe('reviewDaysLabel', () => {
    it('returns "Svakog dana" for all 7 days', () => {
      const { component } = createComponent();
      expect(component.reviewDaysLabel).toBe('Svakog dana');
    });

    it('returns "Pon – Pet" for weekdays only', () => {
      const { component } = createComponent();
      component.form.controls.daysOfWeek.setValue([1, 2, 3, 4, 5]);
      expect(component.reviewDaysLabel).toBe('Pon – Pet');
    });

    it('returns "Vikend" for Sat+Sun', () => {
      const { component } = createComponent();
      component.form.controls.daysOfWeek.setValue([6, 7]);
      expect(component.reviewDaysLabel).toBe('Vikend');
    });

    it('returns named days for partial selection', () => {
      const { component } = createComponent();
      component.form.controls.daysOfWeek.setValue([1, 3, 5]);
      expect(component.reviewDaysLabel).toBe('Pon, Sre, Pet');
    });
  });

  describe('reviewTimeLabel', () => {
    it('returns "Ceo dan" when no times set', () => {
      const { component } = createComponent();
      expect(component.reviewTimeLabel).toBe('Ceo dan');
    });

    it('returns formatted range when both times set', () => {
      const { component } = createComponent();
      component.form.controls.timeStart.setValue('09:00');
      component.form.controls.timeEnd.setValue('17:00');
      expect(component.reviewTimeLabel).toBe('09:00 – 17:00');
    });
  });

  describe('reviewCouponDurationLabel', () => {
    it('returns 1 sat for value 1', () => {
      const { component } = createComponent();
      component.form.controls.couponDuration.setValue(1);
      expect(component.reviewCouponDurationLabel).toBe('1 sat');
    });

    it('returns 24 sata for value 24 (default)', () => {
      const { component } = createComponent();
      expect(component.reviewCouponDurationLabel).toBe('24 sata');
    });

    it('returns 7 dana for value 168', () => {
      const { component } = createComponent();
      component.form.controls.couponDuration.setValue(168);
      expect(component.reviewCouponDurationLabel).toBe('7 dana');
    });
  });

  describe('reviewTagsList', () => {
    it('returns empty array when tags empty', () => {
      const { component } = createComponent();
      expect(component.reviewTagsList).toEqual([]);
    });

    it('returns trimmed tags array', () => {
      const { component } = createComponent();
      component.form.controls.tags.setValue(' pizza , ručak , popust ');
      expect(component.reviewTagsList).toEqual(['pizza', 'ručak', 'popust']);
    });
  });

  describe('Step navigation', () => {
    it('next() should not advance if current step is invalid', () => {
      const { component } = createComponent();
      // Step 0 requires imageUrl and title
      component.form.controls.imageUrl.setValue('');
      component.form.controls.title.setValue('');
      component.next();
      expect(component.currentStep()).toBe(0);
    });

    it('next() should advance when step 0 is valid', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('pending');
      component.form.controls.title.setValue('Test popust');
      component.next();
      expect(component.currentStep()).toBe(1);
    });

    it('next() should mark step fields as touched when invalid', () => {
      const { component } = createComponent();
      component.next(); // step 0 invalid (no image, no title)
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
      component.form.controls.title.setValue('Test');
      component.next(); // → step 1
      component.prev(); // → step 0
      expect(component.currentStep()).toBe(0);
    });

    it('goToStep() should navigate to earlier step', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('pending');
      component.form.controls.title.setValue('Test');
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
      component.form.controls.imageUrl.setValue('');
      expect(component.isStepValid(0)).toBe(false);
    });

    it('should return false for step 0 when title is empty', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('pending');
      component.form.controls.title.setValue('');
      expect(component.isStepValid(0)).toBe(false);
    });

    it('should return true for step 0 when imageUrl and title are set', () => {
      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('pending');
      component.form.controls.title.setValue('Test');
      expect(component.isStepValid(0)).toBe(true);
    });

    it('should return false for step 1 when discountValue is 0 (PERCENT)', () => {
      const { component } = createComponent();
      component.form.controls.discountValue.setValue(0);
      expect(component.isStepValid(1)).toBe(false);
    });

    it('should return true for step 1 when discountValue is set (PERCENT)', () => {
      const { component } = createComponent();
      component.form.controls.discountValue.setValue(20);
      expect(component.isStepValid(1)).toBe(true);
    });

    it('should return true for step 2 when dates are set', () => {
      const { component } = createComponent();
      // validFrom and validUntil already defaulted
      expect(component.isStepValid(2)).toBe(true);
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
      component.form.controls.imageUrl.setValue('');
      component.onSubmit();
      expect(component.currentStep()).toBe(0);
      expect(component.error()).toContain('Osnove');
    });

    it('should call createDiscount without upload when no pendingImage', () => {
      const mockDiscount = { id: 'disc-1' };
      mockDiscountService.createDiscount.mockReturnValue(of(mockDiscount));
      mockDiscountService.updateStatus.mockReturnValue(of({ id: 'disc-1', status: 'ACTIVE' }));

      const { component } = createComponent();

      component.form.controls.imageUrl.setValue('https://example.com/img.jpg');
      component.form.controls.title.setValue('Test Popust');
      component.form.controls.discountValue.setValue(20);

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

      component.onSubmit();

      expect(mockDiscountService.createDiscount).toHaveBeenCalledWith(
        expect.objectContaining({ discountValue: 1 }),
      );
    });

    it('should include minPurchase and unlimitedCoupons in payload', () => {
      const mockDiscount = { id: 'disc-1' };
      mockDiscountService.createDiscount.mockReturnValue(of(mockDiscount));
      mockDiscountService.updateStatus.mockReturnValue(of({ id: 'disc-1', status: 'ACTIVE' }));

      const { component } = createComponent();

      component.form.controls.imageUrl.setValue('https://example.com/img.jpg');
      component.form.controls.title.setValue('Test Popust');
      component.form.controls.discountValue.setValue(20);
      component.form.controls.hasCoupons.setValue(true);
      component.form.controls.unlimitedCoupons.setValue(true);
      component.form.controls.minPurchase.setValue(1000);

      component.onSubmit();

      expect(mockDiscountService.createDiscount).toHaveBeenCalledWith(
        expect.objectContaining({
          validity: expect.objectContaining({ minPurchase: 1000 }),
          couponSettings: expect.objectContaining({ hasCoupons: true, totalCoupons: undefined }),
        }),
      );
    });

    it('should set error 403 when subscription expired', () => {
      mockDiscountService.createDiscount.mockReturnValue(
        throwError(() => ({ status: 403 })),
      );

      const { component } = createComponent();
      component.form.controls.imageUrl.setValue('https://example.com/img.jpg');
      component.form.controls.title.setValue('Test Popust');
      component.form.controls.discountValue.setValue(20);

      component.onSubmit();

      expect(component.error()).toContain('Pretplata');
    });

    it('should call uploadService and then createDiscount when pendingImage is set', () => {
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:preview');

      mockUploadService.getPresignedUrl.mockReturnValue(
        of({ uploadUrl: 'https://s3.upload', fileUrl: 'https://cdn.example.com/img.jpg' }),
      );
      mockUploadService.uploadToS3.mockReturnValue(of(null));
      const mockDiscount = { id: 'disc-1' };
      mockDiscountService.createDiscount.mockReturnValue(of(mockDiscount));
      mockDiscountService.updateStatus.mockReturnValue(of({ id: 'disc-1', status: 'ACTIVE' }));

      const { component } = createComponent();

      const pending: PendingImageBlob = {
        blob: new Blob(['img'], { type: 'image/webp' }),
        contentType: 'image/webp',
        filename: 'photo.webp',
      };
      component.onPendingImage(pending);
      component.form.controls.title.setValue('Upload Popust');
      component.form.controls.discountValue.setValue(10);

      component.onSubmit();

      expect(mockUploadService.getPresignedUrl).toHaveBeenCalledWith('discounts', 'image/webp', 'photo.webp');
      expect(mockUploadService.uploadToS3).toHaveBeenCalled();
      expect(mockDiscountService.createDiscount).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrl: 'https://cdn.example.com/img.jpg' }),
      );
    });
  });
});
