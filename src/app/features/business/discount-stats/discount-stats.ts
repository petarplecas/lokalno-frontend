import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DiscountService } from '../../../core/services/discount.service';
import { DiscountStats as DiscountStatsModel } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-discount-stats',
  imports: [RouterLink, Spinner, PageHeader],
  templateUrl: './discount-stats.html',
  styleUrl: './discount-stats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountStats implements OnInit {
  private readonly discountService = inject(DiscountService);
  private readonly route = inject(ActivatedRoute);

  readonly stats = signal<DiscountStatsModel | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  discountId = '';

  ngOnInit(): void {
    this.discountId = this.route.snapshot.params['id'];
    this.discountService.getDiscountStats(this.discountId).subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
