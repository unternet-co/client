import { html, render } from 'lit';
import './resources-popover';
import './resource-bar.css';
import { dependencies } from '../../common/dependencies';
import { ResourceModel } from '../../resources/resource-service';
import { ModalService } from '../common/modals/modal-service';
import { enabledResources } from '../../common/utils/resources';
import { WorkspaceModel } from '../../deprecated/workspace-service';

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
      return html`<li class="applet-item">
        <img
          class="applet-icon"
          src=${(resource.icons && resource.icons[0].src) || ''}
        />
        <span class="applet-name">${resource.short_name ?? resource.name}</span>
      </li>`;
    });

    const template = html`
      <ul class="resources-list">
        ${resourceTemplate}
      </ul>
      <resource-management-popover
        id="resource-management-popover"
        anchor="resource-management-button"
        position="top"
      ></resource-management-popover>
      <un-button
        variant="ghost"
        icon="toolbox"
        icon-position="end"
        id="resource-management-button"
        popovertarget="resource-management-popover"
      ></un-button>
    `;

    render(template, this);
  }
}

customElements.define('resource-bar', ResourceBar);
