import { css } from 'lit';

export class RadioElement extends HTMLElement {
  private input: HTMLInputElement;
  private label: HTMLLabelElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.label = document.createElement('label');
    this.label.className = 'radio-wrapper';

    this.input = document.createElement('input');
    this.input.type = 'radio';
    this.input.addEventListener('change', this.handleChange.bind(this));

    this.label.appendChild(this.input);
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = RadioElement.styles.toString();
    this.shadowRoot!.appendChild(style);

    const slot = document.createElement('slot');
    slot.textContent = this.getAttribute('label') || '';
    this.label.appendChild(slot);

    this.shadowRoot!.appendChild(this.label);
    this.updateRadio();
  }

  static get observedAttributes() {
    return ['disabled', 'label', 'name', 'value', 'checked'];
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
      case 'name':
        this.input.name = newValue || '';
        break;
      case 'value':
        this.input.value = newValue || '';
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
    this.input.checked = value;
  }

  private get isDisabled(): boolean {
    return this.hasAttribute('disabled');
  }

  private get value(): string {
    return this.getAttribute('value') || '';
  }

  private handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;
  }

  private updateRadio() {
    this.input.disabled = this.isDisabled;
    this.input.checked = this.checked;
    this.input.name = this.getAttribute('name') || '';
    this.input.value = this.value;
  }

  static get styles() {
    return css`
      .radio-wrapper {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .radio-wrapper:has(input:disabled) {
        cursor: not-allowed;
        opacity: 0.6;
      }

      input[type='radio'] {
        appearance: none;
        margin: 0;
        width: 18px;
        height: 18px;
        border: 1px solid var(--color-border-strong);
        border-radius: 50%;
        background-color: var(--color-bg-input);
        display: grid;
        place-content: center;
      }

      input[type='radio']::before {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 50%;
        transform: scale(0);
        transition: transform 0.2s;
        background-color: var(--color-action-800);
      }

      input[type='radio']:checked::before {
        transform: scale(1);
      }

      input[type='radio']:disabled {
        cursor: not-allowed;
      }

      input[type='radio']:focus {
        outline: 2px solid var(--color-outline);
      }
    `;
  }
}

export class RadioGroupElement extends HTMLElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
    `;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Add styles
    const style = document.createElement('style');
    style.textContent = RadioGroupElement.styles.toString();
    this.shadowRoot!.appendChild(style);

    // Add slot for radio buttons
    const slot = document.createElement('slot');
    this.shadowRoot!.appendChild(slot);

    this.addEventListener('change', this.handleRadioChange.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.handleRadioChange.bind(this));
  }

  private handleRadioChange(e: Event) {
    const target = e.target as RadioElement;
    if (!(target instanceof RadioElement)) return;

    // Uncheck all other radios in the group
    const radios = Array.from(
      this.querySelectorAll('un-radio')
    ) as RadioElement[];
    radios.forEach((radio) => {
      if (radio !== target) {
        radio.checked = false;
      }
    });
  }
}

customElements.define('un-radio', RadioElement);
customElements.define('un-radio-group', RadioGroupElement);
