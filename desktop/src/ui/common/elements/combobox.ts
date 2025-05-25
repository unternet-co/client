import { LitElement, html, css } from 'lit';
import { KernelInput } from '../../../kernel/kernel';
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
    searchString: { type: String },
    visible: { type: Boolean, reflect: true },
  };

  options: { label: string; value: string }[] = [];
  searchString: string;
  selectedIndex: number = 0;
  visible: boolean = false;
  private shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  // Note: All register/deregister calls now use the Shortcut object format.
  private selectedValue: string | null = null;
  private filteredOptions: { label: string; value: string }[] = [];

  constructor() {
    super();
    this.searchString = this.searchString || '';
    this.selectNextOption = this.selectNextOption.bind(this);
    this.selectPrevOption = this.selectPrevOption.bind(this);
    this.selectOption = this.selectOption.bind(this);
    this.closeOptions = this.closeOptions.bind(this);
    this.registerShortcuts();
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('visible')) {
      if (this.visible) {
        this.registerShortcuts();
      } else {
        this.deregisterShortcuts();
      }
    }
    if (changedProps.has('searchString')) {
      this.filteredOptions = this.options.filter(({ label }) =>
        label.toLowerCase().startsWith(this.searchString.toLowerCase())
      );
      this.selectedIndex = 0;
      this.selectedValue = this.filteredOptions[0]?.value || null;
      this.requestUpdate();
      this.render();
    }
  }

  private onSelect(selectedValue: string) {
    // This resets the selection for next time it is rendered
    this.dispatchEvent(new ComboboxSelectEvent(selectedValue));
    this.selectedValue = null;
    this.selectedIndex = 0;
  }

  selectNextOption() {
    this.selectedIndex = (this.selectedIndex + 1) % this.filteredOptions.length;
    this.selectedValue = this.filteredOptions[this.selectedIndex].value;
  }

  selectPrevOption() {
    this.selectedIndex =
      (this.selectedIndex - 1 + this.filteredOptions.length) %
      this.filteredOptions.length;
    this.selectedValue = this.filteredOptions[this.selectedIndex].value;
  }

  selectOption(e: KeyboardEvent) {
    const selectedOption =
      this.filteredOptions[this.selectedIndex] ||
      this.filteredOptions.find(({ value }) => value === this.selectedValue);
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
    this.deregisterShortcuts(); // So keyboard events don't continue to handle the menu
    this.onClose();
  }

  registerShortcuts() {
    this.shortcutService.register({
      keys: 'ArrowDown',
      callback: this.selectNextOption.bind(this),
    });
    this.shortcutService.register({
      keys: 'ArrowUp',
      callback: this.selectPrevOption.bind(this),
    });
    this.shortcutService.register({
      keys: 'Enter',
      callback: this.selectOption.bind(this),
    });
    this.shortcutService.register({
      keys: 'Tab',
      callback: this.selectOption.bind(this),
    });
    this.shortcutService.register({
      keys: 'Escape',
      callback: this.closeOptions.bind(this),
    });
  }

  deregisterShortcuts() {
    this.shortcutService.deregister({
      keys: 'ArrowDown',
      callback: this.selectNextOption.bind(this),
    });
    this.shortcutService.deregister({
      keys: 'ArrowUp',
      callback: this.selectPrevOption.bind(this),
    });
    this.shortcutService.deregister({
      keys: 'Enter',
      callback: this.selectOption.bind(this),
    });
    this.shortcutService.deregister({
      keys: 'Tab',
      callback: this.selectOption.bind(this),
    });
    this.shortcutService.deregister({
      keys: 'Escape',
      callback: this.closeOptions.bind(this),
    });
  }

  shouldHighlight(value: string, index: number) {
    return (
      this.selectedValue === value ||
      (this.selectedValue === null && index === 0)
    );
  }

  render() {
    return html`
      <ul class="combobox">
        ${this.filteredOptions.map(
          ({ value, label }, index) => html`
            <li
              class="combobox-option ${this.shouldHighlight(value, index)
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
        width: 100%;
      }

      :host {
        display: block;
      }

      :host([visible]) {
        display: block;
      }

      :host(:not([visible])) {
        display: none;
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
