import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { SavedDiscountItem } from '../../../core/models';
import { DiscountLabelPipe } from '../../../shared/pipes/discount-label.pipe';
import { BackButton } from '../../../shared/components/back-button/back-button';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-saved-discounts',
  imports: [DiscountLabelPipe, BackButton, Spinner, EmptyState],
  templateUrl: './saved-discounts.html',
  styleUrl: './saved-discounts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedDiscounts implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly discounts = signal<SavedDiscountItem[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.userService.getSavedDiscounts().subscribe({
      next: (res) => {
        this.discounts.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToDiscount(id: string): void {
    void this.router.navigate(['/discounts', id]);
  }
}
