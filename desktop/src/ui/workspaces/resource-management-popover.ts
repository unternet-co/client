import { html } from 'lit';
import { PopoverElement } from '../common/elements/popover';
import './resource-management-popover.css';
import { dependencies } from '../../common/dependencies';
import { ResourceModel } from '../../protocols/resources';
import { getMetadata, uriWithScheme } from '../../common/utils/http';
import { InputElement } from '../common/elements/input';

type AppletAction = { description?: string; [key: string]: any };

export class ResourceManagementPopover extends PopoverElement {
  resourceUrl: string = '';
  resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  activeView: 'list' | 'add' | 'preview' = 'list';
  unsubscribe?: { dispose: () => void } | (() => void);
  previewResource: any = null;
  previewLoading: boolean = false;

  connectedCallback() {
    this.unsubscribe = this.resourceModel.subscribe(() => this.render());
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      if (typeof this.unsubscribe === 'function') {
        this.unsubscribe();
      } else if (typeof this.unsubscribe.dispose === 'function') {
        this.unsubscribe.dispose();
      }
    }
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
    await this.resourceModel.remove(uri);
    this.render();
  };

  handleAddResource = async (e: Event) => {
    e.preventDefault();
    if (!this.previewResource) return;
    await this.resourceModel.register(this.previewResource.uri);
    this.previewResource = null;
    this.goToView('list');
  };

  handlePreviewResource = async (e: Event) => {
    e.preventDefault();
    const input = document.getElementById('resource-url') as HTMLInputElement;
    const url = input?.value?.trim();
    if (!url) return;
    const normalizedUri = uriWithScheme(url);
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

  get currentResourceTemplate() {
    const resources = this.resourceModel.all();
    const resourcesList =
      resources.length > 0
        ? resources.map((resource) => {
            return html`
              <div class="resource-row">
                ${resource.icons && resource.icons.length > 0
                  ? html`<img
                      class="resource-icon"
                      src="${resource.icons[0].src}"
                      alt="icon"
                    />`
                  : html`<div class="resource-icon placeholder"></div>`}
                <span class="resource-name"> ${resource.name} </span>
                <un-button
                  icon="delete"
                  type="ghost"
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
            @click="${() => this.goToView('add')}"
            >Add a Resource</un-button
          >
        </footer>
      </div>
    `;
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
        <footer>
          <un-button type="secondary" @click=${() => this.close()}
            >Cancel</un-button
          >
          <un-button
            type="primary"
            @click=${this.handlePreviewResource}
            ?disabled=${!this.isValidResourceUrl}
            >Preview</un-button
          >
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
    const { name, description, uri, icons, actions } = this.previewResource;
    const isApplet = actions && Object.keys(actions).length > 0;
    const actionsTyped: Record<string, AppletAction> = actions || {};
    return html`
      <header class="header">
        <span id="title">Add Resource</span>
      </header>
      <div class="content">
        <div class="applet-card">
          <div class="applet-card-header">
            ${icons && icons.length > 0
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
                >${isApplet ? 'Applet' : 'Website'}</span
              >
            </div>
          </div>
          <div class="applet-card-description">${description || uri}</div>
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
          <un-button type="secondary" @click=${() => this.goToView('add')}
            >Back</un-button
          >
          <un-button type="primary" @click=${this.handleAddResource}
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
}

customElements.define('resource-management-popover', ResourceManagementPopover);
