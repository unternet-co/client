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
export type IconPosition = 'start' | 'end';

export class SelectElement extends LitElement {
  private _mutationObserver?: MutationObserver;

  value: string = '';
  placeholder: string = '';
  disabled: boolean = false;
  required: boolean = false;
  name: string = '';
  size: SelectSize = 'medium';
  variant: SelectVariant = 'default';
  loading: boolean = false;
  icon?: string;
  iconPosition: IconPosition = 'end';

  static get properties() {
    return {
      value: { type: String },
      placeholder: { type: String },
      disabled: { type: Boolean },
      required: { type: Boolean },
      name: { type: String },
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

  // Watch change in children (e.g. options)
  connectedCallback() {
    super.connectedCallback();
    this._mutationObserver = new MutationObserver(() => {
      this.requestUpdate();
    });
    this._mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._mutationObserver?.disconnect();
  }

  updated() {
    const selectElement = this.shadowRoot.querySelector('select');
    if (!selectElement) return;

    const options = Array.from(selectElement.querySelectorAll('option'));
    const idx = options.findIndex((opt) => opt.value === this.value);

    selectElement.selectedIndex = idx;
  }

  private handleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.value = select.value;

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
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
      loading: this.loading,
    };

    const optionElements = [];

    if (this.placeholder) {
      optionElements.push(html`
        <option value="" disabled ?selected=${!this.value}>
          ${this.placeholder}
        </option>
      `);
    }

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
          : ''} ${this.icon ? `has-icon icon-${this.iconPosition}` : ''}"
      >
        ${this.icon && this.iconPosition === 'start'
          ? html`<un-icon
              class="value-icon value-icon-start"
              name=${this.icon}
              size=${this.size}
            ></un-icon>`
          : ''}
        <select
          class=${classMap(selectClasses)}
          .value=${this.value}
          ?disabled=${this.disabled || this.loading}
          ?required=${this.required}
          name=${this.name}
          @change=${this.handleChange}
          aria-busy=${this.loading ? 'true' : 'false'}
        >
          ${optionElements}
        </select>
        ${this.icon && this.iconPosition === 'end'
          ? html`<un-icon
              class="value-icon value-icon-end"
              name=${this.icon}
              size=${this.size}
            ></un-icon>`
          : ''}
        ${this.loading
          ? html`<un-icon
              class="dropdown-icon"
              name="loading"
              spin
              size=${this.size}
            ></un-icon>`
          : html`<un-icon class="dropdown-icon" name="dropdown"></un-icon>`}
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
        background-color: var(--input-bg-color);
        color: var(--input-text-color);
        font-family: inherit;
        font-size: inherit;
        line-height: var(--select-height);
        appearance: none;
        box-sizing: border-box;
        border: 1px solid var(--input-border-color);
        border-top-color: color-mix(
          in srgb,
          var(--input-border-color) 100%,
          transparent 50%
        );
        box-shadow: var(--button-shadows);
      }

      .select:focus {
        outline: var(--outline);
        outline-offset: var(--outline-offset-inputs);
      }

      .select:disabled,
      .select.loading {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .loading {
        pointer-events: none;
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
        font-weight: 500;
        font-size: var(--text-sm);
        padding-right: var(--space-6);
        margin-bottom: 2px;
      }

      .select-wrapper:has(.select--ghost):hover un-icon.dropdown-icon {
        opacity: 1;
      }

      .select--flat {
        border-color: transparent;
        box-shadow: none;
        mix-blend-mode: multiply;
        background-color: var(--input-bg-color-flat);
      }

      .select--flat + un-icon.dropdown-icon,
      .select--flat ~ un-icon.dropdown-icon {
        border-left-color: transparent;
      }

      un-icon.dropdown-icon {
        position: absolute;
        right: 1px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--color-text-muted);
        border-left: 1px solid
          color-mix(in srgb, var(--input-border-color) 100%, transparent 50%);
        height: 100%;
        width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .select--ghost + un-icon.dropdown-icon,
      .select--ghost ~ un-icon.dropdown-icon {
        border: 1px solid var(--input-border-color);
        border-top-color: color-mix(
          in srgb,
          var(--input-border-color) 100%,
          transparent 50%
        );
        box-shadow: var(--button-shadows);
        border-radius: var(--rounded);
        height: 16px;
        width: 16px;
        right: var(--space-2);
      }

      un-icon.value-icon {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--input-text-color);
        z-index: 1;
      }

      un-icon.value-icon-start {
        left: var(--space-4);
      }

      un-icon.value-icon-end {
        right: calc(20px + var(--space-4));
      }

      .has-icon.icon-start select {
        padding-left: calc(var(--space-4) + 16px);
      }

      .has-icon.icon-end select {
        padding-right: calc(var(--space-8) + 16px);
      }

      select:disabled + un-icon {
        opacity: 0.5;
      }
    `;
  }
}

customElements.define('un-select', SelectElement);
