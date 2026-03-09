import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GuestTrackerService } from '../../../core/services/guest-tracker.service';

@Component({
  selector: 'app-guest-conversion-badge',
  imports: [RouterLink],
  templateUrl: './guest-conversion-badge.html',
  styleUrl: './guest-conversion-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestConversionBadge {
  protected readonly tracker = inject(GuestTrackerService);

  dismiss(): void {
    this.tracker.dismiss();
  }
}
