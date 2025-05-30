import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../icons/icon';
import './input.css';
import './button';

export type InputSize = 'small' | 'medium' | 'large';
export type InputVariant = 'default' | 'ghost' | 'flat';
export type IconPosition = 'start' | 'end';

export class ChangeEvent extends Event {
  value: any;
  constructor(value: any) {
    super('change');
    this.value = value;
  }
}

export class InputEvent extends Event {
  value: any;
  constructor(value: any) {
    super('input');
    this.value = value;
  }
}

const ATTRS_TO_UPDATE = new Set([
  'value',
  'type',
  'placeholder',
  'disabled',
  'readonly',
  'required',
  'minlength',
  'maxlength',
  'min',
  'max',
  'step',
  'pattern',
  'name',
  'autocomplete',
  'size',
  'variant',
  'loading',
  'icon',
  'icon-position',
]);

export class InputElement extends HTMLElement {
  #input!: HTMLInputElement;
  #wrapper!: HTMLDivElement;
  static get observedAttributes() {
    return Array.from(ATTRS_TO_UPDATE);
  }

  connectedCallback() {
    if (!this.#wrapper) this.#createInput();
    this.#render();
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    _new: string | null
  ) {
    this.#render();
    if (name === 'value' && this.#input) {
      this.#input.value = _new ?? '';
    }
  }

  #handleInput = (e: Event) => {
    e.stopPropagation();
    this.setAttribute('value', this.#input.value);
    this.dispatchEvent(new InputEvent(this.#input.value));
  };

  #handleChange = (e: Event) => {
    e.stopPropagation();
    this.setAttribute('value', this.#input.value);
    this.dispatchEvent(new ChangeEvent(this.#input.value));
  };

  #createInput() {
    this.#wrapper = document.createElement('div');
    this.#wrapper.className = 'input-wrapper';
    this.appendChild(this.#wrapper);
  }

  #handleClear = (e: Event) => {
    this.#input.value = '';
    this.setAttribute('value', '');
    this.dispatchEvent(new ChangeEvent(''));
    this.#input.focus();
    this.#render();
  };

  get value() {
    return this.#input?.value ?? this.getAttribute('value') ?? '';
  }
  set value(val: string | undefined) {
    if (!val) return;
    this.setAttribute('value', val);
    if (this.#input) this.#input.value = val;
  }

  get validity(): ValidityState | undefined {
    return this.#input?.validity;
  }
  checkValidity(): boolean {
    return this.#input ? this.#input.checkValidity() : false;
  }

  #render() {
    if (!this.#wrapper) return;

    const icon = this.getAttribute('icon');
    const iconPosition = this.getAttribute('icon-position') ?? 'end';
    const loading = this.hasAttribute('loading');
    const size = this.getAttribute('size') ?? 'medium';
    const variant = this.getAttribute('variant') ?? 'default';
    const showClearButton =
      this.hasAttribute('clearable') && this.value && !this.#input?.disabled;

    const inputClass = [
      'input',
      size !== 'medium' ? size : '',
      variant !== 'default' ? variant : '',
      loading ? 'loading' : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (icon || loading) {
      this.#wrapper.setAttribute('data-icon', iconPosition);
    } else {
      this.#wrapper.removeAttribute('data-icon');
    }

    const showIcon = !!icon || loading;
    const iconName = loading ? 'loading' : icon;
    const iconSpin = !!loading;

    render(
      html`
        ${showIcon
          ? html`
              <un-icon
                class="input-icon"
                name=${iconName}
                size=${size}
                ?spin=${iconSpin}
              ></un-icon>
            `
          : ''}
        <input
          class=${inputClass}
          type=${this.getAttribute('type') ?? 'text'}
          .value=${this.value}
          placeholder=${ifDefined(this.getAttribute('placeholder'))}
          ?disabled=${this.hasAttribute('disabled') || loading}
          ?readonly=${this.hasAttribute('readonly')}
          ?required=${this.hasAttribute('required')}
          autocomplete=${ifDefined(this.getAttribute('autocomplete'))}
          minlength=${ifDefined(this.getAttribute('minlength'))}
          maxlength=${ifDefined(this.getAttribute('maxlength'))}
          min=${ifDefined(this.getAttribute('min'))}
          max=${ifDefined(this.getAttribute('max'))}
          step=${ifDefined(this.getAttribute('step'))}
          pattern=${ifDefined(this.getAttribute('pattern'))}
          name=${ifDefined(this.getAttribute('name'))}
          aria-busy=${loading ? 'true' : 'false'}
          @input=${this.#handleInput}
          @change=${this.#handleChange}
        />
        ${showClearButton
          ? html`
              <un-button
                class="clear-button"
                variant="ghost"
                size=${size}
                icon="close"
                aria-label="Clear search"
                @click=${this.#handleClear}
              ></un-button>
            `
          : ''}
      `,
      this.#wrapper
    );
    this.#input = this.#wrapper.querySelector('input')!;
  }
}

customElements.define('un-input', InputElement);
