import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { ToastService } from '../../../core/services/toast.service';
import { BUSINESS_CATEGORIES } from '../../../core/models';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { MapPicker, SelectedLocation } from '../../../shared/components/map-picker/map-picker';

@Component({
  selector: 'app-business-register',
  imports: [ReactiveFormsModule, Spinner, MapPicker],
  templateUrl: './business-register.html',
  styleUrl: './business-register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessRegister {
  private readonly fb = inject(FormBuilder);
  private readonly businessService = inject(BusinessService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly categories = BUSINESS_CATEGORIES;
  readonly currentStep = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly steps = [
    'Nalog',
    'Naziv',
    'Kategorija',
    'Adresa',
    'Kontakt',
    'Pregled',
  ];

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['', [Validators.required]],
    subCategory: [''],
    address: ['', [Validators.required]],
    latitude: [44.8176, [Validators.required]],
    longitude: [20.4633, [Validators.required]],
    phone: ['', [Validators.required]],
    website: [''],
  });

  private readonly stepFields: string[][] = [
    ['email', 'password', 'firstName', 'lastName'],
    ['name'],
    ['category'],
    ['address', 'latitude', 'longitude'],
    ['phone'],
    [],
  ];

  onLocationSelected(loc: SelectedLocation): void {
    this.form.patchValue({
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
    });
  }

  isStepValid(step?: number): boolean {
    const fields = this.stepFields[step ?? this.currentStep()];
    return fields.every((f) => this.form.get(f)?.valid ?? true);
  }

  private findFirstInvalidStep(): number | null {
    for (let i = 0; i < this.stepFields.length; i++) {
      if (!this.isStepValid(i)) {
        this.stepFields[i].forEach((f) => this.form.get(f)?.markAsTouched());
        return i;
      }
    }
    return null;
  }

  next(): void {
    if (!this.isStepValid()) {
      const fields = this.stepFields[this.currentStep()];
      fields.forEach((f) => this.form.get(f)?.markAsTouched());
      return;
    }
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prev(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  onSubmit(): void {
    const invalidStep = this.findFirstInvalidStep();
    if (invalidStep !== null) {
      this.currentStep.set(invalidStep);
      this.error.set('Popunite obavezna polja na koraku ' + this.steps[invalidStep]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();

    this.businessService
      .registerBusiness({
        email: v.email,
        password: v.password,
        firstName: v.firstName,
        lastName: v.lastName,
        name: v.name,
        category: v.category,
        subCategory: v.subCategory || v.category,
        address: v.address,
        latitude: v.latitude,
        longitude: v.longitude,
        phone: v.phone,
        website: v.website || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastService.success('Registracija uspešna! Prijavite se.');
          void this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Registracija nije uspela');
        },
      });
  }
}
