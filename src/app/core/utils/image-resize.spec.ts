import { resizeImage } from './image-resize';

// Mock canvas and image
const mockDrawImage = jest.fn();
const mockToBlob = jest.fn();
const mockGetContext = jest.fn().mockReturnValue({ drawImage: mockDrawImage });

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: mockGetContext,
  toBlob: mockToBlob,
};

jest
  .spyOn(document, 'createElement')
  .mockReturnValue(mockCanvas as unknown as HTMLCanvasElement);

const mockRevokeObjectURL = jest.fn();
const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });

describe('resizeImage', () => {
  let mockFile: File;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFile = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
  });

  function triggerImageLoad(width: number, height: number): void {
    const img = (window as unknown as { _lastImage: HTMLImageElement })
      ._lastImage;
    Object.defineProperty(img, 'width', { value: width, configurable: true });
    Object.defineProperty(img, 'height', { value: height, configurable: true });
    img.onload?.(new Event('load'));
  }

  beforeAll(() => {
    // Intercept Image constructor to capture onload
    const OrigImage = window.Image;
    jest.spyOn(window, 'Image').mockImplementation(() => {
      const img = new OrigImage();
      (window as unknown as { _lastImage: HTMLImageElement })._lastImage = img;
      return img;
    });
  });

  it('should resolve with a WebP blob when supported', async () => {
    const webpBlob = new Blob(['webp'], { type: 'image/webp' });

    mockToBlob.mockImplementation(
      (callback: BlobCallback, _type: string) => {
        callback(webpBlob);
      },
    );

    const promise = resizeImage(mockFile);
    triggerImageLoad(400, 300);

    const result = await promise;
    expect(result).toBe(webpBlob);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should fallback to JPEG when WebP returns null', async () => {
    const jpegBlob = new Blob(['jpeg'], { type: 'image/jpeg' });
    let callCount = 0;

    mockToBlob.mockImplementation(
      (callback: BlobCallback, type: string) => {
        callCount++;
        if (callCount === 1) {
          // WebP attempt returns null
          callback(null);
        } else {
          // JPEG fallback
          expect(type).toBe('image/jpeg');
          callback(jpegBlob);
        }
      },
    );

    const promise = resizeImage(mockFile);
    triggerImageLoad(400, 300);

    const result = await promise;
    expect(result).toBe(jpegBlob);
  });

  it('should resize images wider than maxWidth', async () => {
    const blob = new Blob(['data'], { type: 'image/webp' });
    mockToBlob.mockImplementation((callback: BlobCallback) => callback(blob));

    const promise = resizeImage(mockFile, 800);
    triggerImageLoad(1600, 1200);

    await promise;

    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(600);
  });

  it('should not upscale images smaller than maxWidth', async () => {
    const blob = new Blob(['data'], { type: 'image/webp' });
    mockToBlob.mockImplementation((callback: BlobCallback) => callback(blob));

    const promise = resizeImage(mockFile, 800);
    triggerImageLoad(400, 300);

    await promise;

    expect(mockCanvas.width).toBe(400);
    expect(mockCanvas.height).toBe(300);
  });

  it('should reject when canvas context is unavailable', async () => {
    mockGetContext.mockReturnValueOnce(null);

    const promise = resizeImage(mockFile);
    triggerImageLoad(400, 300);

    await expect(promise).rejects.toThrow('Canvas 2D context not available');
  });

  it('should reject when image fails to load', async () => {
    const promise = resizeImage(mockFile);

    const img = (window as unknown as { _lastImage: HTMLImageElement })
      ._lastImage;
    img.onerror?.(new Event('error'));

    await expect(promise).rejects.toThrow('Failed to load image');
  });
});
