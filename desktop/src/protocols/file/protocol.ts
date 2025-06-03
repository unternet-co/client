import { ActionProposal, Protocol, Process } from '@unternet/kernel'; // Assuming these types exist
import { FileIndex, IndexedFile, isPDFMimeType } from './file-index';
import { FileWatcher, FileChangeEvent } from './file-watcher';
// import { URL } from 'url'; // Node.js URL module - REMOVED
import * as path from 'path'; // Node.js path module
import { PDFProcess } from '../../ui/processes/pdf-process';
import { isImageMimeType } from './image-resource';
import { FileInput } from '@unternet/kernel';

export class FileProtocol extends Protocol {
  scheme = 'file';
  private fileIndexes = new Map<string, FileIndex>();
  private watchers = new Map<string, FileWatcher>();

  constructor() {
    super();
    // Potentially initialize other things if addtional arguments are required
  }

  async handleAction(action: ActionProposal) {
    const basePath = this.getBasePath(action.uri, action.actionId);
    if (!basePath) {
      throw new Error(`Invalid file URI: ${action.uri}`);
    }

    switch (action.actionId) {
      case 'search':
        if (!action.args?.query) {
          throw new Error('Search action requires a query argument');
        }
        const results = await this.searchFiles(basePath, action.args.query);
        return results;

      case 'list':
        const pattern = action.args?.pattern;
        const files = await this.listFiles(basePath, pattern);
        return files;

      case 'register':
        if (!action.args?.path) {
          throw new Error('Register action requires a path argument');
        }
        const normalizedPath = path.normalize(action.args.path);
        const singleFileToIndex = action.args.singleFileToIndex;
        await this.registerPath(normalizedPath, singleFileToIndex);
        return { path: normalizedPath };

      case 'unregister':
        if (!action.args?.path) {
          throw new Error('Unregister action requires a path argument');
        }
        const unregisterPath = path.normalize(action.args.path);
        await this.unregisterPath(unregisterPath);
        return { path: unregisterPath };

      case 'read':
        if (!action.args?.path) {
          throw new Error('Read action requires a path argument');
        }
        const filePath = path.normalize(action.args.path);
        const content = await this.readFile(basePath, filePath);
        return content;

      default:
        throw new Error(`Unsupported action: ${action.actionId}`);
    }
  }

  private async registerPath(
    dirPath: string,
    singleFileToIndex?: string
  ): Promise<void> {
    const normalizedPath = path.normalize(dirPath);
    console.log('[FILE_PROTOCOL] Registering path:', {
      original: dirPath,
      normalized: normalizedPath,
      singleFileToIndex,
    });

    // Check if this path is a subdirectory of any registered path
    for (const [registeredPath, _] of this.fileIndexes) {
      const normalizedRegisteredPath = path.normalize(registeredPath);
      if (normalizedPath.startsWith(normalizedRegisteredPath)) {
        console.log(
          '[FILE_PROTOCOL] Path is a subdirectory of already registered path:',
          {
            path: normalizedPath,
            registeredPath: normalizedRegisteredPath,
          }
        );
        return; // Skip registration as this path is already covered
      }
    }

    // Stop any existing watcher for this path
    if (this.watchers.has(normalizedPath)) {
      await this.watchers.get(normalizedPath)?.close();
      this.watchers.delete(normalizedPath);
    }

    // Create a new index for this path
    const index = new FileIndex(normalizedPath);

    if (singleFileToIndex) {
      // If we're registering for a single file, only index that file
      console.log('[FILE_PROTOCOL] Indexing single file:', singleFileToIndex);
      await index.indexFile(singleFileToIndex);
    } else {
      // For directories, initialize with full indexing
      await index.initialize();

      // Set up file watcher for directories
      const watcher = new FileWatcher(
        normalizedPath,
        async (event: FileChangeEvent) => {
          if (event.type === 'add' || event.type === 'change') {
            await index.handleFileChange(event);
          } else if (event.type === 'unlink') {
            await index.handleFileChange(event);
          }
        }
      );

      // Start watching
      await watcher.start();
      this.watchers.set(normalizedPath, watcher);
    }

    this.fileIndexes.set(normalizedPath, index);
  }

  async unregisterPath(filePath: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);

