import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { ToastService } from '../../../core/services/toast.service';
import { BUSINESS_CATEGORIES, MyBusiness } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { BackButton } from '../../../shared/components/back-button/back-button';

@Component({
  selector: 'app-edit-business-profile',
  imports: [ReactiveFormsModule, Spinner, BackButton],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditBusinessProfile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly businessService = inject(BusinessService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly categories = BUSINESS_CATEGORIES;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    category: ['', [Validators.required]],
    subCategory: [''],
    description: ['', [Validators.maxLength(500)]],
    address: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    website: [''],
  });

  ngOnInit(): void {
    this.businessService.getMyBusiness().subscribe({
      next: (biz) => this.populateForm(biz),
      error: () => {
        this.loading.set(false);
        this.error.set('Greška pri učitavanju podataka');
      },
    });
  }

  private populateForm(biz: MyBusiness): void {
    this.form.patchValue({
      name: biz.name,
      category: biz.category,
      subCategory: biz.subCategory ?? '',
      description: biz.description ?? '',
      address: biz.address,
      phone: biz.phone,
      website: biz.website ?? '',
    });
    this.loading.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();

    this.businessService
      .updateMyBusiness({
        name: v.name,
        category: v.category,
        subCategory: v.subCategory || undefined,
        description: v.description || undefined,
        address: v.address,
        phone: v.phone,
        website: v.website || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.success('Profil biznisa je ažuriran!');
          void this.router.navigate(['/business/dashboard']);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'Ažuriranje nije uspelo');
        },
      });
  }
}
