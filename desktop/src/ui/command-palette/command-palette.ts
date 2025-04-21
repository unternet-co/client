import { LitElement, html, css } from 'lit';
import { InteractionInput } from '../../ai/interactions';
import '../common/input';
import '../common/button';
import './palette-menu';

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
    isMenuOpen: { type: Boolean, reflect: true },
  };

  value: string = '';
  disabled: boolean = false;
  placeholder: string = 'Search or type a command...';
  isMenuOpen: boolean = false;

  constructor() {
    super();
  }

  firstUpdated() {
    this.focus();
  }

  focus() {
    const inputDiv = this.shadowRoot?.querySelector(
      '.palette-input'
    ) as HTMLDivElement;
    inputDiv?.focus();
  }

  private handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.isMenuOpen = false;
        this.render();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.value && this.value.trim()) {
          this.handleSubmit();
        }
        break;
      case '@':
        e.preventDefault();
        this.isMenuOpen = true;
        this.render();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
      default:
        break;
    }
  }

  private handleSubmit() {
    if (this.disabled || !this.value || !this.value.trim()) return;

    this.dispatchEvent(new CommandSubmitEvent(this.value));
    this.value = '';
  }

  private handleInput(e: InputEvent) {
    const target = e.target as HTMLDivElement;
    this.value = target.innerText;
    this.highlightToolMentions();
  }

  private highlightToolMentions() {
    const inputDiv = this.shadowRoot?.querySelector(
      '.palette-input'
    ) as HTMLDivElement;

    const styledHTML = inputDiv.innerText.replace(/@[\w]+/g, (match) => {
      return `<span class="highlight">${match} </span>`;
    });
    inputDiv.innerHTML = styledHTML;

    this.setCursorToEnd(inputDiv);
  }

  private handleToolSelection(event: CustomEvent) {
    const inputDiv = this.shadowRoot?.querySelector(
      '.palette-input'
    ) as HTMLDivElement;

    const item = event.detail.item;

    const span = document.createElement('span');
    span.className = 'highlight';
    span.textContent = `@${item}`;

    const space = document.createTextNode(' ');

    inputDiv.appendChild(span);
    inputDiv.appendChild(space);

    this.isMenuOpen = false;

    this.highlightToolMentions();
    this.focus();
  }

  private setCursorToEnd(inputDiv: HTMLDivElement) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(inputDiv);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  render() {
    return html`
      <div class="command-input-wrapper">
        ${this.isMenuOpen
          ? html`
              <palette-menu
                .options=${{
                  Fruits: ['Apple', 'Banana'],
                  Vegetables: ['Carrot', 'Spinach'],
                }}
                @selected=${this.handleToolSelection}
                placeholder="Choose an option"
              ></palette-menu>
            `
          : null}
        <div
          class="palette-input"
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          part="input"
          contenteditable
          @keydown=${this.handleKeyDown}
          @input=${this.handleInput}
        ></div>
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

    .highlight {
      color: var(--color-action-800);
      font-weight: bold;
      text-transform: lowercase;
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

    .palette-input {
      width: 100%;
      margin: 3px;
    }

    .palette-input::part(input):focus-visible {
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

customElements.define('command-palette', CommandInputElement);
