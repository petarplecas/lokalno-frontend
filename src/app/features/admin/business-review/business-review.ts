import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessDetail, BusinessStatus } from '../../../core/models/business.model';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { BackButton } from '../../../shared/components/back-button/back-button';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-business-review',
  imports: [DatePipe, Spinner, BackButton, ConfirmDialog],
  templateUrl: './business-review.html',
  styleUrl: './business-review.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessReview implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  readonly business = signal<BusinessDetail | null>(null);
  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly showApproveDialog = signal(false);
  readonly showRejectDialog = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading.set(true);
    this.adminService.getBusiness(id).subscribe({
      next: (biz) => {
        this.business.set(biz);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openApproveDialog(): void {
    this.showApproveDialog.set(true);
  }

  openRejectDialog(): void {
    this.showRejectDialog.set(true);
  }

  onApproveConfirm(confirmed: boolean): void {
    this.showApproveDialog.set(false);
    if (!confirmed) return;
    this.updateStatus(BusinessStatus.APPROVED);
  }

  onRejectConfirm(confirmed: boolean): void {
    this.showRejectDialog.set(false);
    if (!confirmed) return;
    this.updateStatus(BusinessStatus.SUSPENDED);
  }

  private updateStatus(status: BusinessStatus): void {
    const biz = this.business();
    if (!biz) return;

    this.actionLoading.set(true);
    this.adminService.updateBusinessStatus(biz.id, status).subscribe({
      next: () => {
        this.actionLoading.set(false);
        const label = status === BusinessStatus.APPROVED ? 'odobren' : 'suspendovan';
        this.toastService.success(`Biznis je ${label}.`);
        void this.router.navigate(['/admin/businesses']);
      },
      error: () => {
        this.actionLoading.set(false);
        this.toastService.error('Greška pri ažuriranju statusa.');
      },
    });
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
