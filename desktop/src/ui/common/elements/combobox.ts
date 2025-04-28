import { LitElement, html, css } from 'lit';
import { KernelInput } from '../../../ai/kernel';
import { ShortcutService } from '../../../shortcuts/shortcut-service';
import { dependencies } from '../../../common/dependencies';

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
  selectedValue: string | null;
  searchString: string;
  selectedIndex: number = 0;
  private shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');

  constructor() {
    super();
    this.selectedValue = this.selectedValue || this.options?.[0]?.value;
    this.onSelect = this.onSelect.bind(this);
    this.searchString = this.searchString || '';
    this.selectNextOption = this.selectNextOption.bind(this);
    this.selectPrevOption = this.selectPrevOption.bind(this);
    this.selectOption = this.selectOption.bind(this);
    this.closeOptions = this.closeOptions.bind(this);
    this.registerShortcuts();
  }

  private onSelect(value: string) {
    this.selectedValue = value;
    this.dispatchEvent(new ComboboxSelectEvent(value));
  }

  selectNextOption() {
    this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
    this.selectedValue = this.options[this.selectedIndex].value;
  }

  selectPrevOption() {
    this.selectedIndex =
      (this.selectedIndex - 1 + this.options.length) % this.options.length;
    this.selectedValue = this.options[this.selectedIndex].value;
  }

  selectOption() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption) {
      this.onSelect(selectedOption.value);
    }
  }

  closeOptions() {
    this.selectedValue = null;
    this.searchString = '';
    // this.emitClose();
  }

  registerShortcuts() {
    this.shortcutService.register('ArrowDown', this.selectNextOption);
    this.shortcutService.register('ArrowUp', this.selectPrevOption);
    this.shortcutService.register('Enter', this.selectOption);
    this.shortcutService.register('Tab', this.selectOption);
    this.shortcutService.register('Escape', this.closeOptions);
  }

  deregisterShortcuts() {
    this.shortcutService.deregister('ArrowDown', this.selectNextOption);
    this.shortcutService.deregister('ArrowUp', this.selectPrevOption);
    this.shortcutService.deregister('Enter', this.selectOption);
    this.shortcutService.deregister('Tab', this.selectOption);
    this.shortcutService.deregister('Escape', this.closeOptions);
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

      .combobox-option {
        padding: 8px;
        cursor: pointer;
      }
      .combobox-option:hover,
      .combobox-option.selected {
        background-color: var(--color-action-800);
        color: var(--color-action-0);
      }
    `;
  }
}

customElements.define('un-combobox', ComboboxElement);
