import { html } from 'lit';
import { Resource } from '@unternet/kernel';

import { PopoverElement } from '../common/popover';
import './resources-popover.css';
import '../common/checkbox';

import { dependencies } from '../../common/dependencies';
import { ResourceModel } from '../../models/resource-model';
import { getMetadata, uriWithScheme } from '../../common/utils/http';
import { InputElement } from '../common/input';
import { DisposableGroup } from '../../common/disposable';
import {
  WorkspaceModel,
  WorkspaceResource,
} from '../../models/workspace-model';
import { FileResourceFactory } from '../../protocols/file/resource-factory';
import { FileProtocol } from '../../protocols/file/protocol';

type AppletAction = { description?: string; [key: string]: any };

export class ResourceManagementPopover extends PopoverElement {
  resourceUrl: string = '';
  private _resourceModel: ResourceModel | null = null;
  private _modelInitialized = false;
  private _modelPromise: Promise<ResourceModel> | null = null;
  activeView: 'list' | 'add' | 'preview' = 'list';
  disposables = new DisposableGroup();
  previewResource: any = null;
  previewLoading: boolean = false;
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');

  constructor() {
    super();
    console.log('ResourceManagementPopover constructor called');
    this.handleFilePickerAdd = this.handleFilePickerAdd.bind(this);
    this.handleResourceUrlInput = this.handleResourceUrlInput.bind(this);
    this.handlePreviewResource = this.handlePreviewResource.bind(this);
    this.handleAddResource = this.handleAddResource.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  connectedCallback() {
    try {
      const model = this.resourceModel;
      if (!model) {
        throw new Error('ResourceModel not available during initialization');
      }

      // Debounce the render to prevent excessive updates
      const debouncedRender = debounce(() => {
        this.render();
      }, 100);

      const resourceModelSubscription = model.subscribe(() => {
        debouncedRender();
      });

      const workspaceModelSubscription = this.workspaceModel.subscribe(() => {
        debouncedRender();
      });

      this.disposables.add(resourceModelSubscription);
      this.disposables.add(workspaceModelSubscription);
    } catch (error) {
      console.error('Failed to initialize ResourceManagementPopover:', error);
      throw error;
    }
  }

  disconnectedCallback() {
    this.disposables.dispose();
  }

  goToView = (view: 'list' | 'add' | 'preview') => {
    this.activeView = view;
    super.render();
  };

  close = () => {
    this.goToView('list');
    this.hidePopover();
  };

  handleRemove = async (uri: string) => {
    if (!uri) return;
    await this.resourceModel.remove(uri);
    // TODO: Automatically disable resource on workspace?
    this.render();
  };

  handleToggle = async (uri: string) => {
    if (!uri || !this.workspaceModel.activeWorkspaceId) return;
    this.workspaceModel.toggleResource(
      this.workspaceModel.activeWorkspaceId,
      uri
    );
  };

  handleAddResource = async (e: Event) => {
    e.preventDefault();
    if (!this.previewResource?.uri) return;
    await this.resourceModel.register(this.previewResource.uri);
    if (this.workspaceModel.activeWorkspaceId) {
      await this.workspaceModel.enableResource(
        this.workspaceModel.activeWorkspaceId,
        this.previewResource.uri
      );
    }

    this.previewResource = null;
    this.resourceUrl = '';
    this.goToView('list');
  };

  handlePreviewResource = async (e: Event) => {
    e.preventDefault();
    const input = document.getElementById('resource-url') as HTMLInputElement;
    const url = input?.value?.trim();
    if (!url) return;
    const normalizedUri = uriWithScheme(url);
    if (!normalizedUri) return;
    this.previewLoading = true;
    this.previewResource = null;
    this.goToView('preview');
    try {
      const metadata = await getMetadata(normalizedUri);
      this.previewResource = { uri: normalizedUri, ...metadata };
    } finally {
      this.previewLoading = false;
      this.render();
    }
  };

  handleResourceUrlInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.resourceUrl = target.value;
    this.render();
  };

  get isValidResourceUrl(): boolean {
    const unInput = this.querySelector('#resource-url') as InputElement;
    return unInput?.checkValidity?.() ?? false;
  }

  get resourceModel(): ResourceModel {
    if (this._resourceModel) {
      return this._resourceModel;
    }

    if (!this._modelPromise) {
      this._modelPromise = (async () => {
        try {
          const model = dependencies.resolve<ResourceModel>('ResourceModel');
          if (!model) {
            throw new Error('ResourceModel resolved to null');
          }
          this._resourceModel = model;
          this._modelInitialized = true;
          return model;
        } catch (error) {
          console.error('Failed to resolve ResourceModel:', error);
          this._modelInitialized = false;
          this._modelPromise = null;
          throw error;
        }
      })();
    }

    if (!this._resourceModel) {
      throw new Error('ResourceModel is not yet initialized');
    }

    return this._resourceModel;
  }

