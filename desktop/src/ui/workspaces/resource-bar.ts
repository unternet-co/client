import { html, render } from 'lit';
import { Resource } from '@unternet/kernel';
import './resource-picker';
import './resource-bar.css';

export class ResourceBar extends HTMLElement {
  set resources(resources: Resource[]) {
    const template = this.resources.map((resource) => {
      return html`<li class="applet-item">
        <img
          class="applet-icon"
          src=${(resource.icons && resource.icons[0].src) || ''}
        />
        <span class="applet-name">${resource.short_name ?? resource.name}</span>
      </li>`;
    });
  }

  connectedCallback(): void {
    render(this.template, this);
  }

  template() {
    return html`<ul class="resources-list"></ul>`;
  }
}

customElements.define('resource-bar', ResourceBar);
