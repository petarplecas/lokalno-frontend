import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { DiscountType } from '../../../core/models';
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

  readonly form = this.fb.nonNullable.group({
    imageUrl: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', [Validators.maxLength(200)]],
    discountType: ['PERCENT' as DiscountType, [Validators.required]],
    discountValue: [0, [Validators.required, Validators.min(1)]],
    oldPrice: [null as number | null],
    newPrice: [null as number | null],
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

  isStepValid(): boolean {
    const fields = this.stepFields[this.currentStep()];
    return fields.every((f) => this.form.get(f)?.valid ?? true);
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

  onSubmit(): void {
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
        discountValue: v.discountValue,
        oldPrice: v.oldPrice ?? undefined,
        newPrice: v.newPrice ?? undefined,
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
          this.loading.set(false);
          this.toastService.success('Popust je kreiran!');
          void this.router.navigate(['/business/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Kreiranje nije uspelo');
        },
      });
  }
}
