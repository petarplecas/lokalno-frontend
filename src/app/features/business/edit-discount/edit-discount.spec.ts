import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EditDiscount } from './edit-discount';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { UploadService } from '../../../core/services/upload.service';
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
    ...overrides,
  };
}

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
  const mockUploadService = {
    getPresignedUrl: jest.fn(),
    uploadToS3: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDiscountService.getDiscount.mockReturnValue(of(makeDiscount()));

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
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  function createComponent(discount = makeDiscount()) {
    mockDiscountService.getDiscount.mockReturnValue(of(discount));
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

    it('should populate daysOfWeek as array', () => {
      const { component } = createComponent();
      expect(component.form.controls.daysOfWeek.value).toEqual([1, 2, 3, 4, 5]);
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
      const fixture = TestBed.createComponent(EditDiscount);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      expect(component.error()).toBe('Popust nije pronađen');
      expect(component.loading()).toBe(false);
    });

    it('should set showAdvanced=true when daysOfWeek has fewer than 7 days', () => {
      const { component } = createComponent(makeDiscount({ daysOfWeek: [1, 2, 3, 4, 5] }));
      expect(component.showAdvanced()).toBe(true);
    });

    it('should set showAdvanced=false when daysOfWeek has all 7 days', () => {
      const { component } = createComponent(makeDiscount({ daysOfWeek: [1, 2, 3, 4, 5, 6, 7] }));
      expect(component.showAdvanced()).toBe(false);
    });

    it('should set showAdvanced=true when timeStart is set', () => {
      const { component } = createComponent(makeDiscount({ daysOfWeek: [1,2,3,4,5,6,7], timeStart: '09:00' }));
      expect(component.showAdvanced()).toBe(true);
    });

    it('should detect unlimitedCoupons=true when hasCoupons=true and totalCoupons=null', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: null }));
      expect(component.form.controls.unlimitedCoupons.value).toBe(true);
    });

    it('should set unlimitedCoupons=false when totalCoupons is set', () => {
      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: 50 }));
      expect(component.form.controls.unlimitedCoupons.value).toBe(false);
    });

    it('should populate minPurchase from discount data', () => {
      const { component } = createComponent(makeDiscount({ minPurchase: 1000 }));
      expect(component.form.controls.minPurchase.value).toBe(1000);
    });

    it('should set minPurchase=null when not provided', () => {
      const { component } = createComponent(makeDiscount({ minPurchase: null }));
      expect(component.form.controls.minPurchase.value).toBeNull();
    });
  });

  describe('populateForm — image tracking', () => {
    it('should populate templateStyle from discount', () => {
      const { component } = createComponent(makeDiscount({ templateStyle: 'template-1', imageUrl: null }));
      expect(component.form.controls.templateStyle.value).toBe('template-1');
    });

    it('should set templateStyle=null when discount has no template', () => {
      const { component } = createComponent(makeDiscount({ templateStyle: null }));
      expect(component.form.controls.templateStyle.value).toBeNull();
    });

    it('should store originalImageUrl from loaded discount (accessible via onConfirmDelete)', () => {
      // We verify this indirectly: onConfirmDelete uses originalImageUrl for S3 cleanup
      mockDiscountService.deleteDiscount.mockReturnValue(of({ message: 'deleted' }));
      mockUploadService.deleteFile.mockReturnValue(of(null));

      const { component } = createComponent(makeDiscount({ imageUrl: 'https://example.com/img.jpg' }));
      component.onConfirmDelete();

      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('https://example.com/img.jpg');
    });
  });

  describe('livePreviewLabel', () => {
    it('PERCENT with value → -20%', () => {
      const { component } = createComponent();
      // default discount is PERCENT with value 20
      expect(component.livePreviewLabel()).toBe('-20%');
    });

    it('PERCENT with value 0 → -?%', () => {
      const { component } = createComponent();
      component.form.controls.discountValue.setValue(0);
      expect(component.livePreviewLabel()).toBe('-?%');
    });

    it('FIXED → -500 RSD', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.FIXED);
      component.form.controls.discountValue.setValue(500);
      expect(component.livePreviewLabel()).toBe('-500 RSD');
    });

    it('BOGO → 1+1', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      expect(component.livePreviewLabel()).toBe('1+1');
    });

    it('NEW_PRICE with newPrice → 1500 RSD', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.NEW_PRICE);
      component.form.controls.newPrice.setValue(1500);
      expect(component.livePreviewLabel()).toBe('1500 RSD');
    });

    it('NEW_PRICE without newPrice → Nova cena', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.NEW_PRICE);
      component.form.controls.newPrice.setValue(null);
      expect(component.livePreviewLabel()).toBe('Nova cena');
    });
  });

  describe('titleLength and descLength', () => {
    it('should reflect title length', () => {
      const { component } = createComponent();
      // title is populated from discount: 'Test Popust' = 11 chars
      expect(component.titleLength()).toBe(11);
    });

    it('should update when title changes', () => {
      const { component } = createComponent();
      component.form.controls.title.setValue('Kafa');
      expect(component.titleLength()).toBe(4);
    });

    it('should reflect description length', () => {
      const { component } = createComponent();
      // description is 'Opis' = 4 chars
      expect(component.descLength()).toBe(4);
    });
  });

  describe('selectDiscountType', () => {
    it('should set discountType and trigger onDiscountTypeChange effects', () => {
      const { component } = createComponent();
      component.selectDiscountType(DiscountType.BOGO);
      expect(component.form.controls.discountType.value).toBe(DiscountType.BOGO);
      // BOGO clears validators → discountValue should be 1
      expect(component.form.controls.discountValue.value).toBe(1);
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
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      component.onDiscountTypeChange();
      component.form.controls.discountType.setValue(DiscountType.PERCENT);
      component.onDiscountTypeChange();

      component.form.controls.discountValue.setValue(0);
      expect(component.form.controls.discountValue.valid).toBe(false);

      component.form.controls.discountValue.setValue(10);
      expect(component.form.controls.discountValue.valid).toBe(true);
    });

    it('NEW_PRICE: should set oldPrice and newPrice as required', () => {
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
      component.form.controls.oldPrice.setValue(2000);
      component.form.controls.newPrice.setValue(1500);
      expect(component.form.controls.oldPrice.valid).toBe(true);
      expect(component.form.controls.newPrice.valid).toBe(true);
    });

    it('FIXED: should set discountValue validators', () => {
      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.FIXED);
      component.onDiscountTypeChange();

      component.form.controls.discountValue.setValue(0);
      expect(component.form.controls.discountValue.valid).toBe(false);

      component.form.controls.discountValue.setValue(500);
      expect(component.form.controls.discountValue.valid).toBe(true);
    });
  });

  describe('reviewDaysLabel', () => {
    it('returns "Svakog dana" for all 7 days', () => {
      const { component } = createComponent(makeDiscount({ daysOfWeek: [1,2,3,4,5,6,7] }));
      expect(component.reviewDaysLabel).toBe('Svakog dana');
    });

    it('returns "Pon – Pet" for weekdays only', () => {
      const { component } = createComponent();
      // default is [1,2,3,4,5]
      expect(component.reviewDaysLabel).toBe('Pon – Pet');
    });

    it('returns "Vikend" for Sat+Sun', () => {
      const { component } = createComponent(makeDiscount({ daysOfWeek: [6, 7] }));
      expect(component.reviewDaysLabel).toBe('Vikend');
    });

    it('returns named days for partial selection', () => {
      const { component } = createComponent(makeDiscount({ daysOfWeek: [1, 3, 5] }));
      expect(component.reviewDaysLabel).toBe('Pon, Sre, Pet');
    });
  });

  describe('reviewTimeLabel', () => {
    it('returns "Ceo dan" when no times set', () => {
      const { component } = createComponent(makeDiscount({ timeStart: null, timeEnd: null }));
      expect(component.reviewTimeLabel).toBe('Ceo dan');
    });

    it('returns formatted range when both times are set', () => {
      const { component } = createComponent(makeDiscount({ timeStart: '09:00', timeEnd: '17:00' }));
      expect(component.reviewTimeLabel).toBe('09:00 – 17:00');
    });
  });

  describe('reviewCouponDurationLabel', () => {
    it('returns "1 sat" for couponDuration=1', () => {
      const { component } = createComponent();
      component.form.controls.couponDuration.setValue(1);
      expect(component.reviewCouponDurationLabel).toBe('1 sat');
    });

    it('returns "24 sata" for couponDuration=24 (default)', () => {
      const { component } = createComponent();
      component.form.controls.couponDuration.setValue(24);
      expect(component.reviewCouponDurationLabel).toBe('24 sata');
    });

    it('returns "7 dana" for couponDuration=168', () => {
      const { component } = createComponent();
      component.form.controls.couponDuration.setValue(168);
      expect(component.reviewCouponDurationLabel).toBe('7 dana');
    });
  });

  describe('reviewTagsList', () => {
    it('returns empty array when tags are empty', () => {
      const { component } = createComponent(makeDiscount({ tags: [] }));
      expect(component.reviewTagsList).toEqual([]);
    });

    it('returns trimmed tags array from joined string', () => {
      const { component } = createComponent(makeDiscount({ tags: ['hrana', 'restoran'] }));
      expect(component.reviewTagsList).toEqual(['hrana', 'restoran']);
    });
  });

  describe('onPendingImage', () => {
    it('should set imageUrl="pending" and clear templateStyle when blob provided', () => {
      const { component } = createComponent(makeDiscount({ templateStyle: 'tmpl-1' }));
      const blob = new Blob(['img'], { type: 'image/webp' });
      component.onPendingImage({ blob, filename: 'test.webp', contentType: 'image/webp' });
      expect(component.form.controls.imageUrl.value).toBe('pending');
      expect(component.form.controls.templateStyle.value).toBeNull();
    });

    it('should clear imageUrl when null is passed', () => {
      const { component } = createComponent();
      component.onPendingImage(null);
      expect(component.form.controls.imageUrl.value).toBe('');
    });
  });

  describe('onTemplateSelected', () => {
    it('should set templateStyle and clear imageUrl when templateId provided', () => {
      const { component } = createComponent();
      component.onTemplateSelected('template-blue');
      expect(component.form.controls.templateStyle.value).toBe('template-blue');
      expect(component.form.controls.imageUrl.value).toBe('');
    });

    it('should not clear imageUrl when null templateId passed', () => {
      const { component } = createComponent();
      // imageUrl was set from discount
      component.onTemplateSelected(null);
      expect(component.form.controls.templateStyle.value).toBeNull();
      // imageUrl should remain unchanged (not cleared when no template selected)
      expect(component.form.controls.imageUrl.value).toBe('https://example.com/img.jpg');
    });
  });

  describe('isStepValid — step 0 with image/template', () => {
    it('should be valid when imageUrl is set', () => {
      const { component } = createComponent(makeDiscount({ imageUrl: 'https://example.com/img.jpg', templateStyle: null }));
      expect(component.isStepValid(0)).toBe(true);
    });

    it('should be valid when templateStyle is set and imageUrl is empty', () => {
      const { component } = createComponent(makeDiscount({ imageUrl: null, templateStyle: 'template-1' }));
      expect(component.isStepValid(0)).toBe(true);
    });

    it('should be invalid when both imageUrl and templateStyle are empty/null', () => {
      const { component } = createComponent(makeDiscount({ imageUrl: null, templateStyle: null }));
      // Force clear both
      component.form.controls.imageUrl.setValue('');
      component.form.controls.templateStyle.setValue(null);
      expect(component.isStepValid(0)).toBe(false);
    });
  });

  describe('Step navigation', () => {
    it('should start on step 0', () => {
      const { component } = createComponent();
      expect(component.currentStep()).toBe(0);
    });

    it('next() should advance when step is valid', () => {
      const { component } = createComponent();
      // Step 0 (title + imageUrl) is already populated from populateForm
      component.next();
      expect(component.currentStep()).toBe(1);
    });

    it('next() should not advance when step is invalid — both image and template missing', () => {
      const { component } = createComponent(makeDiscount({ imageUrl: null, templateStyle: null }));
      component.form.controls.imageUrl.setValue('');
      component.form.controls.templateStyle.setValue(null);
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
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

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

    it('should send daysOfWeek as array in payload', () => {
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

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
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

      const { component } = createComponent();
      component.form.controls.discountType.setValue(DiscountType.BOGO);
      component.onDiscountTypeChange();
      component.onSubmit();

      expect(mockDiscountService.updateDiscount).toHaveBeenCalledWith(
        'disc-1',
        expect.objectContaining({ discountValue: 1 }),
      );
    });

    it('should include minPurchase when set', () => {
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

      const { component } = createComponent(makeDiscount({ minPurchase: 500 }));
      component.onSubmit();

      expect(mockDiscountService.updateDiscount).toHaveBeenCalledWith(
        'disc-1',
        expect.objectContaining({
          validity: expect.objectContaining({ minPurchase: 500 }),
        }),
      );
    });

    it('unlimitedCoupons=true should send totalCoupons=undefined', () => {
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

      const { component } = createComponent(makeDiscount({ hasCoupons: true, totalCoupons: null }));
      // unlimitedCoupons is auto-detected as true
      component.onSubmit();

      expect(mockDiscountService.updateDiscount).toHaveBeenCalledWith(
        'disc-1',
        expect.objectContaining({
          couponSettings: expect.objectContaining({ hasCoupons: true, totalCoupons: undefined }),
        }),
      );
    });

    it('should show success toast and navigate on success', () => {
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

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

    it('should navigate to invalid step if form is incomplete — both image and template missing', () => {
      const { component } = createComponent(makeDiscount({ imageUrl: null, templateStyle: null }));
      component.form.controls.imageUrl.setValue('');
      component.form.controls.templateStyle.setValue(null);
      component.onSubmit();
      expect(component.currentStep()).toBe(0);
      expect(component.error()).toContain('Osnove');
    });
  });

  describe('onSubmit — with pending image', () => {
    it('should call getPresignedUrl + uploadToS3 then saveDiscount when pendingImage is set', () => {
      mockUploadService.getPresignedUrl.mockReturnValue(
        of({ uploadUrl: 'https://s3.signed/upload', fileUrl: 'https://s3.bucket/new-img.webp' }),
      );
      mockUploadService.uploadToS3.mockReturnValue(of(null));
      mockUploadService.deleteFile.mockReturnValue(of(null));
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

      const { component } = createComponent();
      const blob = new Blob(['img'], { type: 'image/webp' });
      component.onPendingImage({ blob, filename: 'new.webp', contentType: 'image/webp' });
      component.onSubmit();

      expect(mockUploadService.getPresignedUrl).toHaveBeenCalledWith('discounts', 'image/webp', 'new.webp');
      expect(mockUploadService.uploadToS3).toHaveBeenCalledWith(
        'https://s3.signed/upload',
        blob,
        'image/webp',
      );
      expect(mockDiscountService.updateDiscount).toHaveBeenCalledWith(
        'disc-1',
        expect.objectContaining({ imageUrl: 'https://s3.bucket/new-img.webp' }),
      );
    });

    it('should call deleteFile(originalImageUrl) fire-and-forget after successful upload', () => {
      mockUploadService.getPresignedUrl.mockReturnValue(
        of({ uploadUrl: 'https://s3/upload', fileUrl: 'https://s3/new.webp' }),
      );
      mockUploadService.uploadToS3.mockReturnValue(of(null));
      mockUploadService.deleteFile.mockReturnValue(of(null));
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

      const { component } = createComponent(makeDiscount({ imageUrl: 'https://example.com/old-img.jpg' }));
      const blob = new Blob(['img'], { type: 'image/webp' });
      component.onPendingImage({ blob, filename: 'new.webp', contentType: 'image/webp' });
      component.onSubmit();

      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('https://example.com/old-img.jpg');
    });

    it('should NOT call deleteFile if originalImageUrl is null', () => {
      mockUploadService.getPresignedUrl.mockReturnValue(
        of({ uploadUrl: 'https://s3/upload', fileUrl: 'https://s3/new.webp' }),
      );
      mockUploadService.uploadToS3.mockReturnValue(of(null));
      mockUploadService.deleteFile.mockReturnValue(of(null));
      mockDiscountService.updateDiscount.mockReturnValue(of(makeDiscount()));

      const { component } = createComponent(makeDiscount({ imageUrl: null }));
      const blob = new Blob(['img'], { type: 'image/webp' });
      component.onPendingImage({ blob, filename: 'new.webp', contentType: 'image/webp' });
      component.onSubmit();

      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });

    it('should set error and saving=false on upload failure', () => {
      mockUploadService.getPresignedUrl.mockReturnValue(
        throwError(() => new Error('Upload failed')),
      );

      const { component } = createComponent();
      const blob = new Blob(['img'], { type: 'image/webp' });
      component.onPendingImage({ blob, filename: 'new.webp', contentType: 'image/webp' });
      component.onSubmit();

      expect(component.saving()).toBe(false);
      expect(component.error()).toContain('Upload slike nije uspeo');
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
      mockUploadService.deleteFile.mockReturnValue(of(null));

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

  describe('onConfirmDelete — S3 cleanup', () => {
    it('should call deleteFile(originalImageUrl) after successful delete', () => {
      mockDiscountService.deleteDiscount.mockReturnValue(of({ message: 'deleted' }));
      mockUploadService.deleteFile.mockReturnValue(of(null));

      const { component } = createComponent(makeDiscount({ imageUrl: 'https://example.com/img.jpg' }));
      component.onConfirmDelete();

      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('https://example.com/img.jpg');
    });

    it('should NOT call deleteFile if originalImageUrl is null', () => {
      mockDiscountService.deleteDiscount.mockReturnValue(of({ message: 'deleted' }));
      mockUploadService.deleteFile.mockReturnValue(of(null));

      const { component } = createComponent(makeDiscount({ imageUrl: null }));
      component.onConfirmDelete();

      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });

    it('should navigate on success even without image', () => {
      mockDiscountService.deleteDiscount.mockReturnValue(of({ message: 'deleted' }));

      const { component, router } = createComponent(makeDiscount({ imageUrl: null }));
      component.onConfirmDelete();

      expect(router.navigate).toHaveBeenCalledWith(['/business/dashboard']);
    });
  });
});
