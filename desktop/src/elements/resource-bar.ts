import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resources, type Resource } from '@unternet/kernel';
import './resource-picker';
import './resource-bar.css';

@customElement('resource-bar')
export class ResourceBar extends LitElement {
  renderRoot = this;

  @property({ attribute: false })
  resources: Resource[] = [];

  @property({ attribute: false })
  isPickerOpen: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();
    resources.subscribe(
      resources.all,
      (resources) => (this.resources = resources)
    );

    window.addEventListener('mousedown', (event) => {
      const target = event.target as Node;
      const pickerNode = this.querySelector('resource-picker');
      const buttonNode = this.querySelector('#picker-toggle-button');
      if (
        pickerNode &&
        this.isPickerOpen &&
        target !== pickerNode &&
        target !== buttonNode &&
        !pickerNode.contains(target)
      ) {
        console.log('tggl');
        this.togglePicker();
      }
    });
  }

  appletTemplate() {
    return html`
      ${this.resources.map((tool) => {
        return html`<li class="applet-item">
          <img class="applet-icon" src=${tool.icons && tool.icons[0].src} />
          <span class="applet-name">${tool.short_name ?? tool.name}</span>
        </li>`;
      })}
    `;
  }

  togglePicker() {
    this.isPickerOpen = !this.isPickerOpen;
  }

  render() {
    return html`
      <ul class="applets-list">
        ${this.appletTemplate()}
      </ul>
      <div class="add-applet-container">
        ${this.isPickerOpen ? html`<resource-picker></resource-picker>` : ''}
        <button
          @mousedown=${this.togglePicker.bind(this)}
          class="icon-button"
          id="picker-toggle-button"
        >
          <img src="/icons/toolbox.svg" />
        </button>
      </div>
    `;
  }
}
