import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButton {
  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
