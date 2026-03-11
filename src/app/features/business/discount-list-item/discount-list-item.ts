import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Discount, DiscountType, DiscountStatus } from '../../../core/models';
import { DiscountLabelPipe } from '../../../shared/pipes/discount-label.pipe';
import { DiscountTemplateVisual } from '../../../shared/components/discount-template-visual/discount-template-visual';

@Component({
  selector: 'app-discount-list-item',
  imports: [RouterLink, DecimalPipe, DatePipe, DiscountLabelPipe, DiscountTemplateVisual],
  templateUrl: './discount-list-item.html',
  styleUrl: './discount-list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountListItem {
  readonly discount = input.required<Discount>();
  readonly deleted = output<string>();

  readonly DiscountType = DiscountType;
  readonly DiscountStatus = DiscountStatus;

  readonly menuOpen = signal(false);

  readonly couponPercent = computed(() => {
    const d = this.discount();
    if (!d.hasCoupons || d.totalCoupons === null || d.availableCoupons === null) return null;
    return Math.round((d.availableCoupons / d.totalCoupons) * 100);
  });

  readonly statusClass = computed(() => {
    switch (this.discount().status) {
      case DiscountStatus.ACTIVE:      return 'active';
      case DiscountStatus.EXPIRED:     return 'expired';
      case DiscountStatus.DEACTIVATED: return 'deactivated';
      case DiscountStatus.DRAFT:       return 'draft';
      default:                         return '';
    }
  });

  readonly statusLabel = computed(() => {
    switch (this.discount().status) {
      case DiscountStatus.ACTIVE:      return 'Aktivan';
      case DiscountStatus.EXPIRED:     return 'Istekao';
      case DiscountStatus.DEACTIVATED: return 'Deaktiviran';
      case DiscountStatus.DRAFT:       return 'Nacrt';
      default:                         return '';
    }
  });

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onDelete(): void {
    this.menuOpen.set(false);
    this.deleted.emit(this.discount().id);
  }
}
