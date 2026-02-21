import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/upload`;

  getPresignedUrl(
    folder: string,
    contentType: string,
    filename: string,
  ): Observable<PresignedUrlResponse> {
    return this.http.post<PresignedUrlResponse>(`${this.url}/presigned-url`, {
      folder,
      contentType,
      filename,
    });
  }

  uploadToS3(uploadUrl: string, blob: Blob, contentType: string): Observable<void> {
    return this.http.put<void>(uploadUrl, blob, {
      headers: { 'Content-Type': contentType },
    });
  }
}
