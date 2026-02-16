import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Location } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { BackButton } from '../../../shared/components/back-button/back-button';
import { Spinner } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, BackButton, Spinner],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePassword {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly location = inject(Location);

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.passwordMatchValidator] },
  );

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPass = control.get('newPassword');
    const confirm = control.get('confirmPassword');
    if (newPass && confirm && newPass.value !== confirm.value) {
      confirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.success('Lozinka je promenjena');
        this.location.back();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Greška pri promeni lozinke');
      },
    });
  }
}
