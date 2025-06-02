import { IndexedFile } from './file-index';

export interface ImageMetadata {
  width?: number;
  height?: number;
  format: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  orientation?: number;
  exif?: Record<string, any>;
  description?: string;
}

export interface ImageResource extends IndexedFile {
  type: 'image';
  metadata: ImageMetadata;
  thumbnail?: string; // Base64 encoded thumbnail
  binaryData?: ArrayBuffer; // The actual image data
}

export interface ImageResourceOptions {
  extractMetadata?: boolean;
  generateThumbnail?: boolean;
  maxThumbnailSize?: number;
  storeBinaryData?: boolean; // Whether to store the full binary data in the resource
}

// Default options for image processing
export const DEFAULT_IMAGE_OPTIONS: ImageResourceOptions = {
  extractMetadata: true,
  generateThumbnail: true,
  maxThumbnailSize: 128, // pixels
  storeBinaryData: false, // Don't store binary data by default
};

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

// Helper to check if a file is an image
export function isImageFile(file: IndexedFile): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(file.mimeType);
}

// Helper to check if a mime type is an image
export function isImageMimeType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(mimeType);
}
