import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'guest-viewed-discounts';
const DISMISS_KEY = 'guest-badge-dismissed';
const THRESHOLD = 5;
const DISMISS_DAYS = 7;

@Injectable({ providedIn: 'root' })
export class GuestTrackerService {
  private readonly auth = inject(AuthService);
  private readonly viewedCount = signal(this.loadCount());
  private readonly dismissed = signal(this.isDismissed());

  readonly shouldShowBadge = computed(
    () =>
      !this.auth.isAuthenticated() &&
      this.viewedCount() >= THRESHOLD &&
      !this.dismissed(),
  );

  trackView(discountId: string): void {
    if (this.auth.isAuthenticated()) return;
    const viewed = this.loadViewed();
    if (viewed.has(discountId)) return;
    viewed.add(discountId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...viewed]));
    this.viewedCount.set(viewed.size);
  }

  dismiss(): void {
    this.dismissed.set(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  private loadViewed(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  }

  private loadCount(): number {
    return this.loadViewed().size;
  }

  private isDismissed(): boolean {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const elapsed = Date.now() - parseInt(ts, 10);
    const limit = DISMISS_DAYS * 24 * 60 * 60 * 1000;
    if (elapsed > limit) {
      localStorage.removeItem(DISMISS_KEY);
      return false;
    }
    return true;
  }
}
