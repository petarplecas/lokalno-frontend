import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { MyBusiness, BusinessStats } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Spinner],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly businessService = inject(BusinessService);

  readonly business = signal<MyBusiness | null>(null);
  readonly stats = signal<BusinessStats | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.businessService.getMyBusiness().subscribe({
      next: (biz) => {
        this.business.set(biz);
        this.loadStats();
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
}
