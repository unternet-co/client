import { css } from 'lit';
import './icon';

export class InputElement extends HTMLElement {
  private input: HTMLInputElement;
  private wrapper: HTMLDivElement;
  private clearButton?: HTMLButtonElement;

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
      }

      .input-wrapper {
        position: relative;
        width: 100%;
      }

      input {
        width: 100%;
        padding: var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: var(--rounded-sm);
        background-color: var(--color-bg-input);
        color: var(--color-text);
        font-family: inherit;
        font-size: inherit;
        line-height: 1;
        box-sizing: border-box;
      }

      input:focus {
        outline: 2px solid var(--color-outline);
        outline-offset: -1px;
      }

      input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      input::placeholder {
        color: var(--color-text-disabled);
      }

      /* Type-specific styles */
      input[type='number'] {
        -moz-appearance: textfield;
      }

      input[type='number']::-webkit-outer-spin-button,
      input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      input[type='search'] {
        border-radius: 16px;
        padding-left: var(--space-6);
        padding-right: var(--space-8);
      }

      input[type='search']::-webkit-search-decoration,
      input[type='search']::-webkit-search-cancel-button,
      input[type='search']::-webkit-search-results-button,
      input[type='search']::-webkit-search-results-decoration {
        -webkit-appearance: none;
      }

      .clear-button {
        position: absolute;
        right: var(--space-4);
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: none;
        color: var(--color-text-default);
        opacity: 0.6;
        transition: opacity 0.2s ease;
      }

      .clear-button:hover {
        opacity: 1;
      }

      .clear-button:disabled {
        opacity: 0;
        pointer-events: none;
      }

      input:disabled + .clear-button {
        display: none;
      }
    `;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'input-wrapper';

    this.input = document.createElement('input');
    this.input.addEventListener('input', this.handleInput.bind(this));
    this.input.addEventListener('change', this.handleChange.bind(this));

    this.wrapper.appendChild(this.input);
  }

  private setupClearButton() {
    if (this.input.type === 'search' && !this.clearButton) {
      this.clearButton = document.createElement('button') as HTMLButtonElement;
      this.clearButton.className = 'clear-button';
      this.clearButton.setAttribute('type', 'button');
      this.clearButton.setAttribute('aria-label', 'Clear search');

      const icon = document.createElement('un-icon');
      icon.setAttribute('name', 'close');
      this.clearButton.appendChild(icon);

      this.clearButton.addEventListener('click', () => {
        this.input.value = '';
        this.value = '';
        this.input.focus();
        this.input.dispatchEvent(new Event('input'));
      });

      this.wrapper.appendChild(this.clearButton);
      this.updateClearButton();
    }
  }

  private updateClearButton() {
    if (this.clearButton) {
      this.clearButton.disabled = !this.value;
    }
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = InputElement.styles.toString();
    this.shadowRoot!.appendChild(style);
    this.shadowRoot!.appendChild(this.wrapper);
    this.updateInput();
  }

  static get observedAttributes() {
    return [
      'value',
      'type',
      'placeholder',
      'disabled',
      'readonly',
      'required',
      'minlength',
      'maxlength',
      'min',
      'max',
      'step',
      'pattern',
    ];
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    if (!this.input) return;

    switch (name) {
      case 'value':
        this.input.value = newValue || '';
        break;
      case 'type':
        this.input.type = newValue || 'text';
        break;
      case 'placeholder':
        this.input.placeholder = newValue || '';
        break;
      case 'disabled':
        this.input.disabled = newValue !== null;
        break;
      case 'readonly':
        this.input.readOnly = newValue !== null;
        break;
      case 'required':
        this.input.required = newValue !== null;
        break;
      case 'minlength':
        this.input.minLength = newValue ? parseInt(newValue, 10) : -1;
        break;
      case 'maxlength':
        this.input.maxLength = newValue ? parseInt(newValue, 10) : -1;
        break;
      case 'min':
        this.input.min = newValue || '';
        break;
      case 'max':
        this.input.max = newValue || '';
        break;
      case 'step':
        this.input.step = newValue || '';
        break;
      case 'pattern':
        this.input.pattern = newValue || '';
        break;
    }
  }

  get value(): string {
    return this.getAttribute('value') || '';
  }

  set value(newValue: string) {
    this.setAttribute('value', newValue);
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.updateClearButton();

    this.dispatchEvent(
      new CustomEvent('input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  private handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;

    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  private updateInput() {
    this.input.value = this.value;
    this.input.type = this.getAttribute('type') || 'text';
    this.input.placeholder = this.getAttribute('placeholder') || '';
    this.input.disabled = this.hasAttribute('disabled');
    this.input.readOnly = this.hasAttribute('readonly');
    this.input.required = this.hasAttribute('required');

    const minLength = this.getAttribute('minlength');
    if (minLength !== null) {
      this.input.minLength = parseInt(minLength, 10);
    }

    const maxLength = this.getAttribute('maxlength');
    if (maxLength !== null) {
      this.input.maxLength = parseInt(maxLength, 10);
    }

    this.input.min = this.getAttribute('min') || '';
    this.input.max = this.getAttribute('max') || '';
    this.input.step = this.getAttribute('step') || '';
    this.input.pattern = this.getAttribute('pattern') || '';

    this.setupClearButton();
    this.updateClearButton();
  }
}

customElements.define('un-input', InputElement);
