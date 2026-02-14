import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  readonly activeToasts = this.toasts.asReadonly();
  readonly hasToasts = computed(() => this.toasts().length > 0);

  success(message: string): void {
    this.addToast(message, 'success');
  }

  error(message: string): void {
    this.addToast(message, 'error');
  }

  info(message: string): void {
    this.addToast(message, 'info');
  }

  warning(message: string): void {
    this.addToast(message, 'warning');
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private addToast(message: string, type: Toast['type']): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, message, type }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => this.dismiss(id), 5000);
  }
}
