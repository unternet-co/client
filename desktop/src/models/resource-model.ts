import { Resource } from '@unternet/kernel';
import webResource from '../protocols/buitin/resources';
import { Notifier } from '../common/notifier';
import { uriWithScheme } from '../common/utils/http';
import { DatabaseService } from '../storage/database-service';
import { WebProtocol } from '../protocols/http/protocol';
import { FileResourceFactory } from '../protocols/file/resource-factory';
import { fileProtocol } from '../protocols/file/protocol';
import path from 'path';

const initialResources: Array<Resource> = new Array();

if (import.meta.env.APP_UNTERNET_API_KEY) {
  initialResources.push(webResource);
}

interface ResourceModelInit {
  initialResources: Array<Resource>;
  resourceDatabaseService: DatabaseService<string, Resource>;
}

class ResourceModel {
  private resources = new Map<string, Resource>();
  private registeredPaths = new Set<string>();
  private indexingInProgress = new Set<string>(); // Track directories being indexed
  private db: DatabaseService<string, Resource>;
  private notifier = new Notifier();
  private notifyDebounced = debounce(() => {
    this.notifier.notify();
  }, 500);
  private batchUpdateInProgress = false;
  private pendingUpdates = new Map<string, Resource>();
  private directoryOperationInProgress = false;

  constructor({
    initialResources,
    resourceDatabaseService,
  }: ResourceModelInit) {
    this.db = resourceDatabaseService;
    for (const resource of initialResources) {
      this.resources.set(resource.uri, resource);
    }
    this.load();
  }

  async load() {
    const allResources = await this.db.all();
    for (const resource of allResources) {
      this.resources.set(resource.uri, resource);

      // Register file paths for file resources (if available)
      if (
        resource.uri.startsWith('file://') &&
        window.electronAPI?.fileURLToPath
      ) {
        try {
          const localPath = window.electronAPI.fileURLToPath(resource.uri);
          if (resource.type === 'directory') {
            // For directories, register with full indexing
            if (
              !this.registeredPaths.has(localPath) &&
              !this.indexingInProgress.has(localPath)
            ) {
              await this.registerFileDirectory(localPath);
            }
          } else {
            // For single files, register parent directory and index only this file
            const parentDir = path.dirname(localPath);
            if (
              !this.registeredPaths.has(parentDir) &&
              !this.indexingInProgress.has(parentDir)
            ) {
              await fileProtocol.handleAction({
                uri: `file://${parentDir}`,
                actionId: 'register',
                args: {
                  path: parentDir,
                  singleFileToIndex: localPath,
                },
                display: 'snippet',
              });
              this.registeredPaths.add(parentDir);
            }
          }
        } catch (error) {
          console.error(
            `Error re-registering file path for ${resource.uri}:`,
            error
          );
        }
      }
    }
    this.notifier.notify();
  }

  all() {
    return Array.from(this.resources.values());
  }

