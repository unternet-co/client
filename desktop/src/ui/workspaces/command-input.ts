import { LitElement, html, css } from 'lit';
import { KernelInput } from '../../ai/kernel';
import '../common/elements/input';
import '../common/elements/button';

export class CommandSubmitEvent extends Event {
  input: KernelInput;

  constructor(value: string) {
    super('submit', {
      bubbles: true,
      composed: true,
    });

    this.input = { text: value };
  }
}

export class CommandInputElement extends LitElement {
  static properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    placeholder: { type: String },
  };

  value: string = '';
  disabled: boolean = false;
  placeholder: string = 'Do anything...';

  constructor() {
    super();
  }

  firstUpdated() {
    this.focus();
  }

  focus() {
    const input = this.shadowRoot?.querySelector('un-input');
    if (input) {
      (input as any).focus();
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.disabled) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.value && this.value.trim()) {
        this.handleSubmit();
      }
    }
  }

  private handleSubmit() {
    if (this.disabled || !this.value || !this.value.trim()) return;

    this.dispatchEvent(new CommandSubmitEvent(this.value));
    this.value = '';
  }

  private handleInput(e: CustomEvent) {
    if (e.detail && e.detail.value !== undefined) {
      this.value = e.detail.value;
    }
  }

  render() {
    return html`
      <div class="command-input-wrapper">
        <un-input
          .value=${this.value || ''}
          variant="ghost"
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          @keydown=${this.handleKeyDown}
          @input=${this.handleInput}
        ></un-input>
        <un-button
          class="submit-button"
          size="small"
          type="ghost"
          icon="enter"
          @click=${this.handleSubmit}
        ></un-button>
      </div>
    `;
  }

  static styles = css`
    :host {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .command-input-wrapper {
      outline: 1px solid var(--color-neutral-300);
      width: 100%;
      max-width: 72ch;
      position: relative;
      background-color: color-mix(
        in srgb,
        var(--color-bg-container) 100%,
        transparent 35%
      );
      backdrop-filter: blur(16px);
      border-radius: var(--rounded);
      /* border-top: 1px solid var(--color-neutral-0); */
    }

    .command-input-wrapper:focus-within {
      outline-color: var(--color-action-800);
      background: var(--color-neutral-0);
    }

    un-input {
      width: 100%;
      margin: 3px;
    }

    un-input::part(input) {
      outline: none;
    }

    .submit-button {
      position: absolute;
      right: 6px;
      top: 6px;
    }

    .submit-button::part(button) {
      width: 18px;
      height: 18px;
      outline-width: 1px;
      border-radius: var(--rounded);
    }
  `;
}

customElements.define('command-input', CommandInputElement);
