import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import './icon'; // Import icon component to ensure it's registered

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'negative'
  | 'outline'
  | 'link'
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
  command?: string;
  commandfor?: string;
  private buttonElement: HTMLButtonElement | null = null;

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
      command: { type: String, attribute: 'command' },
      commandfor: { type: String, attribute: 'commandfor' },
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

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.#handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.#handleKeyDown);
  }

  firstUpdated() {
    this.buttonElement = this.shadowRoot?.querySelector('button') || null;
    this.#assignPopoverTarget();
  }

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('commandfor')) {
      this.#assignPopoverTarget();
    }
  }

  /*
   * Assigns the popover target to the button element
   * because the shadowRoot doesn't have access to the document
   */
  #assignPopoverTarget() {
    if (!this.buttonElement || !this.commandfor) return;
    const root = this.getRootNode();
    let popover: HTMLElement | null = null;
    if (root instanceof ShadowRoot && root.host) {
      popover =
        root.host.ownerDocument?.getElementById(this.commandfor) || null;
    }
    if (!popover) {
      popover = document.getElementById(this.commandfor);
    }
    if (popover) {
      (this.buttonElement as any).popoverTargetElement = popover;
    }
  }

  /**
   * For keyboard accessibility, fire a click when enter is pressed
   */
  #handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !this.disabled && !this.loading) {
      e.preventDefault();
      this.buttonElement?.click();
    }
  };

  /**
   * This is needed for proper focus management in modals and keyboard navigation
   */
  focus() {
    this.buttonElement?.focus();
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
        part="button"
        class=${classMap(buttonClasses)}
        ?disabled=${this.disabled || this.loading}
        title=${this.title}
        aria-busy=${this.loading ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        command=${this.command ?? ''}
        commandfor=${this.commandfor ?? ''}
      >
        ${this.icon && this.iconPosition === 'start'
          ? html`
              <span class="icon-container icon-start">
                ${this.loading
                  ? html`<un-icon
                      name="loading"
                      size=${this.size}
                      spin
                    ></un-icon>`
                  : html`<un-icon
                      name=${this.icon}
                      size=${this.size}
                    ></un-icon>`}
              </span>
            `
          : ''}
        ${showText ? this.text : html`<slot></slot>`}
        ${this.icon && this.iconPosition === 'end'
          ? html`
              <span class="icon-container icon-end">
                ${this.loading
                  ? html`<un-icon
                      name="loading"
                      size=${this.size}
                      spin
                    ></un-icon>`
                  : html`<un-icon
                      name=${this.icon}
                      size=${this.size}
                    ></un-icon>`}
              </span>
            `
          : ''}
        ${this.loading && !this.icon
          ? html`<un-icon name="loading" spin size=${this.size}></un-icon>`
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
        padding-left: var(--space-3);
        padding-right: var(--space-3);
        overflow: hidden;
        border: none;
        border-radius: var(--rounded);
        display: flex;
        align-items: center;
        justify-content: center;
        height: var(--button-height);
        line-height: var(--button-height);
        gap: var(--space-2);
        transition: all 100ms;
        background-color: var(--button-color);
        color: var(--button-text-color);
        box-shadow: var(--button-shadows);
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
        box-shadow: none;
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
        border: 1px solid
          color-mix(in oklch, currentColor 85%, transparent 100%);
        box-shadow: none;
      }

      .button--outline:hover {
        border-color: currentColor;
      }

      .button--ghost {
        --button-color: transparent;
        --button-text-color: inherit;
        box-shadow: none;
      }

      .button--link {
        --button-color: transparent;
        --button-text-color: var(--color-action-800);
        box-shadow: none;
      }

      .button--link:hover,
      .button--ghost:hover,
      .button--outline:hover {
        --button-color: var(--color-neutral-200);
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

      .button--small {
        --button-height: 18px;
        font-size: var(--text-sm);
      }

      .button--large {
        --button-height: 28px;
      }

      .icon-container {
        display: flex;
        align-items: center;
        opacity: 0.75;
      }

      .button:hover .icon-container {
        opacity: 1;
      }
    `;
  }
}

customElements.define('un-button', ButtonElement);
