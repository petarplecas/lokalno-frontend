import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ToastContainer } from './shared/components/toast-container/toast-container';
import { Spinner } from './shared/components/spinner/spinner';
import { InstallPrompt } from './shared/components/install-prompt/install-prompt';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, Spinner, InstallPrompt],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authService = inject(AuthService);

  readonly isInitialized = this.authService.isInitialized;
}
