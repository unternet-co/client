import { css } from 'lit';
import '../icons/icon';

export class CheckboxElement extends HTMLElement {
  private input: HTMLInputElement;
  private label: HTMLLabelElement;

  static get styles() {
    return css`
      .checkbox-wrapper {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .checkbox-wrapper:has(input:disabled) {
        cursor: not-allowed;
        opacity: 0.6;
      }

      input[type='checkbox'] {
        appearance: none;
        margin: 0;
        width: 18px;
        height: 18px;
        border: 1px solid var(--color-border-strong);
        border-radius: var(--rounded-sm);
        background-color: var(--color-bg-input);
        display: grid;
        place-content: center;
      }

      input[type='checkbox']:checked {
        background-color: var(--color-action-800);
        border-color: var(--color-action-800);
      }

      input[type='checkbox']:checked::before {
        content: '';
        width: 4px;
        height: 9px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-bottom: 2px;
      }

      input[type='checkbox']:disabled {
        cursor: not-allowed;
      }

      input[type='checkbox']:focus {
        outline: 2px solid var(--color-outline);
      }
    `;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.label = document.createElement('label');
    this.label.className = 'checkbox-wrapper';

    this.input = document.createElement('input');
    this.input.type = 'checkbox';
    this.input.addEventListener('change', this.handleChange.bind(this));

    this.label.appendChild(this.input);
  }

  static get observedAttributes() {
    return ['disabled', 'label', 'checked'];
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = CheckboxElement.styles.toString();
    this.shadowRoot!.appendChild(style);

    const slot = document.createElement('slot');
    slot.textContent = this.getAttribute('label') || '';
    this.label.appendChild(slot);

    this.shadowRoot!.appendChild(this.label);
    this.updateCheckbox();
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    if (!this.input) return;

    switch (name) {
      case 'disabled':
        this.input.disabled = newValue !== null;
        break;
      case 'checked':
        this.input.checked = newValue !== null;
        break;
      case 'label':
        const slot = this.shadowRoot?.querySelector('slot');
        if (slot) slot.textContent = newValue || '';
        break;
    }
  }

  get checked(): boolean {
    return this.hasAttribute('checked');
  }

  set checked(value: boolean) {
    if (value) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
  }

  private handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;
  }

  private updateCheckbox() {
    this.input.checked = this.checked;
    this.input.disabled = this.hasAttribute('disabled');
  }
}

customElements.define('un-checkbox', CheckboxElement);
