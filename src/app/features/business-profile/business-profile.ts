import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BusinessService } from '../../core/services/business.service';
import { DiscountService } from '../../core/services/discount.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { BusinessDetail } from '../../core/models/business.model';
import { Discount, DiscountStatus } from '../../core/models';
import { DiscountCard } from '../../shared/components/discount-card/discount-card';
import { MapView } from '../../shared/components/map-view/map-view';
import { BackButton } from '../../shared/components/back-button/back-button';
import { Spinner } from '../../shared/components/spinner/spinner';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';

@Component({
  selector: 'app-business-profile',
  imports: [DiscountCard, MapView, BackButton, Spinner, EmptyState, InfiniteScrollDirective],
  templateUrl: './business-profile.html',
  styleUrl: './business-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessProfile implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly discountService = inject(DiscountService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly business = signal<BusinessDetail | null>(null);
  readonly loading = signal(true);
  readonly isFavorite = signal(false);

  readonly discounts = signal<Discount[]>([]);
  readonly discountsLoading = signal(false);
  readonly discountsLoadingMore = signal(false);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly hasMore = computed(() => this.currentPage() < this.totalPages());

  private readonly limit = 10;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.discountsLoading.set(true);

    forkJoin({
      business: this.businessService.getBusiness(id),
      discounts: this.discountService.getDiscounts({
        businessId: id,
        status: DiscountStatus.ACTIVE,
        page: 1,
        limit: this.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    }).subscribe({
      next: ({ business, discounts }) => {
        this.business.set(business);
        this.discounts.set(discounts.data);
        this.totalPages.set(discounts.meta.totalPages);
        this.loading.set(false);
        this.discountsLoading.set(false);

        if (this.isAuthenticated()) {
          this.userService.isFavorite(business.id).subscribe({
            next: (fav) => this.isFavorite.set(fav),
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.discountsLoading.set(false);
        this.toastService.error('Biznis nije pronađen');
        void this.router.navigate(['/home']);
      },
    });
  }

  onLoadMore(): void {
    const biz = this.business();
    if (this.discountsLoadingMore() || !this.hasMore() || !biz) return;

    this.currentPage.update((p) => p + 1);
    this.discountsLoadingMore.set(true);

    this.discountService.getDiscounts({
      businessId: biz.id,
      status: DiscountStatus.ACTIVE,
      page: this.currentPage(),
      limit: this.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }).subscribe({
      next: (res) => {
        this.discounts.update((prev) => [...prev, ...res.data]);
        this.totalPages.set(res.meta.totalPages);
        this.discountsLoadingMore.set(false);
      },
      error: () => this.discountsLoadingMore.set(false),
    });
  }

  onDiscountClick(discount: Discount): void {
    void this.router.navigate(['/discounts', discount.id]);
  }

  toggleFavorite(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/auth/login']);
      return;
    }
    const biz = this.business();
    if (!biz) return;

    if (this.isFavorite()) {
      this.userService.removeFavorite(biz.id).subscribe(() => {
        this.isFavorite.set(false);
        this.toastService.success('Uklonjeno iz omiljenih');
      });
    } else {
      this.userService.addFavorite(biz.id).subscribe(() => {
        this.isFavorite.set(true);
        this.toastService.success('Dodato u omiljene');
      });
    }
  }
}
