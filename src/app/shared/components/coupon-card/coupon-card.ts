import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Coupon, CouponStatus } from '../../../core/models';
import { DiscountLabelPipe } from '../../pipes/discount-label.pipe';

@Component({
  selector: 'app-coupon-card',
  imports: [DatePipe, DiscountLabelPipe],
  templateUrl: './coupon-card.html',
  styleUrl: './coupon-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouponCard {
  readonly coupon = input.required<Coupon>();

  readonly statusLabel = computed(() => {
    switch (this.coupon().status) {
      case CouponStatus.ACTIVE:
        return 'Aktivan';
      case CouponStatus.USED:
        return 'Iskorišćen';
      case CouponStatus.EXPIRED:
        return 'Istekao';
    }
  });
}
