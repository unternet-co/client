import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

export type TextAreaSize = 'small' | 'medium' | 'large';
export type TextAreaVariant = 'default' | 'ghost' | 'flat';

export class TextAreaElement extends LitElement {
  value: string = '';
  placeholder: string = '';
  disabled: boolean = false;
  readonly: boolean = false;
  required: boolean = false;
  minlength: number = -1;
  maxlength: number = -1;
  rows: number = 3;
  size: TextAreaSize = 'medium';
  variant: TextAreaVariant = 'default';

  static get properties() {
    return {
      value: { type: String },
      placeholder: { type: String },
      disabled: { type: Boolean },
      readonly: { type: Boolean },
      required: { type: Boolean },
      minlength: { type: Number },
      maxlength: { type: Number },
      rows: { type: Number },
      size: { type: String },
      variant: { type: String },
    };
  }

  constructor() {
    super();
    this.size = 'medium';
    this.variant = 'default';
  }

  private handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  focus() {
    const textarea = this.shadowRoot?.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  }

  blur() {
    const textarea = this.shadowRoot?.querySelector('textarea');
    if (textarea) {
      textarea.blur();
    }
  }

  select() {
    const textarea = this.shadowRoot?.querySelector('textarea');
    if (textarea) {
      textarea.select();
    }
  }

  render() {
    const textareaClasses = {
      textarea: true,
      [`textarea--${this.size}`]: this.size !== 'medium',
      [`textarea--${this.variant}`]: this.variant !== 'default',
    };

    return html`
      <div
        class="textarea-wrapper ${this.size !== 'medium'
          ? `textarea-wrapper--${this.size}`
          : ''}"
      >
        <textarea
          class=${classMap(textareaClasses)}
          .value=${this.value}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          minlength=${this.minlength > 0 ? this.minlength : ''}
          maxlength=${this.maxlength > 0 ? this.maxlength : ''}
          rows=${this.rows}
          @input=${this.handleInput}
          @change=${this.handleChange}
        ></textarea>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
      }

      .textarea-wrapper {
        position: relative;
        width: 100%;
      }

      .textarea {
        width: 100%;
        min-height: 100px;
        padding: var(--space-3);
        border: 1px solid var(--input-border-color);
        border-bottom-color: color-mix(
          in srgb,
          var(--input-border-color) 100%,
          transparent 75%
        );
        border-radius: var(--rounded);
        background-color: var(--input-bg-color);
        color: var(--input-text-color);
        font-family: inherit;
        font-size: inherit;
        line-height: 1.5;
        resize: vertical;
        box-sizing: border-box;
        box-shadow: inset 0 1px 1px 0px
          color-mix(in srgb, var(--color-grey-600) 15%, transparent 100%);
      }

      .textarea:focus {
        outline: var(--outline);
        outline-offset: var(--outline-offset-inputs);
      }

      .textarea:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .textarea::placeholder {
        color: var(--input-placeholder-color);
      }

      .textarea--small {
        min-height: 80px;
        font-size: var(--text-sm);
      }

      .textarea--large {
        min-height: 120px;
      }

      .textarea--ghost {
        border-color: transparent;
        background-color: transparent;
      }

      .textarea--flat {
        border-color: transparent;
        mix-blend-mode: multiply;
        background-color: var(--input-bg-color-flat);
      }
    `;
  }
}

customElements.define('un-textarea', TextAreaElement);
