import { LitElement, html, css } from 'lit';

export class PaletteMenu extends LitElement {
  static get properties() {
    return {
      options: { type: Object }, // Object with group headers as keys and arrays of items as values
      selectedIndex: { type: Number },
      placeholder: { type: String },
      disabled: { type: Boolean },
    };
  }

  options: Record<string, string[]> = {};
  selectedIndex: number = -1;
  placeholder: string = 'Select an option';
  disabled: boolean = false;

  constructor() {
    super();
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
      }

      .select-list {
        list-style: none;
        margin: 0;
        padding: 0;
        border: 1px solid var(--input-border-color);
        border-radius: var(--rounded);
        background-color: var(--input-bg-color);
        color: var(--input-text-color);
        max-height: 200px;
        overflow-y: auto;
      }

      .group {
        margin: var(--space-2) 0;
      }

      .group-header {
        font-weight: bold;
        padding: var(--space-4);
        background-color: var(--group-header-bg-color);
        color: var(--group-header-text-color);
      }

      .group-items {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .select-list-item {
        padding: var(--space-4);
        cursor: pointer;
      }

      .select-list-item:hover,
      .select-list-item[aria-selected='true'] {
        background-color: var(--input-bg-color-hover);
        color: var(--input-text-color-hover);
      }

      .placeholder {
        color: var(--input-placeholder-color);
        padding: var(--space-4);
      }
    `;
  }

  handleClick(item: string, index: number) {
    this.selectedIndex = index;
    this.emitSelection(item);
  }

  getAllItems() {
    return Object.values(this.options).flat();
  }

  emitSelection(item: string) {
    const event = new CustomEvent('selected', {
      detail: { item },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    return html`
      <ul class="select-list" role="listbox" tabindex="0">
        ${Object.keys(this.options).length === 0
          ? html`<li class="placeholder">${this.placeholder}</li>`
          : Object.entries(this.options).map(
              ([group, items]) => html`
                <li class="group" role="group" aria-label=${group}>
                  <div class="group-header">${group}</div>
                  <ul class="group-items">
                    ${items.map(
                      (item, index) => html`
                        <li
                          class="select-list-item"
                          role="option"
                          aria-selected=${this.selectedIndex === index}
                          @click=${() => this.handleClick(item, index)}
                        >
                          ${item}
                        </li>
                      `
                    )}
                  </ul>
                </li>
              `
            )}
      </ul>
    `;
  }
}

customElements.define('palette-menu', PaletteMenu);