  get currentResourceTemplate() {
    try {
      const resources = this.resourceModel.all();
      const workspace = this.workspaceModel.activeWorkspace || undefined;
      const workspaceResources = workspace?.resources as
        | Record<string, WorkspaceResource>
        | undefined;

      const resourcesList =
        resources.length > 0
          ? resources.map((resource: Resource) => {
              const isEnabled =
                workspaceResources?.[resource.uri]?.enabled ?? false;
              const isImage = resource.type === 'image';
              const isDirectory = resource.type === 'directory';
              const isFile = resource.type === 'file';
              const imageResource = resource as any; // Type assertion for image resources

              return html`
                <div class="resource-row">
                  <un-checkbox
                    .checked=${isEnabled}
                    @input=${() => this.handleToggle(resource.uri)}
                  ></un-checkbox>
                  ${isImage && imageResource.thumbnail
                    ? html`<img
                        class="resource-icon resource-image"
                        src="${imageResource.thumbnail}"
                        alt="${resource.name || 'Image preview'}"
                      />`
                    : resource.icons && resource.icons.length > 0
                      ? html`<img
                          class="resource-icon"
                          src="${resource.icons[0].src}"
                          alt="icon"
                        />`
                      : html`<div class="resource-icon placeholder">
                          <un-icon
                            name="${isDirectory
                              ? 'folder'
                              : isFile
                                ? 'file'
                                : 'globe'}"
                            size="small"
                          ></un-icon>
                        </div>`}
                  <div class="resource-info">
                    <span class="resource-name">${resource.name}</span>
                    ${isImage && imageResource.metadata
                      ? html`<span class="resource-type"
                          >${imageResource.metadata.width}x${imageResource
                            .metadata.height}
                          pixels</span
                        >`
                      : html`<span class="resource-type"
                          >${isDirectory
                            ? 'Directory'
                            : isFile
                              ? 'File'
                              : resource.protocol === 'http' ||
                                  resource.protocol === 'https'
                                ? 'HTTP'
                                : resource.type || 'Resource'}</span
                        >`}
                  </div>
                  <un-button
                    icon="delete"
                    variant="ghost"
                    aria-label="Remove Resource"
                    title="Remove Resource"
                    @click=${() => this.handleRemove(resource.uri)}
                  ></un-button>
                </div>
              `;
            })
          : html` <p class="no-resources">No resources found</p> `;

      return html`
        <header class="header">
          <span id="title">Resources</span>
        </header>
        <div class="content">
          ${resourcesList}
          <footer>
            <un-button
              icon="plus"
              id="resource-management-button"
              variant="primary"
              @click="${() => this.goToView('add')}"
              >Add</un-button
            >
          </footer>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering resource template:', error);
      return html`
        <header class="header">
          <span id="title">Resources</span>
        </header>
        <div class="content">
          <p class="no-resources">Loading resources...</p>
        </div>
      `;
    }
  }

  get addResourceTemplate() {
    return html`
      <header class="header">
        <span id="title">Add Resource</span>
      </header>
      <form class="content">
        <fieldset>
          <un-label for="resource-url"> Enter a URL: </un-label>
          <un-input
            id="resource-url"
            type="url"
            placeholder="https://"
            .value=${this.resourceUrl}
            @input=${this.handleResourceUrlInput}
          ></un-input>
          <p class="text-sm text-muted">
            Paste the url of any website or app to detect available resources.
          </p>
        </fieldset>
        <div class="button-group">
          <un-button
            variant="secondary"
            @click=${(e: Event) => this.handleFilePickerAdd('file')}
            label="Add Local File"
            icon="file-plus"
          >
            Add Local File
          </un-button>
          <un-button
            variant="secondary"
            @click=${(e: Event) => this.handleFilePickerAdd('directory')}
            label="Add Local Folder"
            icon="folder-plus"
          >
            Add Local Folder
          </un-button>
        </div>
        <footer>
          <un-button variant="secondary" @click=${() => this.goToView('list')}
            >Cancel</un-button
          >
          <un-button
            variant="primary"
            @click=${this.handlePreviewResource}
            ?disabled=${!this.isValidResourceUrl}
            label="Preview"
          >
          </un-button>
        </footer>
      </form>
    `;
  }

  get previewResourceTemplate() {
    if (this.previewLoading) {
      return html`
        <header class="header">
          <span id="title">Add Resource</span>
        </header>
        <div class="content">
          <div class="applet-card loading">
            <un-icon name="loading" spin size="large"></un-icon>
            <div>Detecting resources at ${this.resourceUrl}...</div>
          </div>
        </div>
      `;
    }
    if (!this.previewResource) return html`<p>No preview available.</p>`;
    const {
      name,
      description,
      uri,
      icons,
      actions,
      type,
      metadata,
      thumbnail,
    } = this.previewResource;
    const isApplet = actions && Object.keys(actions).length > 0;
    const isImage = type === 'image';
    const actionsTyped: Record<string, AppletAction> = actions || {};

    return html`
      <header class="header">
        <span id="title">Add Resource</span>
      </header>
      <div class="content">
        <div class="applet-card">
          <div class="applet-card-header">
            ${isImage && thumbnail
              ? html`<img
                  class="applet-card-icon applet-card-image"
                  src="${thumbnail}"
                  alt="${name || 'Image preview'}"
                />`
              : icons && icons.length > 0
                ? html`<img
                    class="applet-card-icon"
                    src="${icons[0].src}"
                    alt="icon"
                  />`
                : html`<div
                    class="applet-card-icon applet-card-icon-placeholder"
                  ></div>`}
            <div class="applet-card-title-group">
              <span class="applet-card-title">${name}</span>
              <span class="applet-card-type"
                >${isImage ? 'Image' : isApplet ? 'Applet' : 'Website'}</span
              >
            </div>
          </div>
          ${isImage && metadata
            ? html`
                <div class="applet-card-description">
                  ${metadata.description || description || uri}
                  ${metadata.width && metadata.height
                    ? html`<div class="image-metadata">
                        ${metadata.width}x${metadata.height} pixels
                      </div>`
                    : ''}
                </div>
              `
            : html`<div class="applet-card-description">
                ${description || uri}
              </div>`}
          ${isApplet
            ? html`
                <div class="applet-card-actions-section">
                  <div class="applet-card-actions-label">
                    Available Actions:
                  </div>
                  <ul class="applet-card-actions-list">
                    ${Object.entries(actionsTyped).map(
                      ([actionName, action]) => html`
                        <li class="applet-card-action">
                          <span class="applet-card-action-name"
                            >${actionName}</span
                          >
                          ${action.description
                            ? html`<span class="applet-card-action-desc"
                                >${action.description}</span
                              >`
                            : ''}
                        </li>
                      `
                    )}
                  </ul>
                </div>
              `
            : ''}
        </div>
        <footer class="applet-card-footer">
          <un-button variant="secondary" @click=${() => this.goToView('add')}
            >Back</un-button
          >
          <un-button variant="primary" @click=${this.handleAddResource}
            >Add Resource</un-button
          >
        </footer>
      </div>
    `;
  }

  get template() {
    let contentEl;
    switch (this.activeView) {
      case 'add':
        contentEl = this.addResourceTemplate;
        break;
      case 'list':
        contentEl = this.currentResourceTemplate;
        break;
      case 'preview':
        contentEl = this.previewResourceTemplate;
        break;
    }
    return contentEl;
  }

  async handleFilePickerAdd(mode: 'file' | 'directory'): Promise<void> {
    try {
      // @ts-ignore
      if (!window.electronAPI?.showOpenDialog) {
        throw new Error(
          'electronAPI.showOpenDialog is not available. Are you in an Electron environment?'
        );
      }

      // Open file picker with appropriate mode
      const result = await window.electronAPI.showOpenDialog({
        properties: [
          mode === 'file' ? 'openFile' : 'openDirectory',
          'dontUseNativeDialog',
        ],
        title:
          mode === 'file' ? 'Select File to Add' : 'Select Directory to Add',
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const path = result.filePaths[0];
        console.log('[RESOURCE_POPOVER] Selected path:', path);

        try {
          const model = this.resourceModel;
          if (!model) {
            throw new Error('ResourceModel is not initialized');
          }

          // Get file stats to determine if it's a directory
          const stats = await window.electronAPI.fs.lstat(path);
          if ('error' in stats) {
            throw new Error(`Failed to get stats for path: ${stats.error}`);
          }

          // Verify the selected item matches the requested mode
          if (mode === 'file' && stats.stats.isDirectory) {
            throw new Error(
              'Selected path is a directory, but a file was requested'
            );
          }
          if (mode === 'directory' && !stats.stats.isDirectory) {
            throw new Error(
              'Selected path is a file, but a directory was requested'
            );
          }

          // Create and add resource first
          console.log('[RESOURCE_POPOVER] Creating resource for path:', path);
          const resource = await FileResourceFactory.createFromPath(path);
          console.log('[RESOURCE_POPOVER] Created resource:', resource);
          await model.add(resource);

          // Only register directory if it's a directory
          if (stats.stats.isDirectory) {
            console.log('[RESOURCE_POPOVER] Registering directory:', path);
            await model.registerFileDirectory(path);
          }

          // Enable in current workspace
          if (this.workspaceModel.activeWorkspaceId) {
            console.log(
              '[RESOURCE_POPOVER] Enabling resource in workspace:',
              this.workspaceModel.activeWorkspaceId
            );
            await this.workspaceModel.enableResource(
              this.workspaceModel.activeWorkspaceId,
              resource.uri
            );
          }

          // Use requestAnimationFrame to batch UI updates
          requestAnimationFrame(() => {
            this.goToView('list');
          });
        } catch (error) {
          console.error(
            '[RESOURCE_POPOVER] Failed to add file/directory:',
            error
          );
          throw error;
        }
      }
    } catch (error) {
      console.error('[RESOURCE_POPOVER] Error in handleFilePickerAdd:', error);
      throw error;
    }
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

customElements.define('resource-management-popover', ResourceManagementPopover);
