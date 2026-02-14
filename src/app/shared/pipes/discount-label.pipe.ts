import { Pipe, PipeTransform } from '@angular/core';
import { DiscountType } from '../../core/models';

@Pipe({ name: 'discountLabel' })
export class DiscountLabelPipe implements PipeTransform {
  transform(type: DiscountType, value?: number): string {
    switch (type) {
      case DiscountType.PERCENT:
        return `-${value}%`;
      case DiscountType.FIXED:
        return `-${value} RSD`;
      case DiscountType.NEW_PRICE:
        return `${value} RSD`;
      case DiscountType.BOGO:
        return '1+1';
      case DiscountType.COUPON:
        return 'Kupon';
    }
  }
}
