import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import './icon';

export type InputSize = 'small' | 'medium' | 'large';
export type InputVariant = 'default' | 'ghost' | 'flat';
export type IconPosition = 'start' | 'end';

export class InputElement extends LitElement {
  value: string = '';
  type: string = 'text';
  placeholder: string = '';
  disabled: boolean = false;
  readonly: boolean = false;
  required: boolean = false;
  minlength: number = -1;
  maxlength: number = -1;
  min: string = '';
  max: string = '';
  step: string = '';
  pattern: string = '';
  name: string = '';
  autocomplete: string = '';
  size: InputSize = 'medium';
  variant: InputVariant = 'default';
  loading: boolean = false;
  icon?: string;
  iconPosition: IconPosition = 'end';

  static get properties() {
    return {
      value: { type: String },
      type: { type: String },
      placeholder: { type: String },
      disabled: { type: Boolean },
      readonly: { type: Boolean },
      required: { type: Boolean },
      minlength: { type: Number },
      maxlength: { type: Number },
      min: { type: String },
      max: { type: String },
      step: { type: String },
      pattern: { type: String },
      name: { type: String },
      autocomplete: { type: String },
      size: { type: String },
      variant: { type: String },
      loading: { type: Boolean },
      icon: { type: String },
      iconPosition: { type: String, attribute: 'icon-position' },
    };
  }

  constructor() {
    super();
    this.size = 'medium';
    this.variant = 'default';
    this.loading = false;
    this.icon = undefined;
    this.iconPosition = 'end';
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;

    // Dispatch a custom event with the new value
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;

    // Dispatch a custom event with the new value
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleClear() {
    this.value = '';
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );

    // Focus the input after clearing
    const input = this.shadowRoot?.querySelector('input');
    if (input) {
      input.focus();
    }
  }

  focus() {
    const input = this.shadowRoot?.querySelector('input');
    if (input) {
      input.focus();
    }
  }

  blur() {
    const input = this.shadowRoot?.querySelector('input');
    if (input) {
      input.blur();
    }
  }

  select() {
    const input = this.shadowRoot?.querySelector('input');
    if (input) {
      input.select();
    }
  }

  render() {
    const showClearButton = this.type === 'search' && this.value;
    const inputClasses = {
      input: true,
      [`input--${this.size}`]: this.size !== 'medium',
      [`input--${this.variant}`]: this.variant !== 'default',
      loading: this.loading,
    };

    return html`
      <div
        class="input-wrapper ${this.size !== 'medium'
          ? `input-wrapper--${this.size}`
          : ''} ${this.icon ? `has-icon icon-${this.iconPosition}` : ''}"
      >
        ${this.icon && this.iconPosition === 'start'
          ? html`<un-icon
              class="input-icon input-icon-start"
              name=${this.loading ? 'loading' : this.icon}
              size=${this.size}
              ?spin=${this.loading}
            ></un-icon>`
          : ''}
        <input
          part="input"
          class=${classMap(inputClasses)}
          .value=${this.value}
          type=${this.type}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled || this.loading}
          ?readonly=${this.readonly}
          ?required=${this.required}
          minlength=${this.minlength > 0 ? this.minlength : ''}
          maxlength=${this.maxlength > 0 ? this.maxlength : ''}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          pattern=${this.pattern}
          name=${this.name}
          autocomplete=${this.autocomplete}
          @input=${this.handleInput}
          @change=${this.handleChange}
          aria-busy=${this.loading ? 'true' : 'false'}
        />
        ${this.icon && this.iconPosition === 'end'
          ? html`<un-icon
              class="input-icon input-icon-end"
              name=${this.loading ? 'loading' : this.icon}
              size=${this.size}
              ?spin=${this.loading}
            ></un-icon>`
          : ''}
        ${showClearButton && !this.loading
          ? html`
              <un-button
                class="clear-button"
                type="ghost"
                size=${this.size}
                icon="close"
                aria-label="Clear search"
                @click=${this.handleClear}
              >
              </un-button>
            `
          : ''}
        ${this.loading && !this.icon
          ? html`<un-icon
              class="loading-icon"
              name="loading"
              spin
              size=${this.size}
            ></un-icon>`
          : ''}
      </div>
    `;
  }

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

      .input {
        --input-height: 24px;
        width: 100%;
        height: var(--input-height);
        padding: 0 var(--space-4);
        border-radius: var(--rounded);
        border: 1px solid var(--input-border-color);
        border-bottom-color: color-mix(
          in srgb,
          var(--input-border-color) 100%,
          transparent 25%
        );
        background-color: var(--input-bg-color);
        color: var(--input-text-color);
        font-family: inherit;
        font-size: inherit;
        line-height: var(--input-height);
        box-sizing: border-box;
        box-shadow: var(--input-shadows);
      }

      .input:focus {
        outline: var(--outline);
        outline-offset: var(--outline-offset-inputs);
      }

      .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .input::placeholder {
        color: var(--input-placeholder-color);
      }

      .input[type='number'] {
        -moz-appearance: textfield;
      }

      .input[type='number']::-webkit-outer-spin-button,
      .input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .input--small {
        --input-height: 18px;
        font-size: var(--text-sm);
      }

      .input--large {
        --input-height: 28px;
      }

      .input--ghost {
        border-color: transparent;
        background-color: transparent;
        box-shadow: none;
      }

      .input--flat {
        border-color: transparent;
        box-shadow: none;
        background-color: var(--input-bg-color-flat);
      }

      .input[type='search'] {
        border-radius: 16px;
        padding-left: var(--space-5);
        padding-right: var(--space-8);
      }

      .input[type='search']::-webkit-search-decoration,
      .input[type='search']::-webkit-search-cancel-button,
      .input[type='search']::-webkit-search-results-button,
      .input[type='search']::-webkit-search-results-decoration {
        -webkit-appearance: none;
      }

      /* Icon positioning */
      .has-icon.icon-start .input {
        padding-left: calc(var(--space-4) * 2 + 16px);
      }

      .has-icon.icon-end .input {
        padding-right: calc(var(--space-4) * 2 + 16px);
      }

      .input-icon,
      .loading-icon {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-default);
        pointer-events: none;
      }

      .input-icon-start {
        left: var(--space-4);
      }

      .input-icon-end {
        right: var(--space-4);
      }

      .loading-icon {
        right: var(--space-4);
      }

      /* Adjust clear button position when there's an end icon */
      .has-icon.icon-end .clear-button {
        right: calc(var(--space-4) * 2 + 16px);
      }

      .input-wrapper--small .clear-button {
        --button-height: 18px;
      }

      .input-wrapper--large .clear-button {
        --button-height: 28px;
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
        transition: opacity 0.2s ease;
        cursor: pointer;
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
}

customElements.define('un-input', InputElement);
