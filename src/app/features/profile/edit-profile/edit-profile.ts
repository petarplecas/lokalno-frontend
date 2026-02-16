import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { BackButton } from '../../../shared/components/back-button/back-button';
import { Spinner } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule, BackButton, Spinner],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly location = inject(Location);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    city: [''],
  });

  readonly loading = signal(false);

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        city: user.city ?? '',
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { firstName, lastName, city } = this.form.getRawValue();

    this.userService
      .updateProfile({ firstName, lastName, city: city || undefined })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastService.success('Profil je ažuriran');
          this.location.back();
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.error(err.error?.message || 'Greška pri ažuriranju');
        },
      });
  }
}
