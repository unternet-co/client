import { html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
// import './resources-popover';
import './resource-bar.css';
import { dependencies } from '../../common/dependencies';
import { ResourceService } from '../../resources/resource-service';

@customElement('resource-bar')
export class ResourceBar extends LitElement {
  renderRoot = this;
  resourceService = dependencies.resolve<ResourceService>('ResourceService');

  constructor() {
    super();
    this.resourceService.subscribe(() => this.requestUpdate());
  }

  render(): TemplateResult {
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
      <ul class="resource-list">
        ${resourceTemplate}
      </ul>
    `;

    return template;
  }
}
