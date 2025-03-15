import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import 'tributejs/dist/tribute.css';
import './command-bar.css';
import Tribute, { type TributeItem } from 'tributejs';
import { operator } from '../kernel/operator';
import { Resource } from '../kernel/resources';
import { tabs } from '../tabs';
import { config } from '../config';

@customElement('command-bar')
export class CommandBar extends LitElement {
  renderRoot = this;

  // Accept resources as a property passed in from the parent.
  @property({ attribute: false })
  resources: Resource[] = [];

  // Store the Tribute instance
  tribute!: Tribute<{ key: string; value: string }>;

  firstUpdated() {
    // Initialize Tribute with a dynamic values function so it uses the latest resources
    this.tribute = new Tribute({
      trigger: '@',
      values: (text, cb) => {
        const filtered = this.resources
          .filter((resource) =>
            resource.name.toLowerCase().includes(text.toLowerCase())
          )
          .map((resource) => ({
            key: resource.name,
            value: resource.name,
            icons: resource.icons,
          }));
        cb(filtered);
      },
      selectTemplate: (
        item: TributeItem<{
          key: string;
          value: string;
          icons: any[];
        }>
      ) => {
        if (typeof item === 'undefined') return null;

        return `
        <span class="resource-pill" contenteditable="false">
          <img class="applet-icon" src=${
            item.original.icons && item.original.icons[0].src
          } />
          <span style="width: 0px; display: inline-flex; overflow: hidden;">@</span><span>${
            item.original.value
          }</span>
        </span>`;
      },
      menuItemTemplate: function (item) {
        return `<img class="applet-icon" src=${
          item.original.icons && item.original.icons[0].src
        } />
        <span>${item.original.value}</span>`;
      },
      noMatchTemplate: () => '<span class="no-match">No match found</span>',
    });

    const inputEl = this.renderRoot.querySelector('#commandInput');
    if (inputEl) {
      this.tribute.attach(inputEl);
    }
  }

  async handleKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLElement;

    if (e.key === 'Enter') {
      e.preventDefault();
      // input.blur();
      const activeTab = await config.get('activeTab');
      const workspaceId = await tabs.getWorkspaceId(activeTab);
      operator.handleInput(
        { type: 'command', text: input.innerText },
        workspaceId
      );
      input.innerHTML = '';
    }
  }

  render() {
    return html`
      <div class="page">
        <div class="input-container">
          <div
            id="commandInput"
            contenteditable="true"
            class="command-input"
            @keydown=${this.handleKeyDown.bind(this)}
          ></div>
        </div>
      </div>
    `;
  }
}
