import { css } from 'lit';

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'negative'
  | 'outline'
  | 'ghost';

export class ButtonElement extends HTMLElement {
  private button: HTMLButtonElement;
  private buttonContent: string = '';

  constructor() {
    super();
    this.buttonContent = this.textContent || '';
    this.button = document.createElement('button');
    this.button.addEventListener('click', this.handleClick.bind(this));

    // Create shadow DOM and add button
    this.attachShadow({ mode: 'open' });

    // Add styles to shadow DOM
    const style = document.createElement('style');
    style.textContent = ButtonElement.styles.toString();
    this.shadowRoot!.appendChild(style);
    this.shadowRoot!.appendChild(this.button);

    // Create a slot to handle children
    const slot = document.createElement('slot');
    this.button.appendChild(slot);
  }

  connectedCallback() {
    this.updateButton();
  }

  disconnectedCallback() {
    this.button.removeEventListener('click', this.handleClick.bind(this));
  }

  static get observedAttributes() {
    return ['type', 'disabled', 'text', 'title'];
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    if (!this.button) return;

    switch (name) {
      case 'type':
        this.updateButtonClasses();
        break;
      case 'disabled':
        this.button.disabled = newValue !== null;
        break;
      case 'text':
        this.button.textContent = this.buttonText;
        break;
      case 'title':
        this.button.title = newValue || '';
        break;
    }
  }

  private get buttonType(): ButtonType {
    return (this.getAttribute('type') as ButtonType) || 'primary';
  }

  private get isDisabled(): boolean {
    return this.hasAttribute('disabled');
  }

  private get buttonText(): string {
    return this.getAttribute('text') || this.buttonContent || '';
  }

  private handleClick(e: Event) {
    if (this.isDisabled) {
      e.preventDefault();
      return;
    }
    this.dispatchEvent(
      new CustomEvent('click', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private updateButtonClasses() {
    this.button.className = 'button';
    if (this.buttonType !== 'primary') {
      this.button.classList.add(`button--${this.buttonType}`);
    }
  }

  private updateButton() {
    this.updateButtonClasses();
    this.button.disabled = this.isDisabled;
    if (!this.hasChildNodes() && this.hasAttribute('text')) {
      this.button.textContent = this.buttonText;
    }
    this.button.title = this.getAttribute('title') || '';
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
      }

      .button {
        --button-color: var(--color-action-800);
        --button-text-color: var(--color-action-0);
        padding: var(--space-4);
        border: none;
        border-radius: var(--rounded-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        line-height: 1;
        min-height: 32px;
        transition:
          background-color 0.2s,
          opacity 0.2s;
        background-color: var(--button-color);
        color: var(--button-text-color);
        box-shadow:
          inset 0 1px 1px 0px
            color-mix(in srgb, var(--color-grey-0) 25%, transparent 100%),
          inset 0 -1px 1px 0px
            color-mix(in srgb, var(--color-grey-1000) 25%, transparent 100%);
      }

      .button:hover:not(:disabled),
      .button:focus:not(:disabled) {
        outline: 1px solid var(--color-outline);
        background-color: color-mix(
          in oklch,
          var(--button-color) 100%,
          var(--color-action-0) 15%
        );
      }

      .button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .button--secondary {
        --button-color: var(--color-neutral-200);
        --button-text-color: var(--color-neutral-1000);
      }

      .button--secondary:hover:not(:disabled) {
        --button-text-color: var(--color-action-800);
      }

      .button--negative {
        --button-color: var(--color-error-800);
        --button-text-color: var(--color-error-0);
      }

      .button--outline {
        --button-color: currentColor;
        --button-text-color: currentColor;
        background-color: transparent;
        border: 1px solid var(--button-color);
        box-shadow: none;
      }

      .button--outline:hover:not(:disabled) {
        background-color: transparent;
      }

      .button--ghost {
        --button-color: transparent;
        --button-text-color: inherit;
        box-shadow: none;
      }

      .button--ghost:hover:not(:disabled) {
        --button-color: color-mix(
          in srgb,
          var(--color-action-800) 15%,
          transparent 100%
        );
        background-blend-mode: multiply;
        opacity: 1;
      }
    `;
  }
}

customElements.define('un-button', ButtonElement);
