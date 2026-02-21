import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { UploadService } from './upload.service';
import { environment } from '../../../environments/environment';

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;

  const uploadUrl = `${environment.apiUrl}/upload`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
      teardown: { destroyAfterEach: true },
    });

    service = TestBed.inject(UploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPresignedUrl', () => {
    it('should POST to /upload/presigned-url with correct body', () => {
      const mockResponse = {
        uploadUrl: 'https://bucket.s3.amazonaws.com/signed',
        fileUrl: 'https://bucket.s3.amazonaws.com/discounts/uuid-img.webp',
      };

      service
        .getPresignedUrl('discounts', 'image/webp', 'img.webp')
        .subscribe((result) => {
          expect(result).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(`${uploadUrl}/presigned-url`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        folder: 'discounts',
        contentType: 'image/webp',
        filename: 'img.webp',
      });

      req.flush(mockResponse);
    });

    it('should handle logos folder', () => {
      service
        .getPresignedUrl('logos', 'image/png', 'logo.png')
        .subscribe();

      const req = httpMock.expectOne(`${uploadUrl}/presigned-url`);
      expect(req.request.body.folder).toBe('logos');
      req.flush({ uploadUrl: 'https://signed', fileUrl: 'https://file' });
    });
  });

  describe('uploadToS3', () => {
    it('should PUT blob to the presigned URL with correct content type', () => {
      const s3Url = 'https://bucket.s3.amazonaws.com/discounts/uuid-img.webp?X-Amz-Signature=abc';
      const blob = new Blob(['test'], { type: 'image/webp' });

      service.uploadToS3(s3Url, blob, 'image/webp').subscribe();

      const req = httpMock.expectOne(s3Url);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Content-Type')).toBe('image/webp');
      expect(req.request.body).toBe(blob);

      req.flush(null);
    });

    it('should handle upload errors', () => {
      const s3Url = 'https://bucket.s3.amazonaws.com/signed';
      const blob = new Blob(['test']);

      let errorResult: unknown;
      service.uploadToS3(s3Url, blob, 'image/webp').subscribe({
        error: (err) => (errorResult = err),
      });

      const req = httpMock.expectOne(s3Url);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(errorResult).toBeTruthy();
    });
  });
});
