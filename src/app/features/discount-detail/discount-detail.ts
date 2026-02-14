import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DiscountService } from '../../core/services/discount.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Discount, ClaimCouponResponse } from '../../core/models';
import { DiscountLabelPipe } from '../../shared/pipes/discount-label.pipe';
import { Spinner } from '../../shared/components/spinner/spinner';
import { BackButton } from '../../shared/components/back-button/back-button';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-discount-detail',
  imports: [DatePipe, DiscountLabelPipe, Spinner, BackButton, ConfirmDialog],
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
  readonly isSaved = signal(false);
  readonly isFavorite = signal(false);
  readonly showClaimDialog = signal(false);
  readonly claimLoading = signal(false);
  readonly claimedCoupon = signal<ClaimCouponResponse['coupon'] | null>(null);

  readonly isAuthenticated = this.authService.isAuthenticated;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.discountService.getDiscount(id).subscribe({
      next: (discount) => {
        this.discount.set(discount);
        this.loading.set(false);
        if (this.isAuthenticated()) {
          this.checkSavedAndFavorite(discount);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Popust nije pronađen');
      },
    });
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
        this.toastService.success('Sačuvano');
      });
    }
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

  private checkSavedAndFavorite(discount: Discount): void {
    this.userService.isSaved(discount.id).subscribe({
      next: (saved) => this.isSaved.set(saved),
    });
    this.userService.isFavorite(discount.business.id).subscribe({
      next: (fav) => this.isFavorite.set(fav),
    });
  }
}
