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
import { Discount, DiscountFilters, DiscountStatus } from '../../core/models';
import { DiscountCard } from '../../shared/components/discount-card/discount-card';
import { Spinner } from '../../shared/components/spinner/spinner';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';

interface CategoryPill {
  label: string;
  categories: string[] | null;
}

@Component({
  selector: 'app-home',
  imports: [DiscountCard, Spinner, EmptyState, InfiniteScrollDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly discountService = inject(DiscountService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly categoryPills: CategoryPill[] = [
    { label: 'Sve', categories: null },
    { label: 'Hrana', categories: ['RESTORANI', 'KAFICI', 'FAST_FOOD', 'PEKARE', 'POSLASTICARNICE'] },
    { label: 'Lepota', categories: ['KOZMETIKA', 'FRIZERSKI_SALONI'] },
    { label: 'Fitness', categories: ['FITNESS'] },
    { label: 'Moda', categories: ['PRODAVNICE'] },
    { label: 'Dom', categories: ['SUPERMARKETI'] },
    { label: 'Usluge', categories: ['ZABAVA', 'BAROVI'] },
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

  readonly error = signal(false);
  readonly hasMore = computed(() => this.currentPage() < this.totalPages());
  readonly isEmpty = computed(() => !this.loading() && !this.error() && this.discounts().length === 0);

  private readonly limit = 20;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadDiscounts(true);

    this.destroyRef.onDestroy(() => {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
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
    void this.router.navigate(['/discounts', discount.id]);
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
