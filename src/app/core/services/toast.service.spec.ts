import { TestBed } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jest.useFakeTimers();

    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no toasts', () => {
    expect(service.activeToasts()).toEqual([]);
    expect(service.hasToasts()).toBe(false);
  });

  // ============================================
  // ADDING TOASTS
  // ============================================
  describe('adding toasts', () => {
    it('should add a success toast', () => {
      service.success('Operation successful');

      const toasts = service.activeToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Operation successful');
      expect(toasts[0].type).toBe('success');
      expect(service.hasToasts()).toBe(true);
    });

    it('should add an error toast', () => {
      service.error('Something went wrong');

      const toasts = service.activeToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Something went wrong');
      expect(toasts[0].type).toBe('error');
    });

    it('should add an info toast', () => {
      service.info('FYI');

      const toasts = service.activeToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('FYI');
      expect(toasts[0].type).toBe('info');
    });

    it('should add a warning toast', () => {
      service.warning('Be careful');

      const toasts = service.activeToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Be careful');
      expect(toasts[0].type).toBe('warning');
    });

    it('should assign unique ids to each toast', () => {
      service.success('First');
      service.error('Second');
      service.info('Third');

      const toasts = service.activeToasts();
      const ids = toasts.map((t) => t.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should accumulate multiple toasts', () => {
      service.success('One');
      service.error('Two');
      service.warning('Three');

      expect(service.activeToasts()).toHaveLength(3);
      expect(service.hasToasts()).toBe(true);
    });
  });

  // ============================================
  // DISMISSING TOASTS
  // ============================================
  describe('dismissing toasts', () => {
    it('should dismiss a toast by id', () => {
      service.success('First');
      service.error('Second');

      const toasts = service.activeToasts();
      service.dismiss(toasts[0].id);

      expect(service.activeToasts()).toHaveLength(1);
      expect(service.activeToasts()[0].message).toBe('Second');
    });

    it('should set hasToasts to false when all dismissed', () => {
      service.success('Only one');

      const id = service.activeToasts()[0].id;
      service.dismiss(id);

      expect(service.activeToasts()).toEqual([]);
      expect(service.hasToasts()).toBe(false);
    });

    it('should not throw when dismissing non-existent id', () => {
      service.success('Toast');
      expect(() => service.dismiss(999)).not.toThrow();
      expect(service.activeToasts()).toHaveLength(1);
    });
  });

  // ============================================
  // AUTO-DISMISS
  // ============================================
  describe('auto-dismiss', () => {
    it('should auto-dismiss after 5 seconds', () => {
      service.success('Will disappear');

      expect(service.activeToasts()).toHaveLength(1);

      jest.advanceTimersByTime(4999);
      expect(service.activeToasts()).toHaveLength(1);

      jest.advanceTimersByTime(1);
      expect(service.activeToasts()).toHaveLength(0);
    });

    it('should auto-dismiss each toast independently', () => {
      service.success('First');

      jest.advanceTimersByTime(2000);
      service.error('Second');

      // At 5000ms: first should be gone, second still there
      jest.advanceTimersByTime(3000);
      expect(service.activeToasts()).toHaveLength(1);
      expect(service.activeToasts()[0].message).toBe('Second');

      // At 7000ms: second should also be gone
      jest.advanceTimersByTime(2000);
      expect(service.activeToasts()).toHaveLength(0);
    });
  });
});
