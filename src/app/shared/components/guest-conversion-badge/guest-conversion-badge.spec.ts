import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GuestConversionBadge } from './guest-conversion-badge';
import { GuestTrackerService } from '../../../core/services/guest-tracker.service';

describe('GuestConversionBadge', () => {
  const mockTracker = {
    shouldShowBadge: jest.fn(() => true),
    dismiss: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestConversionBadge],
      providers: [
        provideRouter([]),
        { provide: GuestTrackerService, useValue: mockTracker },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    mockTracker.dismiss.mockReset();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GuestConversionBadge);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render register and login links', () => {
    const fixture = TestBed.createComponent(GuestConversionBadge);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('a');
    const hrefs = Array.from(links).map((a: Element) => (a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toContain('/auth/register');
    expect(hrefs).toContain('/auth/login');
  });

  it('should call tracker.dismiss() on close button click', () => {
    const fixture = TestBed.createComponent(GuestConversionBadge);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.gcb__dismiss') as HTMLButtonElement;
    btn.click();
    expect(mockTracker.dismiss).toHaveBeenCalledTimes(1);
  });
});
