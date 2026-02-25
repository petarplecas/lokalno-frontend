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
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { DiscountType, DiscountStatus } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ImageUpload, PendingImageBlob } from '../../../shared/components/image-upload/image-upload';

@Component({
  selector: 'app-create-discount',
  imports: [ReactiveFormsModule, Spinner, PageHeader, ImageUpload],
  templateUrl: './create-discount.html',
  styleUrl: './create-discount.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDiscount {
  private readonly fb = inject(FormBuilder);
  private readonly discountService = inject(DiscountService);
  private readonly uploadService = inject(UploadService);
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
  };

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
    daysOfWeek: [[1, 2, 3, 4, 5, 6, 7]],
    timeStart: [''],
    timeEnd: [''],
    hasCoupons: [false],
    totalCoupons: [null as number | null],
    couponDuration: [24],
    tags: [''],
  });

  readonly allDays = [
    { value: 1, label: 'Pon' },
    { value: 2, label: 'Uto' },
    { value: 3, label: 'Sre' },
    { value: 4, label: 'Čet' },
    { value: 5, label: 'Pet' },
    { value: 6, label: 'Sub' },
    { value: 7, label: 'Ned' },
  ];

  readonly couponDurationOptions = [
    { value: 1, label: '1 sat' },
    { value: 3, label: '3 sata' },
    { value: 6, label: '6 sati' },
    { value: 24, label: '24 sata' },
    { value: 168, label: '7 dana' },
  ];

  getDurationLabel(value: number | null | undefined): string {
    return this.couponDurationOptions.find((o) => o.value === value)?.label ?? `${value}h`;
  }

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

  private readonly stepFields: string[][] = [
    ['imageUrl'],
    ['title'],
    ['discountType', 'discountValue', 'oldPrice', 'newPrice'],
    ['validFrom', 'validUntil'],
    [],
    [],
    [],
  ];

  private readonly pendingImage = signal<PendingImageBlob | null>(null);
  readonly pendingPreviewUrl = signal<string | null>(null);

  onPendingImage(data: PendingImageBlob | null): void {
    this.pendingImage.set(data);
    if (data) {
      this.pendingPreviewUrl.set(URL.createObjectURL(data.blob));
      this.form.controls.imageUrl.setValue('pending');
    } else {
      this.pendingPreviewUrl.set(null);
      this.form.controls.imageUrl.setValue('');
    }
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
            this.createDiscount();
          },
          error: () => {
            this.loading.set(false);
            this.error.set('Upload slike nije uspeo. Pokušajte ponovo.');
          },
        });
    } else {
      this.createDiscount();
    }
  }

  private createDiscount(): void {
    const v = this.form.getRawValue();
    const daysOfWeek = (v.daysOfWeek as unknown as number[]).filter((d) => !isNaN(d));

    this.discountService
      .createDiscount({
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
