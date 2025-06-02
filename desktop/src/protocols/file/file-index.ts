import * as path from 'path';
import MiniSearch from 'minisearch';
import type { SearchResult } from 'minisearch';
import { FileChangeEvent } from './file-watcher';
import type { ElectronAPI } from '../../global.d'; // Import the ElectronAPI type
import { ImageProcessor } from './image-processor';
import {
  isImageMimeType,
  ImageResource,
  SUPPORTED_IMAGE_FORMATS,
} from './image-resource';

// Ensure window.electronAPI is properly typed
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export interface IndexedFile {
  id: string;
  path: string;
  relativePath: string;
  name: string;
  content?: string; // Make content optional since binary files won't have text content
  mimeType: string;
  size: number;
  lastModified: number;
  checksum: string;
  type?: string; // Add type field to distinguish between different resource types
}

// Add PDF resource type
export interface PDFResource extends IndexedFile {
  type: 'pdf';
  binaryData?: ArrayBuffer;
}

// Helper to check if a mime type is a PDF
export function isPDFMimeType(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

// Helper to check if a file is an image
export function isImageFile(file: IndexedFile): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(file.mimeType);
}

export class FileIndex {
  private files = new Map<string, IndexedFile>();
  private searchIndex: any; // Using any temporarily to work around type issues
  private basePath: string;
  private imageProcessor: ImageProcessor;
  private skipIndexing: boolean;

  constructor(basePath: string, skipIndexing: boolean = false) {
    this.basePath = path.resolve(basePath);
    this.skipIndexing = skipIndexing;
    console.log('[FILE_INDEX] Initializing with base path:', {
      original: basePath,
      resolved: this.basePath,
      normalized: path.normalize(this.basePath),
    });
    this.imageProcessor = new ImageProcessor();
    this.searchIndex = new MiniSearch({
      fields: ['name', 'content', 'relativePath'],
      storeFields: [
        'id',
        'path',
        'relativePath',
        'name',
        'mimeType',
        'size',
        'lastModified',
        'type',
      ],
      idField: 'id',
      searchOptions: {
        boost: { name: 2, relativePath: 1, content: 0.5 },
        fuzzy: 0.2,
      },
    });
  }

  async initialize(): Promise<void> {
    if (this.skipIndexing) {
      console.log('[FILE_INDEX] Skipping directory indexing as requested');
      return;
    }
    await this.scanDirectory(this.basePath);
  }

