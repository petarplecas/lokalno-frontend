import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { DiscountType, Discount } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { BackButton } from '../../../shared/components/back-button/back-button';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-edit-discount',
  imports: [ReactiveFormsModule, Spinner, BackButton, ConfirmDialog],
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

  readonly discountTypes = Object.values(DiscountType);
  readonly currentStep = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showDeleteDialog = signal(false);
  readonly deleting = signal(false);

  private discountId = '';

  readonly steps = ['Slika', 'Info', 'Tip', 'Validnost', 'Kuponi', 'Tagovi', 'Pregled'];

  readonly discountTypeLabels: Record<DiscountType, string> = {
    [DiscountType.PERCENT]: 'Procenat (%)',
    [DiscountType.FIXED]: 'Fiksni iznos (RSD)',
    [DiscountType.BOGO]: '1+1 gratis',
    [DiscountType.NEW_PRICE]: 'Nova cena',
  };

  readonly form = this.fb.nonNullable.group({
    imageUrl: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', [Validators.maxLength(200)]],
    discountType: ['PERCENT' as DiscountType, [Validators.required]],
    discountValue: [0, [Validators.required, Validators.min(1)]],
    validFrom: ['', [Validators.required]],
    validUntil: ['', [Validators.required]],
    daysOfWeek: ['1,2,3,4,5,6,7'],
    timeStart: [''],
    timeEnd: [''],
    hasCoupons: [false],
    totalCoupons: [null as number | null],
    couponDuration: [30],
    tags: [''],
  });

  private readonly stepFields: string[][] = [
    ['imageUrl'],
    ['title'],
    ['discountType', 'discountValue'],
    ['validFrom', 'validUntil'],
    [],
    [],
    [],
  ];

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
    this.form.patchValue({
      imageUrl: d.imageUrl,
      title: d.title,
      description: d.description ?? '',
      discountType: d.discountType,
      discountValue: d.discountValue,
      validFrom: d.validFrom.split('T')[0],
      validUntil: d.validUntil.split('T')[0],
      daysOfWeek: d.daysOfWeek.join(','),
      timeStart: d.timeStart ?? '',
      timeEnd: d.timeEnd ?? '',
      hasCoupons: d.hasCoupons,
      totalCoupons: d.totalCoupons,
      couponDuration: d.couponDuration ?? 30,
      tags: d.tags.join(', '),
    });
    this.loading.set(false);
  }

  onDiscountTypeChange(): void {
    const type = this.form.controls.discountType.value;
    if (type === DiscountType.BOGO) {
      this.form.controls.discountValue.clearValidators();
      this.form.controls.discountValue.setValue(1);
    } else {
      this.form.controls.discountValue.setValidators([Validators.required, Validators.min(1)]);
    }
    this.form.controls.discountValue.updateValueAndValidity();
  }

  isStepValid(step?: number): boolean {
    const fields = this.stepFields[step ?? this.currentStep()];
    return fields.every((f) => this.form.get(f)?.valid ?? true);
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

  next(): void {
    if (!this.isStepValid()) {
      const fields = this.stepFields[this.currentStep()];
      fields.forEach((f) => this.form.get(f)?.markAsTouched());
      return;
    }
    if (this.currentStep() < this.steps.length - 1) {
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
    const daysOfWeek = v.daysOfWeek
      .split(',')
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d));

    this.discountService
      .updateDiscount(this.discountId, {
        title: v.title,
        description: v.description || undefined,
        imageUrl: v.imageUrl,
        discountType: v.discountType,
        discountValue: v.discountType === DiscountType.BOGO ? 1 : v.discountValue,
        validity: {
          validFrom: v.validFrom,
          validUntil: v.validUntil,
          daysOfWeek,
          timeStart: v.timeStart || undefined,
          timeEnd: v.timeEnd || undefined,
        },
        couponSettings: v.hasCoupons
          ? {
              hasCoupons: true,
              totalCoupons: v.totalCoupons ?? undefined,
              couponDuration: v.couponDuration,
            }
          : { hasCoupons: false },
        tags: v.tags
          ? v.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
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
