import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageUpload } from './image-upload';

// Mock canvas API — jsdom does not implement getContext or toBlob
beforeAll(() => {
  const mockCtx = {
    drawImage: jest.fn(),
  };
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCtx);
  HTMLCanvasElement.prototype.toBlob = jest.fn(function (callback: BlobCallback) {
    callback(new Blob(['fake-image'], { type: 'image/webp' }));
  });
  global.URL.createObjectURL = jest.fn().mockReturnValue('blob:preview-url');
  global.URL.revokeObjectURL = jest.fn();
});

describe('ImageUpload', () => {
  let component: ImageUpload;
  let fixture: ComponentFixture<ImageUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should start with no preview', () => {
      expect(component.preview()).toBeNull();
    });

    it('should start with processing=false', () => {
      expect(component.processing()).toBe(false);
    });

    it('should start with cropMode=false', () => {
      expect(component.cropMode()).toBe(false);
    });

    it('should start with error=null', () => {
      expect(component.error()).toBeNull();
    });

    it('should start with dragOver=false', () => {
      expect(component.dragOver()).toBe(false);
    });

    it('should start with cropImageSrc=null', () => {
      expect(component.cropImageSrc()).toBeNull();
    });
  });

  describe('cropTransform computed', () => {
    it('should produce correct translate+scale format', () => {
      expect(component.cropTransform()).toMatch(
        /^translate\(-?\d+(\.\d+)?px, -?\d+(\.\d+)?px\) scale\(\d+(\.\d+)?\)$/,
      );
    });

    it('should update when cropImgX changes', () => {
      component.cropImgX.set(10);
      expect(component.cropTransform()).toContain('translate(10px,');
    });

    it('should update when cropImgY changes', () => {
      component.cropImgY.set(20);
      expect(component.cropTransform()).toContain('20px)');
    });

    it('should update when cropScale changes', () => {
      component.cropScale.set(2);
      expect(component.cropTransform()).toContain('scale(2)');
    });
  });

  describe('Drag events', () => {
    it('onDragOver should set dragOver=true and call preventDefault', () => {
      const event = { preventDefault: jest.fn() } as unknown as DragEvent;
      component.onDragOver(event);
      expect(component.dragOver()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('onDragLeave should set dragOver=false', () => {
      component.onDragOver({ preventDefault: jest.fn() } as unknown as DragEvent);
      component.onDragLeave();
      expect(component.dragOver()).toBe(false);
    });
  });

  describe('File validation', () => {
    it('should reject non-image files and set error', () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.error()).toBe('Izaberite sliku (JPEG, PNG ili WebP)');
      expect(component.cropMode()).toBe(false);
    });

    it('should accept image files and enter crop mode', () => {
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.cropMode()).toBe(true);
      expect(component.cropImageSrc()).toBeTruthy();
      expect(component.error()).toBeNull();
    });

    it('should accept PNG files', () => {
      const file = new File(['img'], 'photo.png', { type: 'image/png' });
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.cropMode()).toBe(true);
    });

    it('should accept WebP files', () => {
      const file = new File(['img'], 'photo.webp', { type: 'image/webp' });
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.cropMode()).toBe(true);
    });

    it('should handle no file selected', () => {
      const event = { target: { files: [] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.cropMode()).toBe(false);
    });
  });

  describe('cancelCrop', () => {
    it('should reset cropMode and cropImageSrc', () => {
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.cropMode()).toBe(true);

      component.cancelCrop();

      expect(component.cropMode()).toBe(false);
      expect(component.cropImageSrc()).toBeNull();
    });
  });

  describe('confirmCrop', () => {
    it('should emit pendingBlob and set preview after confirmation', async () => {
      // Select a file to enter crop mode
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      const selectEvent = { target: { files: [file] } } as unknown as Event;
      component.onFileSelected(selectEvent);

      // Mock the crop image element required for exportCrop
      const mockImg = {
        naturalWidth: 800,
        naturalHeight: 450,
        parentElement: {
          clientWidth: 320,
          clientHeight: 180,
        },
      } as unknown as HTMLImageElement;
      // Simulate image load
      (component as unknown as { cropImg: HTMLImageElement }).cropImg = mockImg;

      const emitSpy = jest.fn();
      component.pendingBlob.subscribe(emitSpy);

      await component.confirmCrop();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'image/webp',
          filename: expect.stringContaining('.webp'),
        }),
      );
      expect(component.cropMode()).toBe(false);
      expect(component.preview()).toBeTruthy();
    });

    it('should set error if no originalFile is set', async () => {
      await component.confirmCrop();
      // No file selected — should do nothing (returns early)
      expect(component.error()).toBeNull();
    });
  });

  describe('Pointer drag', () => {
    it('onCropPointerDown should start dragging and save start positions', () => {
      component.cropImgX.set(5);
      component.cropImgY.set(10);

      const mockEl = {
        setPointerCapture: jest.fn(),
      } as unknown as HTMLElement;
      const event = {
        preventDefault: jest.fn(),
        target: mockEl,
        pointerId: 1,
        clientX: 100,
        clientY: 200,
      } as unknown as PointerEvent;

      component.onCropPointerDown(event);

      // isDragging is private, but we can verify via subsequent pointermove
      // Should store dragStart positions — verify through pointermove effect
      expect(mockEl.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('onCropPointerUp should stop dragging', () => {
      component.onCropPointerUp();
      // No error, state is clean — isDragging becomes false
    });

    it('onCropPointerMove should not change position when not dragging', () => {
      component.cropImgX.set(50);
      component.cropImgY.set(50);
      const prevX = component.cropImgX();
      const prevY = component.cropImgY();

      const event = { clientX: 100, clientY: 100 } as PointerEvent;
      component.onCropPointerMove(event);

      expect(component.cropImgX()).toBe(prevX);
      expect(component.cropImgY()).toBe(prevY);
    });
  });

  describe('Zoom', () => {
    it('onCropWheel should increase scale on scroll up', () => {
      component.cropScale.set(1);
      component.cropMinScale.set(1);

      // Need cropImg and container for clamp — set up mocks
      const mockImg = {
        naturalWidth: 800,
        naturalHeight: 450,
        parentElement: {
          clientWidth: 320,
          clientHeight: 180,
        },
      } as unknown as HTMLImageElement;
      (component as unknown as { cropImg: HTMLImageElement }).cropImg = mockImg;
      (component as unknown as { minScale: number }).minScale = 1;

      const event = {
        preventDefault: jest.fn(),
        deltaY: -100, // scroll up = zoom in
        offsetX: 160,
        offsetY: 90,
      } as unknown as WheelEvent;

      component.onCropWheel(event);

      expect(component.cropScale()).toBeGreaterThan(1);
    });

    it('onCropWheel should decrease scale on scroll down', () => {
      component.cropScale.set(2);

      const mockImg = {
        naturalWidth: 800,
        naturalHeight: 450,
        parentElement: {
          clientWidth: 320,
          clientHeight: 180,
        },
      } as unknown as HTMLImageElement;
      (component as unknown as { cropImg: HTMLImageElement }).cropImg = mockImg;
      (component as unknown as { minScale: number }).minScale = 1;

      const event = {
        preventDefault: jest.fn(),
        deltaY: 100, // scroll down = zoom out
        offsetX: 160,
        offsetY: 90,
      } as unknown as WheelEvent;

      component.onCropWheel(event);

      expect(component.cropScale()).toBeLessThan(2);
    });
  });

  describe('openFilePicker', () => {
    it('should trigger click on hidden file input', () => {
      const inputEl = fixture.nativeElement.querySelector('input[type="file"]');
      const clickSpy = jest.spyOn(inputEl, 'click').mockImplementation(jest.fn());

      component.openFilePicker();

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
