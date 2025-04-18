import { html, render } from 'lit';
import { Resource } from '@unternet/kernel';
// import './resource-picker';
import './resource-bar.css';
import { dependencies } from '../../common/dependencies';
import { ResourceModel } from '../../protocols/resources';

export class ResourceBar extends HTMLElement {
  resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');

  connectedCallback(): void {
    this.render();
  }

  render(): void {
    const resources = this.resourceModel.resources;

    const resourceTemplate = resources.map((resource) => {
      return html`<li class="applet-item">
        <img
          class="applet-icon"
          src=${(resource.icons && resource.icons[0].src) || ''}
        />
        <span class="applet-name">${resource.short_name ?? resource.name}</span>
      </li>`;
    });

    const template = html`<ul class="resources-list">
      ${resourceTemplate}
    </ul>`;

    render(template, this);
  }
}

customElements.define('resource-bar', ResourceBar);
