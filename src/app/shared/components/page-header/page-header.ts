import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  private readonly location = inject(Location);

  readonly title = input.required<string>();

  goBack(): void {
    this.location.back();
  }
}