  async register(uri: string) {
    const normalizedUri = uriWithScheme(uri);
    if (!normalizedUri) {
      throw new Error(`Invalid URI format: ${uri}`);
    }

    try {
      const urlObj = new URL(normalizedUri);
      if (!['http', 'https'].includes(urlObj.protocol.replace(':', ''))) {
        throw new Error(
          `Adding resources from non-web sources not currently supported.`
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(
        `Error registering resource '${normalizedUri}': ${errorMessage}`
      );
      throw error;
    }

    const newResource = await WebProtocol.createResource(normalizedUri);
    this.add(newResource);
  }

  private async processPendingUpdates() {
    if (this.pendingUpdates.size === 0) return;

    // If we're in a directory operation, wait for it to complete
    if (this.directoryOperationInProgress) {
      return;
    }

    const updates = Array.from(this.pendingUpdates.entries());
    this.pendingUpdates.clear();

    // Filter out resources that already exist
    const newUpdates = updates.filter(([uri]) => !this.resources.has(uri));

    // Group updates by type (file vs non-file) for more efficient processing
    const fileUpdates = newUpdates.filter(([uri]) => uri.startsWith('file://'));
    const nonFileUpdates = newUpdates.filter(
      ([uri]) => !uri.startsWith('file://')
    );

    // Process non-file updates first
    for (const [uri, resource] of nonFileUpdates) {
      try {
        this.resources.set(uri, resource);
        await this.db.put(resource);
      } catch (error) {
        console.error(`Error processing pending update for ${uri}:`, error);
      }
    }

    // Process file updates in batches
    if (fileUpdates.length > 0) {
      this.directoryOperationInProgress = true;
      try {
        // Group file updates by directory
        const updatesByDir = new Map<string, Array<[string, Resource]>>();
        for (const [uri, resource] of fileUpdates) {
          if (!window.electronAPI?.fileURLToPath) continue;
          const path = window.electronAPI.fileURLToPath(uri);
          console.log('[RESOURCE_MODEL] Processing file update:', {
            uri,
            path,
          });

          if (!updatesByDir.has(path)) {
            updatesByDir.set(path, []);
          }
          updatesByDir.get(path)?.push([uri, resource]);
        }

        // Process each directory's updates
        for (const [dir, updates] of updatesByDir) {
          // Only register directory if it's not already registered or being indexed
          if (
            !this.registeredPaths.has(dir) &&
            !this.indexingInProgress.has(dir)
          ) {
            await this.registerFileDirectory(dir);
          }

          // Batch update resources in this directory
          for (const [uri, resource] of updates) {
            if (!this.resources.has(uri)) {
              this.resources.set(uri, resource);
              await this.db.put(resource);
            }
          }
        }
      } finally {
        this.directoryOperationInProgress = false;
      }
    }

    // Single notification after all updates are complete
    this.notifyDebounced();
  }

  async add(
    resource: Resource,
    skipFileRegistration: boolean = false
  ): Promise<void> {
    // Skip if we already have this resource
    if (this.resources.has(resource.uri)) {
      console.log(`Resource ${resource.uri} already exists, skipping add`);
      return;
    }

    if (this.batchUpdateInProgress || this.directoryOperationInProgress) {
      this.pendingUpdates.set(resource.uri, resource);
      return;
    }

    this.batchUpdateInProgress = true;
    try {
      this.resources.set(resource.uri, resource);

      if (!skipFileRegistration && resource.uri.startsWith('file://')) {
        if (!window.electronAPI?.fileURLToPath) {
          console.warn(
            'electronAPI.fileURLToPath not available, skipping file resource indexing'
          );
          return;
        }
        const localPath = window.electronAPI.fileURLToPath(resource.uri);
        console.log('[RESOURCE_MODEL] Adding file resource:', {
          uri: resource.uri,
          localPath,
          type: resource.type,
        });

        if (resource.type === 'directory') {
          // For directories, register with full indexing
          if (
            !this.registeredPaths.has(localPath) &&
            !this.indexingInProgress.has(localPath)
          ) {
            this.directoryOperationInProgress = true;
            try {
              await this.registerFileDirectory(localPath);
            } finally {
              this.directoryOperationInProgress = false;
            }
          }
        } else {
          // For single files, register parent directory and index only this file
          const parentDir = path.dirname(localPath);
          if (
            !this.registeredPaths.has(parentDir) &&
            !this.indexingInProgress.has(parentDir)
          ) {
            this.directoryOperationInProgress = true;
            try {
              await fileProtocol.handleAction({
                uri: `file://${parentDir}`,
                actionId: 'register',
                args: {
                  path: parentDir,
                  singleFileToIndex: localPath, // Pass the file to index
                },
                display: 'snippet',
              });
              this.registeredPaths.add(parentDir);
              console.log(
                'Successfully registered parent directory and indexed single file:',
                {
                  directory: parentDir,
                  file: localPath,
                }
              );
            } finally {
              this.directoryOperationInProgress = false;
            }
          }
        }
      }

      await this.db.put(resource);
      this.notifyDebounced();
    } finally {
      this.batchUpdateInProgress = false;
      // Process any pending updates
      await this.processPendingUpdates();
    }
  }

  async registerFileDirectory(path: string): Promise<void> {
    // Check if path is already registered or being indexed
    if (this.registeredPaths.has(path) || this.indexingInProgress.has(path)) {
      console.log(
        `Directory ${path} is already registered or being indexed, skipping registration`
      );
      return;
    }

    try {
      this.indexingInProgress.add(path);
      console.log('Registering path with file protocol...');

      // Register the directory with the file protocol
      await fileProtocol.handleAction({
        uri: `file://${path}`,
        actionId: 'register',
        args: { path },
        display: 'snippet',
      });

      // Add to registered paths set
      this.registeredPaths.add(path);
      console.log('Successfully registered directory:', path);
    } catch (error) {
      console.error('Failed to register directory:', error);
      throw error;
    } finally {
      this.indexingInProgress.delete(path);
    }
  }

  get(uri: string) {
    const result = this.resources.get(uri);
    console.log(this.resources);
    if (!result) {
      throw new Error(`No resource matches this URI: ${JSON.stringify(uri)}`);
    }

    return result;
  }

  async remove(uri: string) {
    if (this.batchUpdateInProgress || this.directoryOperationInProgress) {
      this.pendingUpdates.delete(uri); // Remove from pending updates if it was queued
      return;
    }

    this.batchUpdateInProgress = true;
    try {
      const resource = this.resources.get(uri);
      if (!resource) {
        return;
      }

      // If it's a file resource, unregister it using the file protocol's action system
      if (uri.startsWith('file://') && window.electronAPI?.fileURLToPath) {
        try {
          const localPath = window.electronAPI.fileURLToPath(uri);
          await fileProtocol.handleAction({
            uri,
            actionId: 'unregister',
            args: { path: localPath },
            display: 'snippet',
          });
          // Remove from registered paths
          this.registeredPaths.delete(localPath);
        } catch (error) {
          console.error(`Error unregistering file path for ${uri}:`, error);
        }
      }

      // Batch the database and resource map updates
      await Promise.all([
        this.db.delete(uri),
        Promise.resolve(this.resources.delete(uri)),
      ]);

      // Single notification after all updates are complete
      this.notifyDebounced();
    } finally {
      this.batchUpdateInProgress = false;
      // Process any pending updates
      await this.processPendingUpdates();
    }
  }

  subscribe(callback: () => void) {
    // Remove the debounced notification from the subscription
    // since we're already debouncing in the add/remove methods
    return this.notifier.subscribe(callback);
  }
}

// Debounce helper function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export { ResourceModel, initialResources };
