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
import { MyBusiness, BusinessStats, Discount } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { DiscountListItem } from '../discount-list-item/discount-list-item';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Spinner, DiscountListItem],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly discountService = inject(DiscountService);

  readonly business = signal<MyBusiness | null>(null);
  readonly stats = signal<BusinessStats | null>(null);
  readonly loading = signal(true);
  readonly discounts = signal<Discount[]>([]);
  readonly loadingDiscounts = signal(true);

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
    this.discounts.update((list) => list.filter((d) => d.id !== discountId));
  }
}
