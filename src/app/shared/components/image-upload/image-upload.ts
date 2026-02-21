import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  ElementRef,
  viewChild,
  effect,
  computed,
} from '@angular/core';
import { Spinner } from '../spinner/spinner';

export interface PendingImageBlob {
  blob: Blob;
  contentType: string;
  filename: string;
}

const CROP_W = 800;
const CROP_H = 450; // 16:9

@Component({
  selector: 'app-image-upload',
  imports: [Spinner],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUpload {
  readonly folder = input<'discounts' | 'logos'>('discounts');
  readonly currentUrl = input<string | null | undefined>(null);
  readonly pendingBlob = output<PendingImageBlob | null>();

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly preview = signal<string | null>(null);
  readonly processing = signal(false);
  readonly error = signal<string | null>(null);
  readonly dragOver = signal(false);

  // Crop editor state
  // Model: imgX/imgY = position of image top-left in container pixels
  //        scale = zoom factor, applied at transform-origin: 0 0
  // Transform applied: translate(imgX, imgY) scale(scale)
  readonly cropMode = signal(false);
  readonly cropImageSrc = signal<string | null>(null);
  readonly cropScale = signal(1);
  // imgX, imgY: top-left of image in container coordinates
  readonly cropImgX = signal(0);
  readonly cropImgY = signal(0);

  // Exposed as computed for template binding
  readonly cropTransform = computed(
    () =>
      `translate(${this.cropImgX()}px, ${this.cropImgY()}px) scale(${this.cropScale()})`,
  );

  readonly cropMinScale = signal(1);

  private originalFile: File | null = null;
  private cropImg: HTMLImageElement | null = null;
  private isDragging = false;
  private dragStartClientX = 0;
  private dragStartClientY = 0;
  private dragStartImgX = 0;
  private dragStartImgY = 0;
  private minScale = 1;

  constructor() {
    effect(() => {
      const url = this.currentUrl();
      if (url && !this.preview()) {
        this.preview.set(url);
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
  }

  openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  // ─── Crop editor ─────────────────────────────────────────

  onCropImgLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.cropImg = img;
    const container = img.parentElement;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // minScale: smallest zoom where image fully covers container
    const sw = cw / img.naturalWidth;
    const sh = ch / img.naturalHeight;
    this.minScale = Math.max(sw, sh);
    this.cropMinScale.set(this.minScale);

    // Start centered
    this.applyScaleAndCenter(this.minScale);
  }

  onCropPointerDown(event: PointerEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.isDragging = true;
    this.dragStartClientX = event.clientX;
    this.dragStartClientY = event.clientY;
    this.dragStartImgX = this.cropImgX();
    this.dragStartImgY = this.cropImgY();
  }

  onCropPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.dragStartClientX;
    const dy = event.clientY - this.dragStartClientY;
    const scale = this.cropScale();
    this.cropImgX.set(this.clampImgX(this.dragStartImgX + dx, scale));
    this.cropImgY.set(this.clampImgY(this.dragStartImgY + dy, scale));
  }

  onCropPointerUp(): void {
    this.isDragging = false;
  }

  onCropWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    this.changeScale(this.cropScale() + delta, event.offsetX, event.offsetY);
  }

  onZoomChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    const container = this.cropImg?.parentElement;
    const cx = container ? container.clientWidth / 2 : 0;
    const cy = container ? container.clientHeight / 2 : 0;
    this.changeScale(value, cx, cy);
  }

  resetCrop(): void {
    this.applyScaleAndCenter(this.minScale);
  }

  cancelCrop(): void {
    this.cropMode.set(false);
    this.cropImageSrc.set(null);
    this.originalFile = null;
    this.cropImg = null;
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }

  async confirmCrop(): Promise<void> {
    if (!this.originalFile) return;
    this.processing.set(true);
    try {
      const blob = await this.exportCrop();
      const filename = this.originalFile.name.replace(/\.[^.]+$/, '') + '.webp';
      this.preview.set(URL.createObjectURL(blob));
      this.cropMode.set(false);
      this.pendingBlob.emit({ blob, contentType: 'image/webp', filename });
    } catch {
      this.error.set('Greška pri obradi slike');
    } finally {
      this.processing.set(false);
    }
  }

  // ─── Private helpers ─────────────────────────────────────

  private async processFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.error.set('Izaberite sliku (JPEG, PNG ili WebP)');
      return;
    }
    this.error.set(null);
    this.originalFile = file;
    this.cropImg = null;
    this.cropImageSrc.set(URL.createObjectURL(file));
    this.cropMode.set(true);
  }

  /**
   * Set scale and re-center image in container.
   * pivot: container-space point that should stay fixed during zoom.
   */
  private changeScale(newScale: number, pivotX: number, pivotY: number): void {
    const clamped = Math.min(3, Math.max(this.minScale, newScale));
    const oldScale = this.cropScale();

    // Current imgX/Y, adjust so pivotX/Y stays fixed
    const oldImgX = this.cropImgX();
    const oldImgY = this.cropImgY();

    // Point in image coords that corresponds to pivot in container coords
    // imageCoord = (pivotContainer - imgX) / oldScale
    const imageCoordX = (pivotX - oldImgX) / oldScale;
    const imageCoordY = (pivotY - oldImgY) / oldScale;

    // New imgX/Y so that same image point stays at pivot
    const newImgX = pivotX - imageCoordX * clamped;
    const newImgY = pivotY - imageCoordY * clamped;

    this.cropScale.set(clamped);
    this.cropImgX.set(this.clampImgX(newImgX, clamped));
    this.cropImgY.set(this.clampImgY(newImgY, clamped));
  }

  /** Apply scale and center image in container. */
  private applyScaleAndCenter(scale: number): void {
    const img = this.cropImg;
    const container = img?.parentElement;
    if (!img || !container) return;

    const scaledW = img.naturalWidth * scale;
    const scaledH = img.naturalHeight * scale;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    this.cropScale.set(scale);
    this.cropImgX.set((cw - scaledW) / 2);
    this.cropImgY.set((ch - scaledH) / 2);
  }

  /** Clamp imgX so image fully covers container horizontally. */
  private clampImgX(imgX: number, scale: number): number {
    const img = this.cropImg;
    const container = img?.parentElement;
    if (!img || !container) return imgX;
    const scaledW = img.naturalWidth * scale;
    const cw = container.clientWidth;
    // imgX <= 0 (left edge of image at or left of container left)
    // imgX >= cw - scaledW (right edge of image at or right of container right)
    return Math.min(0, Math.max(cw - scaledW, imgX));
  }

  /** Clamp imgY so image fully covers container vertically. */
  private clampImgY(imgY: number, scale: number): number {
    const img = this.cropImg;
    const container = img?.parentElement;
    if (!img || !container) return imgY;
    const scaledH = img.naturalHeight * scale;
    const ch = container.clientHeight;
    return Math.min(0, Math.max(ch - scaledH, imgY));
  }

  private exportCrop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = this.cropImg;
      const container = img?.parentElement;
      if (!img || !container) { reject(new Error('No image')); return; }

      const scale = this.cropScale();
      const imgX = this.cropImgX();
      const imgY = this.cropImgY();

      // Model: image is at position (imgX, imgY) in container, scaled by `scale` from top-left.
      // transform: translate(imgX, imgY) scale(scale), transform-origin: 0 0
      //
      // Container top-left (0,0) corresponds to image natural coords:
      //   srcX = (0 - imgX) / scale
      //   srcY = (0 - imgY) / scale
      // Width/height of visible area in natural coords:
      //   srcW = containerW / scale
      //   srcH = containerH / scale
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const srcX = -imgX / scale;
      const srcY = -imgY / scale;
      const srcW = containerW / scale;
      const srcH = containerH / scale;

      const canvas = document.createElement('canvas');
      canvas.width = CROP_W;
      canvas.height = CROP_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CROP_W, CROP_H);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas export failed'));
        },
        'image/webp',
        0.82,
      );
    });
  }
}
