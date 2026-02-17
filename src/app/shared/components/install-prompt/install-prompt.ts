import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-install-prompt',
  templateUrl: './install-prompt.html',
  styleUrl: './install-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallPrompt {
  protected readonly pwa = inject(PwaInstallService);

  async install(): Promise<void> {
    await this.pwa.promptInstall();
  }

  dismiss(): void {
    this.pwa.dismiss();
  }
}
