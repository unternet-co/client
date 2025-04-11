import { LitElement, html, css } from 'lit';
import { InteractionInput } from '../../ai/interactions';
import '../common/input';
import '../common/button';

export class CommandSubmitEvent extends CustomEvent<{
  input: InteractionInput;
}> {
  constructor(value: string) {
    super('submit', {
      detail: { input: { text: value } },
      bubbles: true,
      composed: true,
    });
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
  placeholder: string = 'Search or type a command...';

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
          size="large"
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
      width: 100%;
      max-width: 560px;
      position: relative;
      background-color: color-mix(
        in srgb,
        var(--color-bg-container) 100%,
        transparent 25%
      );
      backdrop-filter: blur(16px);
      border-radius: var(--rounded-lg);
      border-top: 1px solid var(--color-neutral-0);
    }

    un-input {
      width: 100%;
    }

    .submit-button {
      position: absolute;
      right: var(--space-2);
      top: 50%;
      transform: translateY(-50%);
    }
  `;
}

customElements.define('command-input', CommandInputElement);
