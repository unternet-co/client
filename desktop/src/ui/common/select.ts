import { css } from 'lit';
import './icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export class SelectElement extends HTMLElement {
  private select: HTMLSelectElement;
  private wrapper: HTMLDivElement;
  private icon: HTMLElement;
  private mutationObserver: MutationObserver;

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
      }

      .select-wrapper {
        position: relative;
        width: 100%;
      }

      select {
        width: 100%;
        padding: var(--space-3);
        padding-right: var(--space-8);
        border: 1px solid var(--color-border);
        border-radius: var(--rounded-sm);
        background-color: var(--color-bg-input);
        color: var(--color-text);
        font-family: inherit;
        font-size: inherit;
        line-height: 1.5;
        appearance: none;
        cursor: pointer;
        box-sizing: border-box;
      }

      select:focus {
        outline: 2px solid var(--color-outline);
        outline-offset: -1px;
      }

      select:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      select option:disabled {
        color: var(--color-text-subtle);
      }

      un-icon {
        position: absolute;
        right: var(--space-3);
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--color-text);
      }

      select:disabled + un-icon {
        opacity: 0.6;
      }
    `;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'select-wrapper';

    this.select = document.createElement('select');
    this.select.addEventListener('change', this.handleChange.bind(this));

    this.icon = document.createElement('un-icon');
    this.icon.setAttribute('name', 'dropdown');

    this.wrapper.appendChild(this.select);
    this.wrapper.appendChild(this.icon);

    // Create a mutation observer to watch for changes to child elements
    this.mutationObserver = new MutationObserver(
      this.handleMutations.bind(this)
    );
  }

  static get observedAttributes() {
    return ['value', 'disabled', 'placeholder'];
  }

  connectedCallback() {
    // Add styles
    const style = document.createElement('style');
    style.textContent = SelectElement.styles.toString();
    this.shadowRoot!.appendChild(style);

    this.shadowRoot!.appendChild(this.wrapper);
    this.updateSelect();

    // Start observing changes to child elements
    this.mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Also listen for the custom optionsChanged event
    this.addEventListener('optionsChanged', () => this.updateSelect());
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    if (!this.select) return;

    switch (name) {
      case 'value':
        this.select.value = newValue || '';
        break;
      case 'disabled':
        this.select.disabled = newValue !== null;
        break;
      case 'placeholder':
        this.updateSelect();
        break;
    }
  }

  disconnectedCallback() {
    // Stop observing when element is removed from the DOM
    this.mutationObserver.disconnect();
  }

  get value(): string {
    return this.getAttribute('value') || '';
  }

  set value(newValue: string) {
    this.setAttribute('value', newValue);
  }

  private get options(): SelectOption[] {
    return Array.from(this.children).map((el) => ({
      value: el.getAttribute('value') || '',
      label: el.textContent || '',
      disabled: el.hasAttribute('disabled'),
    }));
  }

  private handleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.value = select.value;

    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  private handleMutations(mutations: MutationRecord[]) {
    // Check if any of the mutations are relevant to our options
    const shouldUpdate = mutations.some((mutation) => {
      // If options were added or removed
      if (mutation.type === 'childList') {
        return true;
      }

      // If option text or attributes changed
      if (mutation.type === 'characterData' || mutation.type === 'attributes') {
        const target = mutation.target as Node;
        // Check if the mutation happened within an option element
        return (
          this.contains(target) ||
          (target.parentNode && this.contains(target.parentNode))
        );
      }

      return false;
    });

    if (shouldUpdate) {
      console.log('Select options changed, updating select element');
      this.updateSelect();
    }
  }

  private updateSelect() {
    // Clear existing options
    while (this.select.firstChild) {
      this.select.removeChild(this.select.firstChild);
    }

    // Add placeholder if exists
    const placeholder = this.getAttribute('placeholder');
    if (placeholder) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = placeholder;
      option.disabled = true;
      option.selected = !this.value;
      this.select.appendChild(option);
    }

    // Add options from slot
    this.options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.disabled = opt.disabled || false;
      this.select.appendChild(option);
    });

    // Set current value
    this.select.value = this.value;
    this.select.disabled = this.hasAttribute('disabled');
  }
}

customElements.define('un-select', SelectElement);
