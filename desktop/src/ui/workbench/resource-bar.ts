import { html, render } from 'lit';
// import './resources-popover';
import './resource-bar.css';
import { dependencies } from '../../common/dependencies';
import { ResourceService } from '../../resources/resource-service';

export class ResourceBar extends HTMLElement {
  resourceService = dependencies.resolve<ResourceService>('ResourceService');

  constructor() {
    super();
    this.resourceService.subscribe(() => this.render());
  }

  connectedCallback(): void {
    this.render();
  }

  render(): void {
    const resources = this.resourceService.all();

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
      <ul class="resource-list"></ul>
        ${resourceTemplate}
      </ul>
    `;

    render(template, this);
  }
}

customElements.define('resource-bar', ResourceBar);
