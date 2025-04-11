import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import './icon'; // Import icon component to ensure it's registered

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'negative'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'small' | 'medium' | 'large';

export type IconPosition = 'start' | 'end';

export class ButtonElement extends LitElement {
  type: ButtonType;
  size: ButtonSize;
  text: string;
  icon?: string;
  iconPosition: IconPosition;
  disabled: boolean;
  loading: boolean;
  title: string;

  static get properties() {
    return {
      type: { type: String },
      size: { type: String },
      text: { type: String },
      icon: { type: String },
      iconPosition: { type: String, attribute: 'icon-position' },
      disabled: { type: Boolean },
      loading: { type: Boolean },
      title: { type: String },
    };
  }

  constructor() {
    super();
    this.type = 'primary';
    this.size = 'medium';
    this.text = '';
    this.icon = undefined;
    this.iconPosition = 'start';
    this.disabled = false;
    this.loading = false;
    this.title = '';
  }

  handleClick(e: Event) {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent('click', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * This is needed for proper focus management in modals and keyboard navigation
   */
  focus() {
    const button = this.shadowRoot?.querySelector('button');
    button?.focus();
  }

  render() {
    const buttonClasses = {
      button: true,
      [`button--${this.type}`]: this.type !== 'primary',
      [`button--${this.size}`]: this.size !== 'medium',
      loading: this.loading,
    };

    const hasSlotContent = this.hasChildNodes();
    const showText = !hasSlotContent && this.text;

    return html`
      <button
        class=${classMap(buttonClasses)}
        ?disabled=${this.disabled || this.loading}
        title=${this.title}
        aria-busy=${this.loading ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        @click=${this.handleClick}
      >
        ${this.icon && this.iconPosition === 'start'
          ? html`
              <span class="icon-container icon-start">
                ${this.loading
                  ? html`
                      <un-icon name="loading" size=${this.size} spin></un-icon>
                    `
                  : html`
                      <un-icon name=${this.icon} size=${this.size}></un-icon>
                    `}
              </span>
            `
          : ''}
        ${showText ? this.text : html`<slot></slot>`}
        ${this.icon && this.iconPosition === 'end'
          ? html`
              <span class="icon-container icon-end">
                ${this.loading
                  ? html`
                      <un-icon name="loading" size=${this.size} spin></un-icon>
                    `
                  : html`
                      <un-icon name=${this.icon} size=${this.size}></un-icon>
                    `}
              </span>
            `
          : ''}
        ${this.loading && !this.icon
          ? html` <un-icon name="loading" spin size=${this.size}></un-icon> `
          : ''}
      </button>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
      }

      .button {
        --button-height: 24px;
        --button-color: var(--color-action-800);
        --button-text-color: var(--color-action-0);
        padding-left: var(--space-4);
        padding-right: var(--space-4);
        overflow: hidden;
        border: none;
        border-radius: var(--rounded);
        display: flex;
        align-items: center;
        justify-content: center;
        height: var(--button-height);
        line-height: var(--button-height);
        gap: var(--space-2);
        transition: all 50ms;
        background-color: var(--button-color);
        color: var(--button-text-color);
        box-shadow:
          inset 0 1px 1px 0px
            color-mix(in srgb, var(--color-grey-0) 25%, transparent 100%),
          inset 0 -1px 1px 0px
            color-mix(in srgb, var(--color-grey-1000) 25%, transparent 100%);
      }

      .button:hover,
      .button:focus {
        background-color: color-mix(
          in oklch,
          var(--button-color) 100%,
          var(--color-grey-0) 25%
        );
      }

      .button:disabled {
        cursor: not-allowed;
        pointer-events: none;
        opacity: 0.5;
      }

      .button--secondary {
        --button-color: var(--color-neutral-200);
        --button-text-color: var(--color-neutral-1000);
      }

      .button--secondary:hover {
        --button-text-color: var(--color-action-800);
      }

      .button--negative {
        --button-color: var(--color-error-800);
        --button-text-color: var(--color-error-0);
      }

      .button--outline {
        --button-color: transparent;
        --button-text-color: currentColor;
        border: 1px solid currentColor;
        box-shadow: none;
      }

      .button--ghost {
        --button-color: transparent;
        --button-text-color: inherit;
        box-shadow: none;
      }

      .button--ghost:hover,
      .button--outline:hover {
        --button-color: var(--color-neutral-100);
        background-blend-mode: multiply;
        opacity: 1;
      }

      .button:focus {
        outline: var(--outline);
        outline-offset: var(--outline-offset);
      }

      /* Hides outline eg. after mouse click, when it's not a helpful indicator */
      .button:focus:not(:focus-visible) {
        outline: none;
      }

      .button:active {
        box-shadow: none;
        background-color: var(--button-color);
      }

      .button.loading {
        pointer-events: none;
      }

      .icon-container {
        display: flex;
        align-items: center;
      }

      .button--small {
        --button-height: 18px;
        font-size: var(--text-sm);
      }

      .button--large {
        --button-height: 28px;
      }
    `;
  }
}

customElements.define('un-button', ButtonElement);