    // Stop and cleanup watcher
    const watcher = this.watchers.get(normalizedPath);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(normalizedPath);
    }

    // Remove index
    this.fileIndexes.delete(normalizedPath);
  }

  // implementations for searchFiles, readFile, listFiles

  private async searchFiles(basePath: string, query: string): Promise<any> {
    const index = this.fileIndexes.get(basePath);
    if (!index) {
      throw new Error(`No index found for path: ${basePath}`);
    }
    const results = await index.search(query);
    return results;
  }

  private async readFile(
    basePath: string,
    relativeFilePath: string
  ): Promise<string | Process | FileInput | null> {
    const index = this.fileIndexes.get(basePath);
    if (!index) {
      throw new Error(`No index found for path: ${basePath}`);
    }

    // Normalize both paths to handle different path separators
    const normalizedBasePath = path.normalize(basePath);
    const normalizedRelativePath = path.normalize(relativeFilePath);

    // Try different path resolution strategies
    let file: IndexedFile | undefined;

    // 1. Try exact match with absolute path
    const absoluteFilePath = path.resolve(
      normalizedBasePath,
      normalizedRelativePath
    );
    file = index.getFile(absoluteFilePath);

    // 2. If not found, try to find by relative path
    if (!file) {
      const files = await index.listFiles();
      file = files.find((f) => {
        const normalizedFileRelativePath = path.normalize(f.relativePath);
        return (
          normalizedFileRelativePath === normalizedRelativePath ||
          f.name === path.basename(normalizedRelativePath)
        );
      });
    }

    // 3. If still not found, try to find by filename only
    if (!file) {
      const files = await index.listFiles();
      const targetFilename = path.basename(normalizedRelativePath);
      file = files.find((f) => f.name === targetFilename);
    }

    if (!file) {
      throw new Error(`Could not read file: ${relativeFilePath}`);
    }

    // For PDF files, return a PDFProcess
    if (isPDFMimeType(file.mimeType)) {
      const content = await index.readFileContent(file.path);
      if (!content) {
        throw new Error(`Could not read PDF file: ${relativeFilePath}`);
      }
      return new PDFProcess(content);
    }

    // For image files, return a FileInput object
    if (isImageMimeType(file.mimeType)) {
      const content = await index.readFileContent(file.path);
      if (!content) {
        throw new Error(`Could not read image file: ${relativeFilePath}`);
      }
      // Convert base64 to Uint8Array
      const binaryString = atob(content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return {
        data: bytes,
        filename: file.name,
        mimeType: file.mimeType,
      };
    }

    // For other (text) files, return the content
    const content = await index.readFileContent(file.path);
    if (content === null) {
      throw new Error(`Could not read file: ${relativeFilePath}`);
    }
    return content;
  }

  private async listFiles(basePath: string, pattern?: string): Promise<any> {
    console.log('[FILE_PROTOCOL] Listing files:', {
      basePath,
      pattern,
      registeredPaths: Array.from(this.fileIndexes.keys()),
      hasIndex: this.fileIndexes.has(basePath),
    });
    const index = this.fileIndexes.get(basePath);
    if (!index) {
      throw new Error(`No index found for path: ${basePath}`);
    }
    const files = await index.listFiles(pattern);
    console.log('[FILE_PROTOCOL] Listed files:', {
      count: files.length,
      files: files.map((f) => ({ name: f.name, path: f.path })),
    });
    return files;
  }

  private getBasePath(uri: string, actionId?: string): string | undefined {
    if (!uri.startsWith('file://')) {
      console.log('[FILE_PROTOCOL] URI is not a file URI:', uri);
      return undefined;
    }

    try {
      if (!window.electronAPI?.fileURLToPath) {
        console.warn('[FILE_PROTOCOL] electronAPI.fileURLToPath not available');
        return undefined;
      }

      const basePath = window.electronAPI.fileURLToPath(uri);
      const normalizedBasePath = path.normalize(basePath);

      console.log('[FILE_PROTOCOL] Getting base path:', {
        uri,
        basePath,
        normalizedBasePath,
        actionId,
        registeredPaths: Array.from(this.fileIndexes.keys()),
      });

      // For register and unregister actions, we want to allow the action
      // but only if the path is not already registered
      if (actionId === 'register' || actionId === 'unregister') {
        // For register, ensure we're not trying to register a subdirectory of an already registered path
        if (actionId === 'register') {
          for (const [registeredPath, _] of this.fileIndexes) {
            const normalizedRegisteredPath = path.normalize(registeredPath);
            if (normalizedBasePath.startsWith(normalizedRegisteredPath)) {
              console.log(
                '[FILE_PROTOCOL] Cannot register subdirectory of already registered path:',
                {
                  path: normalizedBasePath,
                  registeredPath: normalizedRegisteredPath,
                }
              );
              throw new Error(
                `Cannot register subdirectory of already registered path: ${registeredPath}`
              );
            }
          }
        }
        return normalizedBasePath;
      }

      // For all other actions, check if either:
      // 1. The exact path is registered
      // 2. The file's parent directory is registered (for file operations)
      if (this.fileIndexes.has(normalizedBasePath)) {
        return normalizedBasePath;
      }

      // Check if this is a file and its parent directory is registered
      const parentDir = path.dirname(normalizedBasePath);
      if (this.fileIndexes.has(parentDir)) {
        console.log('[FILE_PROTOCOL] Using parent directory as base path:', {
          file: normalizedBasePath,
          parentDir,
        });
        return parentDir;
      }

      console.log(
        '[FILE_PROTOCOL] No matching registered path found for:',
        normalizedBasePath
      );
      return undefined;
    } catch (error) {
      console.error(
        '[FILE_PROTOCOL] Error converting file URI to path:',
        error
      );
      return undefined;
    }
  }
}

// Export an instance of the FileProtocol
export const fileProtocol = new FileProtocol();
