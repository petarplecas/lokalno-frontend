import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { Coupon, CouponStatus } from '../../core/models';
import { CouponCard } from '../../shared/components/coupon-card/coupon-card';
import { Spinner } from '../../shared/components/spinner/spinner';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface Tab {
  label: string;
  status: CouponStatus;
  emptyMessage: string;
}

@Component({
  selector: 'app-coupons',
  imports: [CouponCard, Spinner, EmptyState],
  templateUrl: './coupons.html',
  styleUrl: './coupons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Coupons implements OnInit {
  private readonly userService = inject(UserService);

  readonly tabs: Tab[] = [
    { label: 'Aktivni', status: CouponStatus.ACTIVE, emptyMessage: 'Nemate aktivnih kupona' },
    { label: 'Iskorišćeni', status: CouponStatus.USED, emptyMessage: 'Nemate iskorišćenih kupona' },
    { label: 'Istekli', status: CouponStatus.EXPIRED, emptyMessage: 'Nemate isteklih kupona' },
  ];

  readonly activeTab = signal(0);
  readonly coupons = signal<Coupon[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  ngOnInit(): void {
    this.loadCoupons();
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
    this.loadCoupons();
  }

  onRetry(): void {
    this.loadCoupons();
  }

  private loadCoupons(): void {
    this.loading.set(true);
    this.error.set(false);
    const status = this.tabs[this.activeTab()].status;

    this.userService.getMyCoupons(1, 50, status).subscribe({
      next: (res) => {
        this.coupons.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
