import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/user.model';
import { Spinner } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Spinner],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: (user) => {
        this.loading.set(false);
        switch (user.role) {
          case Role.BUSINESS:
            void this.router.navigate(['/business/dashboard']);
            break;
          case Role.ADMIN:
            void this.router.navigate(['/admin/businesses']);
            break;
          default:
            void this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message || 'Prijava nije uspela. Pokušajte ponovo.',
        );
      },
    });
  }
}
