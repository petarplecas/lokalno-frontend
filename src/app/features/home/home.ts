import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { DiscountService } from '../../core/services/discount.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { ToastService } from '../../core/services/toast.service';
import { Discount, DiscountFilters, DiscountStatus } from '../../core/models';
import { DiscountCard } from '../../shared/components/discount-card/discount-card';
import { Spinner } from '../../shared/components/spinner/spinner';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';
import { GuestConversionBadge } from '../../shared/components/guest-conversion-badge/guest-conversion-badge';
import { GuestTrackerService } from '../../core/services/guest-tracker.service';

interface CategoryPill {
  label: string;
  categories: string[] | null;
}

@Component({
  selector: 'app-home',
  imports: [DiscountCard, Spinner, EmptyState, InfiniteScrollDirective, GuestConversionBadge],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly discountService = inject(DiscountService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly geo = inject(GeolocationService);
  readonly guestTracker = inject(GuestTrackerService);

  readonly categoryPills: CategoryPill[] = [
    { label: '🏷️ Sve', categories: null },
    { label: '🍕 Hrana', categories: ['RESTORANI', 'KAFICI', 'FAST_FOOD', 'PEKARE', 'POSLASTICARNICE'] },
    { label: '💅 Lepota', categories: ['KOZMETIKA', 'FRIZERSKI_SALONI'] },
    { label: '💪 Fitness', categories: ['FITNESS'] },
    { label: '👗 Moda', categories: ['PRODAVNICE'] },
    { label: '🏠 Dom', categories: ['SUPERMARKETI'] },
    { label: '🛎️ Usluge', categories: ['ZABAVA', 'BAROVI'] },
  ];

  readonly sortOptions = [
    { label: 'Najnovije', value: 'createdAt' as const },
    { label: 'Najpopularnije', value: 'views' as const },
    { label: 'Najsačuvanije', value: 'saves' as const },
  ];

  readonly discounts = signal<Discount[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly searchQuery = signal('');
  readonly activeCategory = signal(0);
  readonly activeSortBy = signal<'createdAt' | 'views' | 'saves'>('createdAt');
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);

  readonly radiusKm = signal(5);
  readonly locationActive = signal(false);
  readonly radiusOptions = [0.5, 1, 2, 5, 10, 20];

  readonly error = signal(false);
  readonly hasMore = computed(() => this.currentPage() < this.totalPages());
  readonly isEmpty = computed(() => !this.loading() && !this.error() && this.discounts().length === 0);

  // Featured: first 3 discounts displayed in horizontal scroll above grid
  readonly featuredDiscounts = computed(() => this.discounts().slice(0, 3));

  // Optimistic save state — Set of saved discount IDs
  readonly savedDiscountIds = signal<Set<string>>(new Set());

  private readonly limit = 20;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadDiscounts(true);

    this.destroyRef.onDestroy(() => {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
    });
  }

  isDiscountSaved(discountId: string): boolean {
    return this.savedDiscountIds().has(discountId);
  }

  onSaveToggled(event: { discount: Discount; save: boolean }): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/auth/login']);
      return;
    }

    const { discount, save } = event;

    // Optimistic update
    this.savedDiscountIds.update((ids) => {
      const next = new Set(ids);
      if (save) {
        next.add(discount.id);
      } else {
        next.delete(discount.id);
      }
      return next;
    });

    const request$ = save
      ? this.userService.saveDiscount(discount.id)
      : this.userService.removeSavedDiscount(discount.id);

    request$.subscribe({
      next: () => {
        this.toastService.success(save ? 'Popust sačuvan' : 'Uklonjeno iz sačuvanih');
      },
      error: () => {
        // Rollback on error
        this.savedDiscountIds.update((ids) => {
          const next = new Set(ids);
          if (save) {
            next.delete(discount.id);
          } else {
            next.add(discount.id);
          }
          return next;
        });
        this.toastService.error('Akcija nije uspela');
      },
    });
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadDiscounts(true), 400);
  }

  onCategoryChange(index: number): void {
    this.activeCategory.set(index);
    this.loadDiscounts(true);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'createdAt' | 'views' | 'saves';
    this.activeSortBy.set(value);
    this.loadDiscounts(true);
  }

  onLoadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    this.currentPage.update((p) => p + 1);
    this.loadDiscounts(false);
  }

  onDiscountClick(discount: Discount): void {
    this.guestTracker.trackView(discount.id);
    void this.router.navigate(['/discounts', discount.id]);
  }

  onToggleLocation(): void {
    if (this.locationActive()) {
      this.locationActive.set(false);
      this.geo.clearLocation();
      this.loadDiscounts(true);
      return;
    }

    if (this.geo.hasLocation()) {
      this.locationActive.set(true);
      this.loadDiscounts(true);
      return;
    }

    this.geo.requestLocation();
    // Watch for location to be set, then reload
    const checkInterval = setInterval(() => {
      if (this.geo.hasLocation()) {
        clearInterval(checkInterval);
        this.locationActive.set(true);
        this.loadDiscounts(true);
      } else if (this.geo.permission() === 'denied' || this.geo.permission() === 'unavailable') {
        clearInterval(checkInterval);
      }
    }, 100);

    // Safety timeout
    setTimeout(() => clearInterval(checkInterval), 15000);
  }

  onRadiusSelect(value: number): void {
    this.radiusKm.set(value);
    if (this.locationActive()) {
      this.loadDiscounts(true);
    }
  }

  radiusLabel(value: number): string {
    return value < 1 ? '500 m' : value + ' km';
  }

  onRetry(): void {
    this.loadDiscounts(true);
  }

  private loadDiscounts(reset: boolean): void {
    this.error.set(false);
    if (reset) {
      this.currentPage.set(1);
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    const pill = this.categoryPills[this.activeCategory()];
    const filters: Partial<DiscountFilters> = {
      page: this.currentPage(),
      limit: this.limit,
      sortBy: this.activeSortBy(),
      sortOrder: 'desc',
      status: DiscountStatus.ACTIVE,
    };

    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }

    if (pill.categories) {
      filters.category = pill.categories.join(',');
    }

    // Add geolocation filter
    const loc = this.geo.location();
    if (this.locationActive() && loc) {
      filters.latitude = loc.latitude;
      filters.longitude = loc.longitude;
      filters.radiusKm = this.radiusKm();
    }

    this.discountService.getDiscounts(filters).subscribe({
      next: (res) => {
        if (reset) {
          this.discounts.set(res.data);
        } else {
          this.discounts.update((prev) => [...prev, ...res.data]);
        }
        this.totalPages.set(res.meta.totalPages);
        this.total.set(res.meta.total);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }
}
