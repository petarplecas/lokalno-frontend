import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Discount } from '../../../core/models';
import { DiscountLabelPipe } from '../../pipes/discount-label.pipe';

@Component({
  selector: 'app-discount-card',
  imports: [DiscountLabelPipe],
  templateUrl: './discount-card.html',
  styleUrl: './discount-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountCard {
  readonly discount = input.required<Discount>();

  readonly clicked = output<Discount>();

  onClick(): void {
    this.clicked.emit(this.discount());
  }
}
