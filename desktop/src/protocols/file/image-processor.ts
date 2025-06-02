import {
  ImageMetadata,
  ImageResource,
  ImageResourceOptions,
  DEFAULT_IMAGE_OPTIONS,
} from './image-resource';
import { IndexedFile } from './file-index';

export class ImageProcessor {
  private options: ImageResourceOptions;

  constructor(options: Partial<ImageResourceOptions> = {}) {
    this.options = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  }

  async processImage(file: IndexedFile): Promise<ImageResource> {
    if (!window.electronAPI?.fs) {
      throw new Error('File system API not available');
    }

    // Read the file as binary data
    const result = await window.electronAPI.fs.readFile(file.path, 'binary');
    if ('error' in result) {
      throw new Error(`Failed to read image file: ${result.error}`);
    }

    const binaryData = this.base64ToArrayBuffer(result.content);

    // Create base image resource
    const imageResource: ImageResource = {
      ...file,
      type: 'image',
      metadata: {
        format: file.mimeType,
      },
    };

    // Always extract metadata first
    try {
      // Extract basic metadata
      imageResource.metadata = await this.extractMetadata(
        binaryData,
        file.mimeType
      );

      // Generate a very small thumbnail (max 128x128) for AI analysis
      const thumbnail = await this.generateThumbnail(
        binaryData,
        file.mimeType,
        128
      );
      if (thumbnail) {
        imageResource.thumbnail = thumbnail;
        // Add a text description of the image based on metadata
        imageResource.metadata.description = this.generateImageDescription(
          imageResource.metadata
        );
      }

      // Only store binary data if explicitly requested
      if (this.options.storeBinaryData) {
        imageResource.binaryData = binaryData;
      }
    } catch (error) {
      console.warn(`Failed to process image metadata: ${error}`);
    }

    return imageResource;
  }

  private async extractMetadata(
    binaryData: ArrayBuffer,
    mimeType: string
  ): Promise<ImageMetadata> {
    // Create an image element to get basic metadata
    const img = new Image();
    const blob = new Blob([binaryData], { type: mimeType });
    const url = URL.createObjectURL(blob);

    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const metadata: ImageMetadata = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: mimeType,
        hasAlpha: this.hasAlphaChannel(mimeType),
      };

      // TODO: Add EXIF extraction for JPEG images
      // This would require additional libraries like exif-js

      return metadata;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private generateImageDescription(metadata: ImageMetadata): string {
    const parts = [];

    if (metadata.width && metadata.height) {
      parts.push(`${metadata.width}x${metadata.height} pixels`);
    }

    if (metadata.format) {
      const format =
        metadata.format.split('/')[1]?.toUpperCase() || metadata.format;
      parts.push(format);
    }

    if (metadata.hasAlpha) {
      parts.push('with transparency');
    }

    if (metadata.colorSpace) {
      parts.push(`${metadata.colorSpace} color space`);
    }

    return parts.join(', ');
  }

  private async generateThumbnail(
    binaryData: ArrayBuffer,
    mimeType: string,
    maxSize: number = 128
  ): Promise<string | null> {
    try {
      const img = new Image();
      const blob = new Blob([binaryData], { type: mimeType });
      const url = URL.createObjectURL(blob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Create a canvas to resize the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Calculate new dimensions while maintaining aspect ratio
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with very aggressive compression for JPEG
      const quality = mimeType === 'image/jpeg' ? 0.5 : 0.7;
      const thumbnail = canvas.toDataURL(mimeType, quality);

      URL.revokeObjectURL(url);
      return thumbnail;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  private hasAlphaChannel(mimeType: string): boolean {
    return ['image/png', 'image/gif', 'image/webp'].includes(mimeType);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    // Remove any whitespace and ensure the string is properly padded
    const cleanBase64 = base64
      .replace(/\s/g, '')
      .replace(/[^A-Za-z0-9+/]/g, '');
    const padding = '='.repeat((4 - (cleanBase64.length % 4)) % 4);
    const paddedBase64 = cleanBase64 + padding;

    // Convert base64 to binary string using atob
    const binaryString = atob(paddedBase64);

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
