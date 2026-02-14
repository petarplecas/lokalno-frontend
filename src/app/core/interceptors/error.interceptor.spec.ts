import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
      teardown: { destroyAfterEach: true },
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through successful responses', () => {
    let result: unknown;
    http.get('/api/test').subscribe((res) => (result = res));

    httpMock.expectOne('/api/test').flush({ ok: true });
    expect(result).toEqual({ ok: true });
    expect(toastService.activeToasts()).toHaveLength(0);
  });

  it('should NOT show toast for 401 errors', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(toastService.activeToasts()).toHaveLength(0);
  });

  it('should show toast for 403 errors', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .flush(null, { status: 403, statusText: 'Forbidden' });

    const toasts = toastService.activeToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Nemate dozvolu za ovu akciju.');
    expect(toasts[0].type).toBe('error');
  });

  it('should show toast for 404 errors', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .flush(null, { status: 404, statusText: 'Not Found' });

    const toasts = toastService.activeToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Traženi resurs nije pronađen.');
  });

  it('should show toast for 500 errors', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .flush(null, { status: 500, statusText: 'Server Error' });

    const toasts = toastService.activeToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Greška na serveru. Pokušajte ponovo.');
  });

  it('should show toast for 502/503 server errors', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .flush(null, { status: 502, statusText: 'Bad Gateway' });

    const toasts = toastService.activeToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Greška na serveru. Pokušajte ponovo.');
  });

  it('should show network error toast for status 0', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .error(new ProgressEvent('error'), { status: 0, statusText: '' });

    const toasts = toastService.activeToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe(
      'Nema konekcije sa serverom. Proverite internet vezu.',
    );
  });

  it('should extract backend error message from response body', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .flush(
        { message: 'Email is already taken' },
        { status: 409, statusText: 'Conflict' },
      );

    const toasts = toastService.activeToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Email is already taken');
  });

  it('should extract first message from array', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .flush(
        { message: ['Field is required', 'Field must be email'] },
        { status: 400, statusText: 'Bad Request' },
      );

    const toasts = toastService.activeToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Field is required');
  });

  it('should show default message when no body message', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/test')
      .flush(null, { status: 422, statusText: 'Unprocessable' });

    const toasts = toastService.activeToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Došlo je do greške. Pokušajte ponovo.');
  });

  it('should re-throw the error to downstream subscribers', () => {
    let caughtError: unknown;
    http.get('/api/test').subscribe({ error: (err) => (caughtError = err) });

    httpMock
      .expectOne('/api/test')
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(caughtError).toBeDefined();
  });
});
