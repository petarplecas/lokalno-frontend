import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CouponService } from '../../../core/services/coupon.service';
import { ToastService } from '../../../core/services/toast.service';
import { CouponDetail } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { DiscountLabelPipe } from '../../../shared/pipes/discount-label.pipe';

@Component({
  selector: 'app-verify-coupon',
  imports: [ReactiveFormsModule, DatePipe, Spinner, DiscountLabelPipe],
  templateUrl: './verify-coupon.html',
  styleUrl: './verify-coupon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyCoupon {
  private readonly fb = inject(FormBuilder);
  private readonly couponService = inject(CouponService);
  private readonly toastService = inject(ToastService);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
  });

  readonly coupon = signal<CouponDetail | null>(null);
  readonly loading = signal(false);
  readonly using = signal(false);
  readonly error = signal<string | null>(null);

  onSearch(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.coupon.set(null);

    this.couponService.getCoupon(this.form.getRawValue().code).subscribe({
      next: (c) => {
        this.coupon.set(c);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Kupon nije pronađen');
      },
    });
  }

  onUse(): void {
    const c = this.coupon();
    if (!c) return;

    this.using.set(true);
    this.couponService.useCoupon(c.code).subscribe({
      next: () => {
        this.using.set(false);
        this.toastService.success('Kupon je iskorišćen!');
        this.coupon.set({ ...c, status: 'USED' as any, usedAt: new Date().toISOString() });
      },
      error: (err) => {
        this.using.set(false);
        this.toastService.error(err.error?.message || 'Korišćenje kupona nije uspelo');
      },
    });
  }
}
