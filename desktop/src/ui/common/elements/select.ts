import { html, css, render } from 'lit';
import './icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'small' | 'medium' | 'large';
export type SelectVariant = 'default' | 'ghost' | 'flat';
export type IconPosition = 'start' | 'end';

export class SelectElement extends HTMLElement {
  private _mutationObserver?: MutationObserver;
  private _selectEl?: HTMLSelectElement;

  static get observedAttributes() {
    return [
      'value',
      'placeholder',
      'disabled',
      'required',
      'name',
      'size',
      'variant',
      'loading',
      'icon',
      'icon-position',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._mutationObserver = new MutationObserver(() => this.render());
    this._mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.render();
  }

  disconnectedCallback() {
    this._mutationObserver?.disconnect();
    if (this._selectEl) {
      this._selectEl.removeEventListener('change', this.handleChange);
    }
  }

  attributeChangedCallback() {
    this.render();
  }

  /**
   * Focuses the select input.
   */
  focus() {
    this._selectEl?.focus();
  }
  blur() {
    this._selectEl?.blur();
  }

  /**
   * Returns the options derived from child elements.
   */
  private get options(): SelectOption[] {
    return Array.from(this.children).map((el) => ({
      value: el.getAttribute('value') || '',
      label: el.textContent || '',
      disabled: el.hasAttribute('disabled'),
    }));
  }

  private get wrapperClasses() {
    const size = this.getAttribute('size');
    const icon = this.getAttribute('icon');
    const iconPosition = this.getAttribute('icon-position');
    return [
      'select-wrapper',
      size && size !== 'medium' ? `select-wrapper--${size}` : '',
      icon ? `has-icon icon-${iconPosition === 'start' ? 'start' : 'end'}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  private get selectClasses() {
    const size = this.getAttribute('size');
    const variant = this.getAttribute('variant');
    const loading = this.hasAttribute('loading');
    return [
      'select',
      size && size !== 'medium' ? `select--${size}` : '',
      variant && variant !== 'default' ? `select--${variant}` : '',
      loading ? 'loading' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  private renderOptions() {
    const nodes = [];
    const placeholder = this.getAttribute('placeholder');
    const value = this.getAttribute('value');
    if (placeholder) {
      nodes.push(
        html`<option value="" disabled ?selected=${!value}>
          ${placeholder}
        </option>`
      );
    }
    this.options.forEach((opt) => {
      nodes.push(
        html`<option
          value=${opt.value}
          ?disabled=${opt.disabled}
          ?selected=${value === opt.value}
        >
          ${opt.label}
        </option>`
      );
    });
    return nodes;
  }

  private renderIcon(position: IconPosition) {
    const icon = this.getAttribute('icon');
    const iconPosition = this.getAttribute('icon-position');
    const size = this.getAttribute('size') || 'medium';
    if (!icon || iconPosition !== position) return null;
    return html`<un-icon
      class="value-icon value-icon-${position}"
      name=${icon}
      size=${size}
    ></un-icon>`;
  }

  private renderDropdownIcon() {
    const loading = this.hasAttribute('loading');
    const size = this.getAttribute('size') || 'medium';
    return loading
      ? html`<un-icon
          class="dropdown-icon"
          name="loading"
          spin
          size=${size}
        ></un-icon>`
      : html`<un-icon class="dropdown-icon" name="dropdown"></un-icon>`;
  }

  /**
   * Handles select value change.
   */
  private handleChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.setAttribute('value', select.value);
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: select.value },
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Renders the component template.
   */
  render() {
    const value = this.getAttribute('value');
    const disabled =
      this.hasAttribute('disabled') || this.hasAttribute('loading');
    const required = this.hasAttribute('required');
    const name = this.getAttribute('name') ?? '';
    const loading = this.hasAttribute('loading');
    render(
      html`
        <style>
          ${SelectElement.styles}
        </style>
        <div class="${this.wrapperClasses}">
          ${this.renderIcon('start')}
          <select
            class=${this.selectClasses}
            .value=${value}
            ?disabled=${disabled}
            ?required=${required}
            name=${name}
            aria-busy=${loading ? 'true' : 'false'}
          >
            ${this.renderOptions()}
          </select>
          ${this.renderIcon('end')} ${this.renderDropdownIcon()}
        </div>
      `,
      this.shadowRoot!
    );
    // Attach event listener after render
    this._selectEl = this.shadowRoot!.querySelector('select')!;
    if (this._selectEl) {
      this._selectEl.removeEventListener('change', this.handleChange);
      this._selectEl.addEventListener('change', this.handleChange);
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        --select-height: 24px;
      }
      .select-wrapper {
        position: relative;
        width: 100%;
      }
      .select {
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
        /* font-weight: 500; */
        /* font-size: var(--text-sm); */
        padding-right: var(--space-6);
        /* margin-bottom: 2px; */
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
