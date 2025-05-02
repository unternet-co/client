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

export class ComboboxCloseEvent extends Event {
  constructor() {
    super('close', {
      bubbles: true,
      composed: true,
    });
  }
}

export class ComboboxOpenEvent extends Event {
  constructor() {
    super('open', {
      bubbles: true,
      composed: true,
    });
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
    this.searchString = this.searchString || '';
    this.selectNextOption = this.selectNextOption.bind(this);
    this.selectPrevOption = this.selectPrevOption.bind(this);
    this.selectOption = this.selectOption.bind(this);
    this.closeOptions = this.closeOptions.bind(this);
    this.registerShortcuts();
  }

  private onSelect(selectedValue: string) {
    // This resets the selection for next time it is rendered
    this.selectedValue = null;
    this.selectedIndex = 0;
    // The selection is bubbled up
    this.dispatchEvent(new ComboboxSelectEvent(selectedValue));
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
    const selectedOption =
      this.options[this.selectedIndex] ||
      this.options.find(({ value }) => value === this.selectedValue);
    if (selectedOption) {
      this.onSelect(selectedOption.label);
    }
  }

  onClose() {
    this.dispatchEvent(new ComboboxCloseEvent());
  }

  closeOptions() {
    this.selectedValue = null;
    this.selectedIndex = 0;
    this.searchString = '';
    this.onClose();
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

  shouldSelect(value: string, index: number) {
    return (
      this.selectedValue === value ||
      (this.selectedValue === null && index === 0)
    );
  }

  render() {
    const filteredOptions = this.options.filter(({ value }) =>
      value.includes(this.searchString)
    );
    return html`
      <ul class="combobox">
        ${filteredOptions.map(
          ({ value, label }, index) => html`
            <li
              class="combobox-option ${this.shouldSelect(value, index)
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
        display: block;
        width: 100%;
      }

      .combobox-option {
        padding: 4px;
        cursor: pointer;
        display: block;
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
