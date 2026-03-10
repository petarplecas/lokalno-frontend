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
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { DiscountType, Discount } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

// Steps: 0=Osnove, 1=Vrednost, 2=Raspored, 3=Kuponi, 4=Pregled
const STEP_COUNT = 5;

@Component({
  selector: 'app-edit-discount',
  imports: [ReactiveFormsModule, RouterLink, Spinner, PageHeader, ConfirmDialog],
  templateUrl: './edit-discount.html',
  styleUrl: '../create-discount/create-discount.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDiscount implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly discountService = inject(DiscountService);
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
    imageUrl:         ['', [Validators.required]],
    title:            ['', [Validators.required, Validators.maxLength(40)]],
    description:      ['', [Validators.maxLength(200)]],
    discountType:     ['PERCENT' as DiscountType, [Validators.required]],
    discountValue:    [0, [Validators.required, Validators.min(1)]],
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
    ['imageUrl', 'title'],
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
      case DiscountType.PERCENT:   return val > 0 ? `-${val}%` : '-?%';
      case DiscountType.FIXED:     return val > 0 ? `-${val} RSD` : '-? RSD';
      case DiscountType.NEW_PRICE: return np ? `${np} RSD` : 'Nova cena';
      case DiscountType.BOGO:      return '1+1';
    }
  });

  private readonly titleValue = toSignal(this.form.controls.title.valueChanges, { initialValue: this.form.controls.title.value });
  private readonly descValue  = toSignal(this.form.controls.description.valueChanges, { initialValue: this.form.controls.description.value });
  readonly titleLength = computed(() => this.titleValue().length);
  readonly descLength  = computed(() => this.descValue().length);

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

    this.form.patchValue({
      imageUrl: d.imageUrl,
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
    } else {
      this.form.controls.discountValue.setValidators([Validators.required, Validators.min(1)]);
      this.form.controls.oldPrice.clearValidators();
      this.form.controls.newPrice.clearValidators();
    }
    this.form.controls.discountValue.updateValueAndValidity();
    this.form.controls.oldPrice.updateValueAndValidity();
    this.form.controls.newPrice.updateValueAndValidity();
  }

  // ── Navigation ────────────────────────────────────────────
  isStepValid(step?: number): boolean {
    const fields = this.stepFields[step ?? this.currentStep()];
    return fields.every((f) => this.form.get(f)?.valid ?? true);
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

    const v = this.form.getRawValue();
    const daysOfWeek = (v.daysOfWeek as unknown as number[]).filter((d) => !isNaN(d));

    this.discountService
      .updateDiscount(this.discountId, {
        title: v.title,
        description: v.description || undefined,
        imageUrl: v.imageUrl,
        discountType: v.discountType,
        discountValue: v.discountType === DiscountType.BOGO ? 1 : (v.discountType === DiscountType.NEW_PRICE ? 0 : v.discountValue),
        oldPrice: v.discountType === DiscountType.NEW_PRICE ? (v.oldPrice ?? undefined) : undefined,
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
    this.discountService.deleteDiscount(this.discountId).subscribe({
      next: () => {
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
