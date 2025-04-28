import { LitElement, html, css } from 'lit';
import { KernelInput } from '../../../ai/kernel';

export class ComboboxSelectEvent extends Event {
  input: KernelInput;

  constructor(value: string) {
    super('select', {
      bubbles: true,
      composed: true,
    });

    this.input = { text: value };
  }
}

export class ComboboxElement extends LitElement {
  static properties = {
    options: { type: Array },
    selectedValue: { type: String, reflect: true },
    searchString: { type: String },
  };

  options: { label: string; value: string }[] = [];
  selectedValue: string | undefined;
  searchString: string;

  constructor() {
    super();
    this.selectedValue = this.selectedValue || this.options?.[0]?.value;
    this.onSelect = this.onSelect.bind(this);
    this.searchString = this.searchString || '';
  }

  private onSelect(value: string) {
    this.selectedValue = value;
    this.dispatchEvent(new ComboboxSelectEvent(value));
  }

  render() {
    const filteredOptions = this.options.filter(({ value }) =>
      value.includes(this.searchString)
    );
    return html`
      <ul class="combobox">
        ${filteredOptions.map(
          ({ value, label }) => html`
            <li
              class="combobox-option ${this.selectedValue === value
                ? 'selected'
                : ''}"
              @click=${() => this.onSelect(value)}
            >
              ${label}
            </li>
          `
        )}
      </ul>
    `;
  }

  static get styles() {
    return css`
      .combobox {
        list-style: none;
        padding: 0;
        margin: 0;
      }
    `;
  }
}

customElements.define('un-combobox', ComboboxElement);
