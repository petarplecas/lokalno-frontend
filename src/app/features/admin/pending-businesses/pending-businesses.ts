import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { BusinessListItem, BusinessStatus } from '../../../core/models/business.model';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

interface StatusTab {
  label: string;
  status: BusinessStatus | null;
}

@Component({
  selector: 'app-pending-businesses',
  imports: [RouterLink, Spinner, EmptyState],
  templateUrl: './pending-businesses.html',
  styleUrl: './pending-businesses.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingBusinesses implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly tabs: StatusTab[] = [
    { label: 'Na čekanju', status: BusinessStatus.PENDING },
    { label: 'Odobreni', status: BusinessStatus.APPROVED },
    { label: 'Suspendovani', status: BusinessStatus.SUSPENDED },
    { label: 'Svi', status: null },
  ];

  readonly activeTab = signal(0);
  readonly businesses = signal<BusinessListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);

  ngOnInit(): void {
    this.loadBusinesses();
  }

  selectTab(index: number): void {
    this.activeTab.set(index);
    this.currentPage.set(1);
    this.loadBusinesses();
  }

  loadBusinesses(): void {
    this.loading.set(true);
    this.error.set(false);
    const tab = this.tabs[this.activeTab()];
    const page = this.currentPage();

    const onNext = (res: { data: BusinessListItem[]; meta: { totalPages: number; total: number } }) => {
      this.businesses.set(res.data);
      this.totalPages.set(res.meta.totalPages);
      this.total.set(res.meta.total);
      this.loading.set(false);
    };
    const onError = () => {
      this.error.set(true);
      this.loading.set(false);
    };

    if (tab.status === BusinessStatus.PENDING) {
      this.adminService.getPendingBusinesses(page).subscribe({ next: onNext, error: onError });
    } else {
      this.adminService.getAllBusinesses(page, 20, tab.status ?? undefined).subscribe({ next: onNext, error: onError });
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadBusinesses();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadBusinesses();
    }
  }

  statusLabel(status: BusinessStatus): string {
    switch (status) {
      case BusinessStatus.PENDING:
        return 'Na čekanju';
      case BusinessStatus.APPROVED:
        return 'Odobren';
      case BusinessStatus.SUSPENDED:
        return 'Suspendovan';
    }
  }
}
