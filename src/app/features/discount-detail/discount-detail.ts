import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DiscountService } from '../../core/services/discount.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Discount, DiscountType, ClaimCouponResponse } from '../../core/models';
import { DiscountLabelPipe } from '../../shared/pipes/discount-label.pipe';
import { Spinner } from '../../shared/components/spinner/spinner';
import { BackButton } from '../../shared/components/back-button/back-button';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { MapView } from '../../shared/components/map-view/map-view';

const DAY_NAMES = ['', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [6, 7];

@Component({
  selector: 'app-discount-detail',
  imports: [DatePipe, DecimalPipe, DiscountLabelPipe, Spinner, BackButton, ConfirmDialog, MapView, RouterLink],
  templateUrl: './discount-detail.html',
  styleUrl: './discount-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly discountService = inject(DiscountService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly discount = signal<Discount | null>(null);
  readonly loading = signal(true);
  readonly isFavorite = signal(false);
  readonly isSaved = signal(false);
  readonly showClaimDialog = signal(false);
  readonly claimLoading = signal(false);
  readonly claimedCoupon = signal<ClaimCouponResponse['coupon'] | null>(null);

  readonly isAuthenticated = this.authService.isAuthenticated;

  // ── Urgency ────────────────────────────────────────────────
  readonly urgencyLevel = computed<'hot' | 'warm' | 'new' | null>(() => {
    const d = this.discount();
    if (!d) return null;
    const now = new Date();
    const until = new Date(d.validUntil);
    const diffDays = (until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1 || (d.availableCoupons !== null && d.availableCoupons <= 3)) return 'hot';
    if (diffDays <= 3) return 'warm';
    const hoursSinceCreated = (now.getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated <= 48) return 'new';
    return null;
  });

  readonly urgencyLabel = computed(() => {
    const level = this.urgencyLevel();
    const d = this.discount();
    if (!d) return '';
    if (level === 'hot') {
      if (d.availableCoupons !== null && d.availableCoupons <= 3) return `Ostalo ${d.availableCoupons} kupona`;
      return 'Ističe danas';
    }
    if (level === 'warm') {
      const diffDays = Math.ceil(
        (new Date(d.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );
      return `Ističe za ${diffDays} ${diffDays === 1 ? 'dan' : 'dana'}`;
    }
    if (level === 'new') return 'Novo';
    return '';
  });

  readonly daysUntilExpiry = computed(() => {
    const d = this.discount();
    if (!d) return null;
    return Math.ceil(
      (new Date(d.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );
  });

  // ── Coupon progress ────────────────────────────────────────
  readonly couponFillPercent = computed<number | null>(() => {
    const d = this.discount();
    if (!d || !d.hasCoupons || d.totalCoupons === null || d.availableCoupons === null) return null;
    return Math.round((d.availableCoupons / d.totalCoupons) * 100);
  });

  readonly isCouponCritical = computed(() => {
    const fill = this.couponFillPercent();
    return fill !== null && fill <= 20;
  });

  // ── Discount type CSS class ────────────────────────────────
  readonly discountTypeClass = computed(() => {
    const d = this.discount();
    if (!d) return 'percent';
    switch (d.discountType) {
      case DiscountType.PERCENT:   return 'percent';
      case DiscountType.FIXED:     return 'fixed';
      case DiscountType.NEW_PRICE: return 'new-price';
      case DiscountType.BOGO:      return 'bogo';
      default:                     return 'percent';
    }
  });

  // ── Schedule labels ────────────────────────────────────────
  readonly daysLabel = computed(() => {
    const d = this.discount();
    if (!d || !d.daysOfWeek || d.daysOfWeek.length === 0) return 'Svakog dana';
    const days = [...d.daysOfWeek].sort((a, b) => a - b);
    if (days.length === 7) return 'Svakog dana';
    if (WEEKDAYS.every(day => days.includes(day)) && days.length === 5) return 'Pon – Pet';
    if (WEEKEND.every(day => days.includes(day)) && days.length === 2) return 'Vikend';
    return days.map(n => DAY_NAMES[n] ?? '').filter(Boolean).join(', ');
  });

  readonly timeLabel = computed(() => {
    const d = this.discount();
    if (!d || !d.timeStart || !d.timeEnd) return 'Ceo dan';
    return `${d.timeStart} – ${d.timeEnd}`;
  });

  // ── Conditions list ────────────────────────────────────────
  readonly conditions = computed<string[]>(() => {
    const d = this.discount();
    if (!d) return [];
    const list: string[] = [];
    if (d.minPurchase) list.push(`Minimalna kupovina: ${d.minPurchase.toLocaleString('sr-RS')} RSD`);
    list.push(this.daysLabel());
    if (d.timeStart && d.timeEnd) list.push(`Dostupno: ${this.timeLabel()}`);
    if (d.couponDuration) {
      const h = d.couponDuration;
      list.push(`Kupon važi: ${h === 1 ? '1 sat' : h === 168 ? '7 dana' : h + ' sati'} od preuzimanja`);
    }
    return list;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.discountService.getDiscount(id).subscribe({
      next: (discount) => {
        this.discount.set(discount);
        this.loading.set(false);
        if (this.isAuthenticated()) {
          this.checkFavorite(discount);
          this.checkSaved(discount);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Popust nije pronađen');
      },
    });
  }

  toggleFavorite(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/auth/login']);
      return;
    }
    const d = this.discount();
    if (!d) return;

    if (this.isFavorite()) {
      this.userService.removeFavorite(d.business.id).subscribe(() => {
        this.isFavorite.set(false);
        this.toastService.success('Uklonjeno iz omiljenih');
      });
    } else {
      this.userService.addFavorite(d.business.id).subscribe(() => {
        this.isFavorite.set(true);
        this.toastService.success('Dodato u omiljene');
      });
    }
  }

  openClaimDialog(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/auth/login']);
      return;
    }
    this.showClaimDialog.set(true);
  }

  onClaimConfirm(confirmed: boolean): void {
    this.showClaimDialog.set(false);
    if (!confirmed) return;

    const d = this.discount();
    if (!d) return;

    this.claimLoading.set(true);
    this.discountService.claimCoupon(d.id).subscribe({
      next: (res) => {
        this.claimedCoupon.set(res.coupon);
        this.claimLoading.set(false);
        this.toastService.success('Kupon je preuzet!');
        if (d.availableCoupons !== null) {
          this.discount.set({ ...d, availableCoupons: d.availableCoupons - 1 });
        }
      },
      error: (err) => {
        this.claimLoading.set(false);
        this.toastService.error(err.error?.message || 'Preuzimanje kupona nije uspelo');
      },
    });
  }

  dismissCoupon(): void {
    this.claimedCoupon.set(null);
  }

  toggleSave(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/auth/login']);
      return;
    }
    const d = this.discount();
    if (!d) return;

    if (this.isSaved()) {
      this.userService.removeSavedDiscount(d.id).subscribe(() => {
        this.isSaved.set(false);
        this.toastService.success('Uklonjeno iz sačuvanih');
      });
    } else {
      this.userService.saveDiscount(d.id).subscribe(() => {
        this.isSaved.set(true);
        this.toastService.success('Popust sačuvan');
      });
    }
  }

  private checkFavorite(discount: Discount): void {
    this.userService.isFavorite(discount.business.id).subscribe({
      next: (fav) => this.isFavorite.set(fav),
    });
  }

  private checkSaved(discount: Discount): void {
    this.userService.isSaved(discount.id).subscribe({
      next: (saved) => this.isSaved.set(saved),
    });
  }
}
