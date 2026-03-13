import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { DiscountService } from '../../../core/services/discount.service';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { DiscountType, Discount } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ImageUpload, PendingImageBlob } from '../../../shared/components/image-upload/image-upload';

// Steps: 0=Osnove, 1=Vrednost, 2=Raspored, 3=Kuponi, 4=Pregled
const STEP_COUNT = 5;

@Component({
  selector: 'app-edit-discount',
  imports: [ReactiveFormsModule, RouterLink, Spinner, PageHeader, ConfirmDialog, ImageUpload],
  templateUrl: './edit-discount.html',
  styleUrl: '../create-discount/create-discount.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDiscount implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly discountService = inject(DiscountService);
  private readonly uploadService = inject(UploadService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly DiscountType = DiscountType;
  readonly currentStep = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showDeleteDialog = signal(false);
  readonly deleting = signal(false);
  readonly showAdvanced = signal(false);

  private readonly pendingImage = signal<PendingImageBlob | null>(null);
  private originalImageUrl: string | null = null;

  protected discountId = '';

  readonly steps = ['Osnove', 'Vrednost', 'Raspored', 'Kuponi', 'Pregled'];

  readonly discountTypeInfo: Record<DiscountType, { badge: string; name: string; desc: string; cssClass: string }> = {
    [DiscountType.PERCENT]:   { badge: '-X%',    name: 'Procenat',     desc: 'Kupac plaća X% manje od redovne cene',   cssClass: 'percent' },
    [DiscountType.FIXED]:     { badge: '-X RSD',  name: 'Fiksni iznos', desc: 'Oduzima se tačan iznos u dinarima',      cssClass: 'fixed' },
    [DiscountType.NEW_PRICE]: { badge: 'X RSD',   name: 'Nova cena',    desc: 'Cena je uvek ista, bez obzira na staru', cssClass: 'new-price' },
    [DiscountType.BOGO]:      { badge: '1+1',     name: '1+1 Gratis',   desc: 'Drugi artikl iste vrste ide gratis',     cssClass: 'bogo' },
  };

  readonly allDiscountTypes = Object.values(DiscountType);

  readonly allDays = [
    { value: 1, label: 'Pon' }, { value: 2, label: 'Uto' }, { value: 3, label: 'Sre' },
    { value: 4, label: 'Čet' }, { value: 5, label: 'Pet' }, { value: 6, label: 'Sub' },
    { value: 7, label: 'Ned' },
  ];

  readonly couponDurationOptions = [
    { value: 1,   label: '1',  unit: 'sat' },
    { value: 24,  label: '24', unit: 'sata' },
    { value: 168, label: '7',  unit: 'dana' },
  ];

  readonly form = this.fb.nonNullable.group({
    imageUrl:         [''],
    templateStyle:    [null as string | null],
    title:            ['', [Validators.required, Validators.maxLength(40)]],
    description:      ['', [Validators.maxLength(200)]],
    discountType:     ['PERCENT' as DiscountType, [Validators.required]],
    discountValue:    [null as number | null],
    oldPrice:         [null as number | null],
    newPrice:         [null as number | null],
    validFrom:        ['', [Validators.required]],
    validUntil:       ['', [Validators.required]],
    daysOfWeek:       [[1, 2, 3, 4, 5, 6, 7]],
    timeStart:        [''],
    timeEnd:          [''],
    minPurchase:      [null as number | null],
    hasCoupons:       [false],
    totalCoupons:     [null as number | null],
    unlimitedCoupons: [false],
    couponDuration:   [24],
    tags:             [''],
  });

  private readonly stepFields: string[][] = [
    ['title'],
    ['discountType', 'discountValue', 'oldPrice', 'newPrice'],
    ['validFrom', 'validUntil'],
    [],
    [],
  ];

  // ── Computed ─────────────────────────────────────────────
  readonly livePreviewLabel = computed(() => {
    const type = this.form.controls.discountType.value;
    const val  = this.form.controls.discountValue.value;
    const np   = this.form.controls.newPrice.value;
    switch (type) {
      case DiscountType.PERCENT:   return val && val > 0 ? `-${val}%` : '-?%';
      case DiscountType.FIXED:     return val && val > 0 ? `-${val} RSD` : '-? RSD';
      case DiscountType.NEW_PRICE: return np ? `${np} RSD` : 'Nova cena';
      case DiscountType.BOGO:      return '1+1';
    }
  });

  private readonly titleValue = toSignal(this.form.controls.title.valueChanges, { initialValue: this.form.controls.title.value });
  private readonly descValue  = toSignal(this.form.controls.description.valueChanges, { initialValue: this.form.controls.description.value });
  readonly titleLength = computed(() => this.titleValue().length);
  readonly descLength  = computed(() => this.descValue().length);

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly computedNewPrice = computed(() => {
    const v = this.formValue();
    const old = v.oldPrice;
    const val = v.discountValue;
    const type = v.discountType;
    if (!old || old <= 0) return null;
    if (type === DiscountType.PERCENT && val && val > 0) return Math.round(old * (1 - val / 100));
    if (type === DiscountType.FIXED && val && val > 0) {
      const result = old - val;
      return result > 0 ? result : null;
    }
    return null;
  });

  ngOnInit(): void {
    this.discountId = this.route.snapshot.params['id'];
    this.discountService.getDiscount(this.discountId).subscribe({
      next: (d) => this.populateForm(d),
      error: () => {
        this.loading.set(false);
        this.error.set('Popust nije pronađen');
      },
    });
  }

  private populateForm(d: Discount): void {
    const daysArray = Array.isArray(d.daysOfWeek) ? d.daysOfWeek : [1, 2, 3, 4, 5, 6, 7];
    const hasCustomDays = daysArray.length < 7;
    const hasTime = !!d.timeStart || !!d.timeEnd;
    if (hasCustomDays || hasTime || d.minPurchase) {
      this.showAdvanced.set(true);
    }

    // Detect unlimited coupons
    const isUnlimited = d.hasCoupons && !d.totalCoupons;

    // Map coupon duration (minutes in legacy) to hours
    const durationHours = d.couponDuration
      ? Math.round(d.couponDuration / 60) || 24
      : 24;
    const matchedDuration = this.couponDurationOptions.find(o => o.value === durationHours);
    const couponDuration = matchedDuration ? durationHours : 24;

    this.originalImageUrl = d.imageUrl ?? null;

    this.form.patchValue({
      imageUrl: d.imageUrl,
      templateStyle: d.templateStyle ?? null,
      title: d.title,
      description: d.description ?? '',
      discountType: d.discountType,
      discountValue: d.discountValue,
      oldPrice: d.oldPrice ?? null,
      newPrice: d.newPrice ?? null,
      validFrom: d.validFrom.split('T')[0],
      validUntil: d.validUntil.split('T')[0],
      daysOfWeek: daysArray,
      timeStart: d.timeStart ?? '',
      timeEnd: d.timeEnd ?? '',
      minPurchase: d.minPurchase ?? null,
      hasCoupons: d.hasCoupons,
      totalCoupons: d.totalCoupons ?? null,
      unlimitedCoupons: isUnlimited,
      couponDuration,
      tags: d.tags?.join(', ') ?? '',
    });

    this.onDiscountTypeChange();
    this.loading.set(false);
  }

  // ── Image & Template ──────────────────────────────────────
  onPendingImage(data: PendingImageBlob | null): void {
    this.pendingImage.set(data);
    if (data) {
      this.form.controls.imageUrl.setValue('pending');
      this.form.controls.templateStyle.setValue(null);
    } else {
      this.form.controls.imageUrl.setValue('');
    }
  }

  onTemplateSelected(templateId: string | null): void {
    this.form.controls.templateStyle.setValue(templateId);
    if (templateId) {
      this.form.controls.imageUrl.setValue('');
      this.pendingImage.set(null);
    }
  }

  // ── Days helpers ─────────────────────────────────────────
  isDaySelected(day: number): boolean {
    return (this.form.controls.daysOfWeek.value as number[]).includes(day);
  }

  toggleDay(day: number): void {
    const current = this.form.controls.daysOfWeek.value as number[];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    this.form.controls.daysOfWeek.setValue(updated);
  }

  // ── Discount type ─────────────────────────────────────────
  selectDiscountType(type: DiscountType): void {
    this.form.controls.discountType.setValue(type);
    this.onDiscountTypeChange();
  }

  onDiscountTypeChange(): void {
    const type = this.form.controls.discountType.value;
    if (type === DiscountType.BOGO) {
      this.form.controls.discountValue.clearValidators();
      this.form.controls.discountValue.setValue(1);
      this.form.controls.oldPrice.clearValidators();
      this.form.controls.newPrice.clearValidators();
    } else if (type === DiscountType.NEW_PRICE) {
      this.form.controls.discountValue.clearValidators();
      this.form.controls.discountValue.setValue(0);
      this.form.controls.oldPrice.setValidators([Validators.required, Validators.min(1)]);
      this.form.controls.newPrice.setValidators([Validators.required, Validators.min(1)]);
    } else if (type === DiscountType.FIXED) {
      this.form.controls.discountValue.setValidators([Validators.required, Validators.min(1)]);
      this.form.controls.oldPrice.setValidators([Validators.required, Validators.min(1)]);
      this.form.controls.newPrice.clearValidators();
    } else {
      // PERCENT
      this.form.controls.discountValue.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      this.form.controls.oldPrice.clearValidators();
      this.form.controls.newPrice.clearValidators();
    }
    this.form.controls.discountValue.updateValueAndValidity();
    this.form.controls.oldPrice.updateValueAndValidity();
    this.form.controls.newPrice.updateValueAndValidity();
  }

  // ── Navigation ────────────────────────────────────────────
  isStepValid(step?: number): boolean {
    const s = step ?? this.currentStep();
    const fields = this.stepFields[s];
    const fieldsValid = fields.every((f) => this.form.get(f)?.valid ?? true);
    if (s === 0) {
      const hasImage = !!this.form.controls.imageUrl.value;
      const hasTemplate = !!this.form.controls.templateStyle.value;
      return fieldsValid && (hasImage || hasTemplate);
    }
    return fieldsValid;
  }

  next(): void {
    if (!this.isStepValid()) {
      this.stepFields[this.currentStep()].forEach((f) => this.form.get(f)?.markAsTouched());
      return;
    }
    if (this.currentStep() < STEP_COUNT - 1) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prev(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  private findFirstInvalidStep(): number | null {
    for (let i = 0; i < this.stepFields.length; i++) {
      if (!this.isStepValid(i)) {
        this.stepFields[i].forEach((f) => this.form.get(f)?.markAsTouched());
        return i;
      }
    }
    return null;
  }

  // ── Review helpers ────────────────────────────────────────
  get reviewDaysLabel(): string {
    const days = this.form.controls.daysOfWeek.value as number[];
    if (!days || days.length === 7 || days.length === 0) return 'Svakog dana';
    const names = ['', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];
    if (days.every((d) => [1, 2, 3, 4, 5].includes(d)) && days.length === 5) return 'Pon – Pet';
    if (days.every((d) => [6, 7].includes(d)) && days.length === 2) return 'Vikend';
    return days.map((d) => names[d]).join(', ');
  }

  get reviewTimeLabel(): string {
    const { timeStart, timeEnd } = this.form.value;
    if (!timeStart || !timeEnd) return 'Ceo dan';
    return `${timeStart} – ${timeEnd}`;
  }

  get reviewCouponDurationLabel(): string {
    const opt = this.couponDurationOptions.find((o) => o.value === this.form.controls.couponDuration.value);
    return opt ? `${opt.label} ${opt.unit}` : `${this.form.controls.couponDuration.value}h`;
  }

  get reviewTagsList(): string[] {
    const raw = this.form.controls.tags.value;
    return raw ? raw.split(',').map((t) => t.trim()).filter(Boolean) : [];
  }

  // ── Submit ────────────────────────────────────────────────
  onSubmit(): void {
    const invalidStep = this.findFirstInvalidStep();
    if (invalidStep !== null) {
      this.currentStep.set(invalidStep);
      this.error.set('Popunite obavezna polja na koraku ' + this.steps[invalidStep]);
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const pending = this.pendingImage();
    if (pending) {
      this.uploadService
        .getPresignedUrl('discounts', pending.contentType, pending.filename)
        .pipe(
          switchMap(({ uploadUrl, fileUrl }) =>
            this.uploadService
              .uploadToS3(uploadUrl, pending.blob, pending.contentType)
              .pipe(switchMap(() => [fileUrl])),
          ),
        )
        .subscribe({
          next: (fileUrl) => {
            this.form.controls.imageUrl.setValue(fileUrl);
            this.pendingImage.set(null);
            if (this.originalImageUrl) {
              this.uploadService.deleteFile(this.originalImageUrl).subscribe();
            }
            this.saveDiscount();
          },
          error: () => {
            this.saving.set(false);
            this.error.set('Upload slike nije uspeo. Pokušajte ponovo.');
          },
        });
    } else {
      this.saveDiscount();
    }
  }

  private saveDiscount(): void {
    const v = this.form.getRawValue();
    const daysOfWeek = (v.daysOfWeek as unknown as number[]).filter((d) => !isNaN(d));

    this.discountService
      .updateDiscount(this.discountId, {
        title: v.title,
        description: v.description || undefined,
        imageUrl: v.templateStyle ? undefined : (v.imageUrl || undefined),
        templateStyle: v.templateStyle ?? undefined,
        discountType: v.discountType,
        discountValue: v.discountType === DiscountType.BOGO ? 1 : (v.discountType === DiscountType.NEW_PRICE ? 0 : (v.discountValue ?? 0)),
        oldPrice: v.oldPrice ?? undefined,
        newPrice: v.discountType === DiscountType.NEW_PRICE ? (v.newPrice ?? undefined) : undefined,
        validity: {
          validFrom: v.validFrom,
          validUntil: v.validUntil,
          daysOfWeek,
          timeStart: v.timeStart || undefined,
          timeEnd: v.timeEnd || undefined,
          minPurchase: v.minPurchase ?? undefined,
        },
        couponSettings: v.hasCoupons
          ? {
              hasCoupons: true,
              totalCoupons: v.unlimitedCoupons ? undefined : (v.totalCoupons ?? undefined),
              couponDuration: v.couponDuration,
            }
          : { hasCoupons: false },
        tags: v.tags ? v.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.success('Popust je ažuriran!');
          void this.router.navigate(['/business/dashboard']);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'Ažuriranje nije uspelo');
        },
      });
  }

  onDelete(): void {
    this.showDeleteDialog.set(true);
  }

  onConfirmDelete(): void {
    this.deleting.set(true);
    const imageUrl = this.originalImageUrl;

    this.discountService.deleteDiscount(this.discountId).subscribe({
      next: () => {
        if (imageUrl) {
          this.uploadService.deleteFile(imageUrl).subscribe();
        }
        this.toastService.success('Popust je obrisan');
        void this.router.navigate(['/business/dashboard']);
      },
      error: (err) => {
        this.deleting.set(false);
        this.showDeleteDialog.set(false);
        this.error.set(err.error?.message || 'Brisanje nije uspelo');
      },
    });
  }

  onCancelDelete(): void {
    this.showDeleteDialog.set(false);
  }
}
