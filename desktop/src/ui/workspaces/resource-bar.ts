import { html, render } from 'lit';
import './resource-bar.css';
import { dependencies } from '../../common/dependencies';
import { ResourceModel } from '../../protocols/resources';
import { ModalService } from '../../modals/modal-service';

export class ResourceBar extends HTMLElement {
  resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  modalService = dependencies.resolve<ModalService>('ModalService');

  connectedCallback(): void {
    this.render();
  }

  render(): void {
    const resources = this.resourceModel.all();

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
      <un-button
        size="small"
        type="ghost"
        icon="workspace-settings"
        @click=${() => this.modalService.open('workspace-settings')}
      >
        Workspace Settings
      </un-button>
    `;

    render(template, this);
  }
}

customElements.define('resource-bar', ResourceBar);
