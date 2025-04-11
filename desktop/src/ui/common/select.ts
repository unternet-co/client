import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import './icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'small' | 'medium' | 'large';
export type SelectVariant = 'default' | 'ghost' | 'flat';

export class SelectElement extends LitElement {
  value: string = '';
  placeholder: string = '';
  disabled: boolean = false;
  required: boolean = false;
  name: string = '';
  size: SelectSize = 'medium';
  variant: SelectVariant = 'default';

  static get properties() {
    return {
      value: { type: String },
      placeholder: { type: String },
      disabled: { type: Boolean },
      required: { type: Boolean },
      name: { type: String },
      size: { type: String },
      variant: { type: String },
    };
  }

  constructor() {
    super();
    this.size = 'medium';
    this.variant = 'default';
  }

  private handleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.value = select.value;
  }

  focus() {
    const select = this.shadowRoot?.querySelector('select');
    if (select) {
      select.focus();
    }
  }

  blur() {
    const select = this.shadowRoot?.querySelector('select');
    if (select) {
      select.blur();
    }
  }

  private get options(): SelectOption[] {
    return Array.from(this.children).map((el) => ({
      value: el.getAttribute('value') || '',
      label: el.textContent || '',
      disabled: el.hasAttribute('disabled'),
    }));
  }

  render() {
    const selectClasses = {
      select: true,
      [`select--${this.size}`]: this.size !== 'medium',
      [`select--${this.variant}`]: this.variant !== 'default',
    };

    // Create options elements
    const optionElements = [];

    // Add placeholder if exists
    if (this.placeholder) {
      optionElements.push(html`
        <option value="" disabled ?selected=${!this.value}>
          ${this.placeholder}
        </option>
      `);
    }

    // Add options from slot
    this.options.forEach((opt) => {
      optionElements.push(html`
        <option
          value=${opt.value}
          ?disabled=${opt.disabled}
          ?selected=${this.value === opt.value}
        >
          ${opt.label}
        </option>
      `);
    });

    return html`
      <div
        class="select-wrapper ${this.size !== 'medium'
          ? `select-wrapper--${this.size}`
          : ''}"
      >
        <select
          class=${classMap(selectClasses)}
          .value=${this.value}
          ?disabled=${this.disabled}
          ?required=${this.required}
          name=${this.name}
          @change=${this.handleChange}
        >
          ${optionElements}
        </select>
        <un-icon name="dropdown"></un-icon>
      </div>
    `;
  }

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

      .select {
        --select-height: 24px;
        width: 100%;
        height: var(--select-height);
        padding: 0 var(--space-8) 0 var(--space-4);
        border-radius: var(--rounded);
        border: 1px solid var(--input-border-color);
        border-top-color: color-mix(
          in srgb,
          var(--input-border-color) 100%,
          transparent 50%
        );
        background-color: var(--input-bg-color);
        color: var(--input-text-color);
        font-family: inherit;
        font-size: inherit;
        line-height: var(--select-height);
        appearance: none;
        box-sizing: border-box;
        box-shadow: var(--button-shadows);
      }

      .select:focus {
        outline: var(--outline);
        outline-offset: var(--outline-offset-inputs);
      }

      .select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .select option:disabled {
        color: var(--input-placeholder-color);
      }

      .select--small {
        --select-height: 18px;
        font-size: var(--text-sm);
      }

      .select--large {
        --select-height: 28px;
      }

      .select--ghost {
        border-color: transparent;
        background-color: transparent;
        box-shadow: none;
      }

      .select--flat {
        border-color: transparent;
        box-shadow: none;
        mix-blend-mode: multiply;
        background-color: var(--input-bg-color-flat);
      }

      un-icon {
        position: absolute;
        right: 1px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--input-placeholder-color);
        border-left: 1px solid
          color-mix(in srgb, var(--input-border-color) 100%, transparent 50%);
        height: 100%;
        width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      select:disabled + un-icon {
        opacity: 0.5;
      }
    `;
  }
}

customElements.define('un-select', SelectElement);
