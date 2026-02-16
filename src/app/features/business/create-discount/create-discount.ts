import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { DiscountType, DiscountStatus } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { BackButton } from '../../../shared/components/back-button/back-button';

@Component({
  selector: 'app-create-discount',
  imports: [ReactiveFormsModule, Spinner, BackButton],
  templateUrl: './create-discount.html',
  styleUrl: './create-discount.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDiscount {
  private readonly fb = inject(FormBuilder);
  private readonly discountService = inject(DiscountService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly discountTypes = Object.values(DiscountType);
  readonly currentStep = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly steps = ['Slika', 'Info', 'Tip', 'Validnost', 'Kuponi', 'Tagovi', 'Pregled'];

  readonly discountTypeLabels: Record<DiscountType, string> = {
    [DiscountType.PERCENT]: 'Procenat (%)',
    [DiscountType.FIXED]: 'Fiksni iznos (RSD)',
    [DiscountType.BOGO]: '1+1 gratis',
    [DiscountType.NEW_PRICE]: 'Nova cena',
    [DiscountType.COUPON]: 'Kupon',
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

    this.loading.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    const daysOfWeek = v.daysOfWeek
      .split(',')
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d));

    this.discountService
      .createDiscount({
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
      .pipe(
        switchMap((discount) =>
          this.discountService.updateStatus(discount.id, DiscountStatus.ACTIVE),
        ),
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastService.success('Popust je kreiran i aktiviran!');
          void this.router.navigate(['/business/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Kreiranje nije uspelo');
        },
      });
  }
}
