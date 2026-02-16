import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spinner {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