  private async scanDirectory(dirPath: string): Promise<void> {
    console.log('[FILE_INDEX] Starting to scan directory:', {
      dirPath,
      normalizedDirPath: path.normalize(dirPath),
      basePath: this.basePath,
      normalizedBasePath: path.normalize(this.basePath),
    });
    try {
      // Ensure we're not scanning outside our base directory
      const normalizedDirPath = path.normalize(dirPath);
      const normalizedBasePath = path.normalize(this.basePath);

      if (!normalizedDirPath.startsWith(normalizedBasePath)) {
        console.warn('[FILE_INDEX] Attempted to scan outside base directory:', {
          dirPath: normalizedDirPath,
          basePath: normalizedBasePath,
          isSubPath: normalizedDirPath.startsWith(normalizedBasePath),
        });
        return;
      }

      if (!window.electronAPI?.fs) {
        throw new Error('File system API not available');
      }

      const result = await window.electronAPI.fs.readdir(dirPath, true);
      if ('error' in result) {
        console.error('[FILE_INDEX] Error reading directory:', result.error);
        throw new Error(result.error);
      }

      console.log('[FILE_INDEX] Directory entries:', result.entries);
      const entries = result.entries;
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip if the full path is outside our base directory
        if (!path.normalize(fullPath).startsWith(normalizedBasePath)) {
          console.warn(
            '[FILE_INDEX] Skipping entry outside base directory:',
            fullPath
          );
          continue;
        }

        console.log('[FILE_INDEX] Processing entry:', {
          name: entry.name,
          isDirectory: entry.isDirectory,
          isFile: entry.isFile,
          fullPath,
        });

        // Get file stats to determine type if not provided
        if (entry.isDirectory === undefined || entry.isFile === undefined) {
          console.log('[FILE_INDEX] File type not provided, getting stats...');
          const statResult = await window.electronAPI.fs.stat(fullPath);
          if ('error' in statResult) {
            console.error(
              '[FILE_INDEX] Error getting file stats:',
              statResult.error
            );
            continue;
          }
          const stats = statResult.stats;
          entry.isDirectory = stats.isDirectory;
          entry.isFile = stats.isFile;
          console.log('[FILE_INDEX] Updated entry with stats:', {
            name: entry.name,
            isDirectory: entry.isDirectory,
            isFile: entry.isFile,
          });
        }

        if (
          entry.isDirectory &&
          !this.shouldIgnoreDirectory(entry.name, fullPath)
        ) {
          console.log('[FILE_INDEX] Recursing into directory:', fullPath);
          await this.scanDirectory(fullPath);
        } else if (entry.isFile && this.shouldIndexFile(entry.name)) {
          console.log('[FILE_INDEX] Indexing file:', fullPath);
          await this.indexFile(fullPath);
        } else {
          console.log('[FILE_INDEX] Skipping entry:', {
            name: entry.name,
            reason: entry.isDirectory
              ? 'ignored directory'
              : entry.isFile
                ? 'ignored file'
                : 'unknown type',
          });
        }
      }
    } catch (error) {
      console.error('[FILE_INDEX] Error scanning directory:', error);
      throw error;
    }
  }

  private shouldIgnoreDirectory(dirname: string, fullPath: string): boolean {
    // Only ignore hidden directories and a few common build/cache directories
    const ignoredDirs = new Set([
      'node_modules', // Dependencies
      '.git', // Git repository
      '.vscode', // VS Code settings
      'dist', // Build output
      'build', // Build output
      '.next', // Next.js build
      '.cache', // Cache directories
    ]);

    // Ignore hidden directories (starting with .)
    if (dirname.startsWith('.')) {
      return true;
    }

    // Check if the directory name is in our minimal ignore list
    return ignoredDirs.has(dirname.toLowerCase());
  }

  private shouldIndexFile(filename: string): boolean {
    // Add any file type restrictions here
    return true;
  }

  async indexFile(filePath: string): Promise<void> {
    console.log('[FILE_INDEX] Starting to index file:', filePath);
    try {
      if (!window.electronAPI?.fs) {
        throw new Error('File system API not available');
      }

      console.log('[FILE_INDEX] Reading file content and stats...');
      const mimeType = this.getMimeType(filePath);
      const isBinary = isImageMimeType(mimeType) || isPDFMimeType(mimeType);

      const [contentResult, statResult] = await Promise.all([
        window.electronAPI.fs.readFile(filePath, isBinary ? 'binary' : 'utf8'),
        window.electronAPI.fs.stat(filePath),
      ]);

      if ('error' in contentResult) {
        console.error(
          '[FILE_INDEX] Error reading file content:',
          contentResult.error
        );
        throw new Error(contentResult.error);
      }
      if ('error' in statResult) {
        console.error(
          '[FILE_INDEX] Error reading file stats:',
          statResult.error
        );
        throw new Error(statResult.error);
      }

      const content = contentResult.content;
      const stats = statResult.stats;
      const relativePath = path.relative(this.basePath, filePath);

      console.log('[FILE_INDEX] File stats:', {
        path: filePath,
        relativePath,
        size: stats.size,
        lastModified: stats.mtimeMs,
        mimeType,
      });

      // Basic checksum (could use a more robust one like SHA256 if needed)
      const checksum = `${stats.size}-${stats.mtimeMs}`;

      let indexedFile: IndexedFile = {
        id: filePath,
        path: filePath,
        relativePath,
        name: path.basename(filePath),
        mimeType,
        size: stats.size,
        lastModified: stats.mtimeMs,
        checksum,
      };

      // Handle binary files (images and PDFs)
      if (isBinary) {
        if (isPDFMimeType(mimeType)) {
          // For PDFs, store as PDFResource
          const pdfResource: PDFResource = {
            ...indexedFile,
            type: 'pdf',
            binaryData: content
              ? new TextEncoder().encode(content).buffer
              : undefined,
          };
          indexedFile = pdfResource;
        } else if (isImageMimeType(mimeType)) {
          // Existing image handling code
          try {
            const imageResource = await this.imageProcessor.processImage({
              ...indexedFile,
              content: undefined,
            });
            indexedFile = imageResource;
          } catch (error) {
            console.error('[FILE_INDEX] Error processing image:', error);
          }
        }
      } else {
        // For text files, store the content
        indexedFile.content = content;
      }

      this.files.set(filePath, indexedFile);
      console.log('[FILE_INDEX] Successfully indexed file:', {
        id: indexedFile.id,
        path: filePath,
        size: stats.size,
        mimeType: indexedFile.mimeType,
        type: indexedFile.type,
      });
    } catch (error) {
      console.error('[FILE_INDEX] Error indexing file:', error);
      throw error;
    }
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf', // WIP PDF MIME type
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private rebuildSearchIndex(): void {
    this.searchIndex = new MiniSearch({
      fields: ['name', 'content', 'relativePath'],
      storeFields: [
        'id',
        'path',
        'relativePath',
        'name',
        'mimeType',
        'size',
        'lastModified',
        'type',
      ],
      idField: 'id',
      searchOptions: {
        boost: { name: 2, relativePath: 1, content: 0.5 },
        fuzzy: 0.2,
      },
    });
    this.searchIndex.addAll(Array.from(this.files.values()));
  }

  async handleFileChange(event: FileChangeEvent): Promise<void> {
    const fullPath = path.resolve(this.basePath, event.path);

    switch (event.type) {
      case 'add':
      case 'change':
        if (this.shouldIndexFile(event.path)) {
          await this.indexFile(fullPath);
          this.rebuildSearchIndex();
        }
        break;
      case 'unlink':
        if (this.files.has(fullPath)) {
          this.files.delete(fullPath);
          this.rebuildSearchIndex();
        }
        break;
    }
  }

  getFile(filePath: string): IndexedFile | undefined {
    // If we have the file in our index, return it
    return this.files.get(filePath);
  }

  async getFileAsync(filePath: string): Promise<IndexedFile | undefined> {
    // If we have the file in our index, return it
    const existingFile = this.files.get(filePath);
    if (existingFile) {
      return existingFile;
    }

    // If we're not indexing, try to get the file directly
    if (this.skipIndexing) {
      try {
        if (!window.electronAPI?.fs) {
          throw new Error('File system API not available');
        }

        const result = await window.electronAPI.fs.stat(filePath);
        if ('error' in result) {
          console.error('[FILE_INDEX] Error getting file stats:', result.error);
          return undefined;
        }

        const stats = result.stats;
        if (!stats.isFile) {
          return undefined;
        }

        // Create a temporary indexed file entry
        const relativePath = path.relative(this.basePath, filePath);
        const file: IndexedFile = {
          id: filePath,
          path: filePath,
          relativePath,
          name: path.basename(filePath),
          size: stats.size,
          mimeType: this.getMimeType(filePath),
          lastModified: stats.mtimeMs,
          checksum: '', // We don't need a checksum for direct file access
        };

        // Cache it for future use
        this.files.set(filePath, file);
        return file;
      } catch (error) {
        console.error('[FILE_INDEX] Error accessing file:', error);
        return undefined;
      }
    }

    return undefined;
  }

  async readFileContent(filePath: string): Promise<string | null> {
    try {
      if (!window.electronAPI?.fs) {
        throw new Error('File system API not available');
      }

      // Get the file from our index to check its mime type
      const file = this.getFile(filePath);
      const isBinary = file
        ? isImageMimeType(file.mimeType) || isPDFMimeType(file.mimeType)
        : false;

      const result = await window.electronAPI.fs.readFile(
        filePath,
        isBinary ? 'binary' : 'utf8'
      );
      if ('error' in result) {
        console.error('[FILE_INDEX] Error reading file:', result.error);
        return null;
      }

      return result.content;
    } catch (error) {
      console.error('[FILE_INDEX] Error reading file:', error);
      return null;
    }
  }

  async listFiles(pattern?: string): Promise<IndexedFile[]> {
    let fileList = Array.from(this.files.values());

    if (pattern) {
      const regex = new RegExp(
        pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')
      );
      fileList = fileList.filter((file) => regex.test(file.relativePath));
    }
    return fileList;
  }

  search(query: string): any[] {
    // Using any temporarily to work around type issues
    console.log('[FILE_INDEX] Starting search with query:', query);
    console.log('[FILE_INDEX] Current index size:', this.files.size);
    const results = this.searchIndex.search(query);
    console.log(
      '[FILE_INDEX] Search completed, found matches:',
      results.length
    );
    console.log('[FILE_INDEX] Search results:', results);
    return results;
  }
}
