import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { DiscountService } from '../../../core/services/discount.service';
import { ToastService } from '../../../core/services/toast.service';
import { MyBusiness, BusinessStats, Discount } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { DiscountListItem } from '../discount-list-item/discount-list-item';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Spinner, DiscountListItem, ConfirmDialog],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly discountService = inject(DiscountService);
  private readonly toastService = inject(ToastService);

  readonly business = signal<MyBusiness | null>(null);
  readonly stats = signal<BusinessStats | null>(null);
  readonly loading = signal(true);
  readonly discounts = signal<Discount[]>([]);
  readonly loadingDiscounts = signal(true);
  readonly deleteTargetId = signal<string | null>(null);
  readonly deleting = signal(false);

  readonly expiringDiscounts = computed(() =>
    this.discounts().filter((d) => {
      if (d.status !== 'ACTIVE') return false;
      const days = (new Date(d.validUntil).getTime() - Date.now()) / 86400000;
      return days <= 3 && days >= 0;
    }),
  );

  ngOnInit(): void {
    this.businessService.getMyBusiness().subscribe({
      next: (biz) => {
        this.business.set(biz);
        this.loadStats();
        this.loadDiscounts(biz.id);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadStats(): void {
    this.businessService.getMyStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadDiscounts(businessId: string): void {
    this.discountService.getDiscounts({ businessId }).subscribe({
      next: (res) => {
        this.discounts.set(res.data);
        this.loadingDiscounts.set(false);
      },
      error: () => this.loadingDiscounts.set(false),
    });
  }

  onDiscountDeleted(discountId: string): void {
    this.deleteTargetId.set(discountId);
  }

  onConfirmDelete(): void {
    const id = this.deleteTargetId()!;
    this.deleting.set(true);
    this.discountService.deleteDiscount(id).subscribe({
      next: () => {
        this.discounts.update((list) => list.filter((d) => d.id !== id));
        this.deleteTargetId.set(null);
        this.deleting.set(false);
        this.toastService.success('Popust je obrisan');
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteTargetId.set(null);
        this.toastService.error(err.error?.message || 'Brisanje nije uspelo');
      },
    });
  }

  onCancelDelete(): void {
    this.deleteTargetId.set(null);
  }
}
