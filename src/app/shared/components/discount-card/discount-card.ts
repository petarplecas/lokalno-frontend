import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Discount, DiscountType } from '../../../core/models';
import { DiscountLabelPipe } from '../../pipes/discount-label.pipe';
import { DistancePipe } from '../../pipes/distance.pipe';

@Component({
  selector: 'app-discount-card',
  imports: [DiscountLabelPipe, DistancePipe, DecimalPipe],
  templateUrl: './discount-card.html',
  styleUrl: './discount-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountCard {
  readonly discount = input.required<Discount>();
  readonly isSaved = input<boolean>(false);
  readonly featured = input<boolean>(false);

  readonly clicked = output<Discount>();
  readonly saveToggled = output<{ discount: Discount; save: boolean }>();

  readonly urgencyLevel = computed<'hot' | 'warm' | 'new' | null>(() => {
    const d = this.discount();
    const now = new Date();
    const until = new Date(d.validUntil);
    const diffDays = (until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1 || (d.availableCoupons !== null && d.availableCoupons <= 3)) {
      return 'hot';
    }
    if (diffDays <= 3) {
      return 'warm';
    }
    const created = new Date(d.createdAt);
    const hoursSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated <= 48) {
      return 'new';
    }
    return null;
  });

  readonly urgencyLabel = computed(() => {
    const level = this.urgencyLevel();
    const d = this.discount();
    if (level === 'hot') {
      if (d.availableCoupons !== null && d.availableCoupons <= 3) {
        return `Ostalo ${d.availableCoupons} kupona`;
      }
      return 'Ističe danas';
    }
    if (level === 'warm') return 'Ističe uskoro';
    if (level === 'new') return 'Novo';
    return '';
  });

  readonly couponFillPercent = computed<number | null>(() => {
    const d = this.discount();
    if (!d.hasCoupons || d.totalCoupons === null || d.availableCoupons === null) return null;
    return Math.round((d.availableCoupons / d.totalCoupons) * 100);
  });

  readonly isCouponCritical = computed(() => {
    const fill = this.couponFillPercent();
    return fill !== null && fill <= 20;
  });

  readonly discountTypeClass = computed(() => {
    switch (this.discount().discountType) {
      case DiscountType.PERCENT:   return 'percent';
      case DiscountType.FIXED:     return 'fixed';
      case DiscountType.NEW_PRICE: return 'new-price';
      case DiscountType.BOGO:      return 'bogo';
      default:                     return 'percent';
    }
  });

  onClick(): void {
    this.clicked.emit(this.discount());
  }

  onSaveClick(event: MouseEvent): void {
    event.stopPropagation();
    this.saveToggled.emit({ discount: this.discount(), save: !this.isSaved() });
  }
}
