import { html, render } from 'lit';
import './resources-popover';
import './resource-bar.css';
import { dependencies } from '../../common/dependencies';
import { ResourceModel } from '../../models/resource-model';
import { ModalService } from '../../modals/modal-service';
import { enabledResources } from '../../common/utils/resources';
import { WorkspaceModel } from '../../models/workspace-model';

export class ResourceBar extends HTMLElement {
  resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  modalService = dependencies.resolve<ModalService>('ModalService');
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');

  constructor() {
    super();
    this.resourceModel.subscribe(() => this.render());
    this.workspaceModel.subscribe(() => this.render());
  }

  connectedCallback(): void {
    this.render();
  }

  render(): void {
    const resources = enabledResources(this.resourceModel, this.workspaceModel);

    const resourceTemplate = resources.map((resource) => {
      const isImage = resource.type === 'image';
      const imageResource = resource as any; // Type assertion for image resources

      return html`<li class="applet-item">
        ${isImage && imageResource.thumbnail
          ? html`<img
              class="applet-icon applet-image"
              src="${imageResource.thumbnail}"
              alt="${resource.name || 'Image preview'}"
            />`
          : html`<img
              class="applet-icon"
              src=${(resource.icons && resource.icons[0].src) || ''}
              alt="icon"
            />`}
        <span class="applet-name">${resource.short_name ?? resource.name}</span>
      </li>`;
    });

    const template = html`
      <ul class="resources-list">
        ${resourceTemplate}
      </ul>
      <un-button
        variant="ghost"
        icon="toolbox"
        icon-position="end"
        id="resource-management-button"
        popovertarget="resource-management-popover"
      ></un-button>
      <resource-management-popover
        id="resource-management-popover"
        anchor="resource-management-button"
        position="top"
      ></resource-management-popover>
    `;

    render(template, this);
  }
}

customElements.define('resource-bar', ResourceBar);
