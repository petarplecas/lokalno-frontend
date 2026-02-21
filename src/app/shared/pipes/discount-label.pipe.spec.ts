import { DiscountLabelPipe } from './discount-label.pipe';
import { DiscountType } from '../../core/models';

describe('DiscountLabelPipe', () => {
  let pipe: DiscountLabelPipe;

  beforeEach(() => {
    pipe = new DiscountLabelPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  describe('PERCENT', () => {
    it('should return -X%', () => {
      expect(pipe.transform(DiscountType.PERCENT, 20)).toBe('-20%');
    });

    it('should work with any value', () => {
      expect(pipe.transform(DiscountType.PERCENT, 50)).toBe('-50%');
    });
  });

  describe('FIXED', () => {
    it('should return -X RSD', () => {
      expect(pipe.transform(DiscountType.FIXED, 100)).toBe('-100 RSD');
    });

    it('should work with any value', () => {
      expect(pipe.transform(DiscountType.FIXED, 250)).toBe('-250 RSD');
    });
  });

  describe('NEW_PRICE', () => {
    it('should return X RSD when newPrice is provided', () => {
      expect(pipe.transform(DiscountType.NEW_PRICE, undefined, 500)).toBe('500 RSD');
    });

    it('should return Nova cena when newPrice is null', () => {
      expect(pipe.transform(DiscountType.NEW_PRICE, undefined, null)).toBe('Nova cena');
    });

    it('should return Nova cena when newPrice is undefined', () => {
      expect(pipe.transform(DiscountType.NEW_PRICE, undefined, undefined)).toBe('Nova cena');
    });

    it('should return Nova cena when called with no extra args', () => {
      expect(pipe.transform(DiscountType.NEW_PRICE)).toBe('Nova cena');
    });

    it('should use newPrice even when value is also provided', () => {
      expect(pipe.transform(DiscountType.NEW_PRICE, 0, 1200)).toBe('1200 RSD');
    });
  });

  describe('BOGO', () => {
    it('should return 1+1', () => {
      expect(pipe.transform(DiscountType.BOGO)).toBe('1+1');
    });
  });

  describe('default / unknown', () => {
    it('should return empty string for unknown type', () => {
      expect(pipe.transform('UNKNOWN' as DiscountType)).toBe('');
    });
  });
});
