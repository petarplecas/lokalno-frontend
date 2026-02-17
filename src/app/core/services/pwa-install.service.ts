import { Injectable, signal, computed } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly dismissed = signal(this.isDismissed());
  private readonly installed = signal(false);

  readonly canInstall = computed(
    () => this.deferredPrompt() !== null && !this.dismissed() && !this.installed(),
  );

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt.set(e as BeforeInstallPromptEvent);
    });

    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.deferredPrompt.set(null);
    });
  }

  async promptInstall(): Promise<boolean> {
    const prompt = this.deferredPrompt();
    if (!prompt) return false;

    await prompt.prompt();
    const result = await prompt.userChoice;
    this.deferredPrompt.set(null);
    return result.outcome === 'accepted';
  }

  dismiss(): void {
    this.dismissed.set(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }

  private isDismissed(): boolean {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return false;
    const elapsed = Date.now() - parseInt(dismissed, 10);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (elapsed > sevenDays) {
      localStorage.removeItem('pwa-install-dismissed');
      return false;
    }
    return true;
  }
}
