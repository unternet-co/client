import { css } from 'lit';

export class TextAreaElement extends HTMLElement {
  private textarea: HTMLTextAreaElement;

  static get styles() {
    return css`
      :host {
        display: block;
      }

      textarea {
        width: 100%;
        min-height: 100px;
        padding: var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--rounded-sm);
        background-color: var(--color-bg-input);
        color: var(--color-text);
        font-family: inherit;
        font-size: inherit;
        line-height: 1.5;
        resize: vertical;
      }

      textarea:focus {
        outline: 2px solid var(--color-outline);
        outline-offset: -1px;
      }

      textarea:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      textarea::placeholder {
        color: var(--color-text-subtle);
      }
    `;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.textarea = document.createElement('textarea');
    this.textarea.addEventListener('input', this.handleInput.bind(this));
    this.textarea.addEventListener('change', this.handleChange.bind(this));
  }

  static get observedAttributes() {
    return [
      'value',
      'placeholder',
      'disabled',
      'readonly',
      'required',
      'minlength',
      'maxlength',
      'rows',
    ];
  }

  connectedCallback() {
    // Add styles
    const style = document.createElement('style');
    style.textContent = TextAreaElement.styles.toString();
    this.shadowRoot!.appendChild(style);

    this.shadowRoot!.appendChild(this.textarea);
    this.updateTextArea();
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    if (!this.textarea) return;

    switch (name) {
      case 'value':
        this.textarea.value = newValue || '';
        break;
      case 'placeholder':
        this.textarea.placeholder = newValue || '';
        break;
      case 'disabled':
        this.textarea.disabled = newValue !== null;
        break;
      case 'readonly':
        this.textarea.readOnly = newValue !== null;
        break;
      case 'required':
        this.textarea.required = newValue !== null;
        break;
      case 'minlength':
        this.textarea.minLength = newValue ? parseInt(newValue, 10) : -1;
        break;
      case 'maxlength':
        this.textarea.maxLength = newValue ? parseInt(newValue, 10) : -1;
        break;
      case 'rows':
        this.textarea.rows = newValue ? parseInt(newValue, 10) : 3;
        break;
    }
  }

  get value(): string {
    return this.getAttribute('value') || '';
  }

  set value(newValue: string) {
    this.setAttribute('value', newValue);
  }

  private handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;

    this.dispatchEvent(
      new CustomEvent('input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  private handleChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;

    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  private updateTextArea() {
    this.textarea.value = this.value;
    this.textarea.placeholder = this.getAttribute('placeholder') || '';
    this.textarea.disabled = this.hasAttribute('disabled');
    this.textarea.readOnly = this.hasAttribute('readonly');
    this.textarea.required = this.hasAttribute('required');

    const minLength = this.getAttribute('minlength');
    if (minLength !== null) {
      this.textarea.minLength = parseInt(minLength, 10);
    }

    const maxLength = this.getAttribute('maxlength');
    if (maxLength !== null) {
      this.textarea.maxLength = parseInt(maxLength, 10);
    }

    this.textarea.rows = this.hasAttribute('rows')
      ? parseInt(this.getAttribute('rows')!, 10)
      : 3;
  }
}

customElements.define('un-textarea', TextAreaElement);
