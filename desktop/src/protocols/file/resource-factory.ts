import * as path from 'path';
import { Resource, resource, ActionDict, ResourceIcon } from '@unternet/kernel';
import { FileIndex } from './file-index';
import { isImageMimeType, ImageMetadata } from './image-resource';

export class FileResourceFactory {
  private static readonly IMAGE_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.svg',
  ];
  private static readonly MIME_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  private static async findDirectoryIcon(
    dirPath: string
  ): Promise<{ thumbnail?: string; icon?: ResourceIcon } | null> {
    if (!window.electronAPI?.fs) {
      throw new Error('File system API not available');
    }

    try {
      // Read directory contents
      const result = await window.electronAPI.fs.readdir(dirPath);
      if ('error' in result) {
        throw new Error(result.error);
      }

      // Look for image files
      for (const entry of result.entries) {
        if (!entry.isFile) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (this.IMAGE_EXTENSIONS.includes(ext)) {
          const filePath = path.join(dirPath, entry.name);
          const mimeType = this.MIME_TYPES[ext];

          if (mimeType && isImageMimeType(mimeType)) {
            // Create a temporary file index to process the image
            const index = new FileIndex(dirPath);
            await index.initialize();
            const fileResource = index.getFile(filePath);

            if (fileResource && fileResource.type === 'image') {
              const imageFile = fileResource as any; // Type assertion for image resource
              if (imageFile.thumbnail) {
                return {
                  thumbnail: imageFile.thumbnail,
                  icon: { src: imageFile.thumbnail },
                };
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to find directory icon for ${dirPath}:`, error);
    }

    return null;
  }

  static async createFromPath(filePath: string): Promise<Resource> {
    // Use the exact path provided, don't resolve it
    const absolutePath = filePath;
    console.log('[FILE_RESOURCE_FACTORY] Creating resource from path:', {
      original: filePath,
      absolute: absolutePath,
    });

    let stats;
    try {
      if (!window.electronAPI?.fs) {
        throw new Error('File system API not available');
      }

      // Use lstat instead of stat to not follow symlinks
      const result = await window.electronAPI.fs.lstat(absolutePath);
      if ('error' in result) {
        throw new Error(result.error);
      }
      stats = result.stats;
    } catch (error) {
      console.error(
        `[FILE_RESOURCE_FACTORY] Error stating path ${absolutePath}:`,
        error
      );
      throw new Error(`Path not found or inaccessible: ${absolutePath}`);
    }

    const isDirectory = stats.isDirectory;

    if (!window.electronAPI?.pathToFileURL) {
      throw new Error(
        'pathToFileURL via electronAPI is not available. Check preload script.'
      );
    }

    const fileName = path.basename(absolutePath);
    const fileUri = window.electronAPI.pathToFileURL(absolutePath);

    // Set basic resource properties
    let description = isDirectory ? 'Directory' : 'File';
    let imageMetadata: ImageMetadata | undefined;
    let thumbnail: string | undefined;
    let icons: ResourceIcon[] = [];

    // For directories, look for an image to use as icon
    if (isDirectory) {
      const dirIcon = await this.findDirectoryIcon(absolutePath);
      if (dirIcon) {
        thumbnail = dirIcon.thumbnail;
        if (dirIcon.icon) {
          icons = [dirIcon.icon];
        }
      }
    }
    // For files, check if it's an image
    else {
      const ext = path.extname(absolutePath).toLowerCase();
      const mimeType = this.MIME_TYPES[ext];

      if (mimeType && isImageMimeType(mimeType)) {
        // Create a temporary file index to process the image
        const index = new FileIndex(path.dirname(absolutePath));
        await index.initialize();
        const file = index.getFile(absolutePath);
        if (file && file.type === 'image') {
          const imageFile = file as any; // Type assertion for image resource
          imageMetadata = imageFile.metadata;
          thumbnail = imageFile.thumbnail;
          if (imageMetadata?.description) {
            description = imageMetadata.description;
          }
          if (thumbnail) {
            icons = [{ src: thumbnail }];
          }
        }
      }
    }

    console.debug('[FILE_RESOURCE] Creating resource:', {
      uri: fileUri,
      name: fileName,
      isDirectory,
      metadata: imageMetadata,
    });

    // Define actions with correct types
    const actions: ActionDict = {
      search: {
        description: 'Search within files in this directory',
        display: 'snippet',
        params_schema: {
          type: 'object' as const,
          properties: {
            query: {
              type: 'string' as const,
              description: 'Search query to find within files',
            },
          },
          required: ['query'],
        },
      },
      read: {
        description:
          'Read the contents of a specific file. For text files, returns the text content. For image files, returns a base64 data URL.',
        display: 'snippet',
        params_schema: {
          type: 'object' as const,
          properties: {
            path: {
              type: 'string' as const,
              description:
                'Relative path to the file to read (from the registered directory root). Supports text files and images (PNG, JPEG, GIF, WebP, SVG).',
            },
          },
          required: ['path'],
        },
      },
      list: {
        description: 'List files matching a pattern within this directory',
        display: 'snippet',
        params_schema: {
          type: 'object' as const,
          properties: {
            pattern: {
              type: 'string' as const,
              description:
                'File pattern to match (glob-like syntax, e.g., *.txt, src/**/*.js)',
            },
          },
        },
      },
      unregister: {
        description: 'Unregister this directory from the file system',
        display: 'snippet',
        params_schema: {
          type: 'object' as const,
          properties: {
            path: {
              type: 'string' as const,
              description:
                'Path to unregister (should match the directory path)',
            },
          },
          required: ['path'],
        },
      },
    };

    // Create base resource with icons
    const baseResource = {
      uri: fileUri,
      name: fileName,
      description,
      type: isDirectory ? ('directory' as const) : ('file' as const),
      icons: icons.length > 0 ? icons : [{ src: 'file-icon.png' }],
      protocol: 'file' as const,
      actions,
      thumbnail, // Add thumbnail for both directories and images
    };

    // Add image-specific properties if available
    if (!isDirectory && imageMetadata) {
      return resource({
        ...baseResource,
        description: `${description} (${imageMetadata.width}x${imageMetadata.height})`,
        type: 'image' as const,
      });
    }

    return resource(baseResource);
  }
}
