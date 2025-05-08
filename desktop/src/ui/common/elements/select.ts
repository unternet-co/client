import { html, css, render } from 'lit';
import './icon';
import { SelectNativeMenu } from './select-native-menu';
import { Disposable, DisposableGroup } from '../../../common/disposable';
import { attachStyles } from '../../../common/utils/dom';

export type SelectSize = 'small' | 'medium' | 'large';
export type SelectVariant = 'default' | 'ghost' | 'flat';
export type IconPosition = 'start' | 'end';

export class SelectElement extends HTMLElement {
  #mutationObserver?: MutationObserver;
  #selectNativeMenu?: SelectNativeMenu;
  #disposables = new DisposableGroup();

  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  connectedCallback() {
    this.#mutationObserver = new MutationObserver(() =>
      render(this.#template, this.shadowRoot!)
    );
    this.#mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    this.#disposables.add(
      new Disposable(() => this.#mutationObserver?.disconnect())
    );
    attachStyles(this.shadowRoot!, SelectElement.styles.toString());
    render(this.#template, this.shadowRoot!);
    if (this.#useNativeMenu) {
      this.#registerNativeMenuEvents();
    }
  }

  disconnectedCallback() {
    this.#disposables.dispose();
    if (this.#selectNativeMenu && this.#useNativeMenu) {
      this.#selectNativeMenu.unregisterEvents(this);
    }
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (name === 'value' && oldValue !== newValue) {
      render(this.#template, this.shadowRoot!);
    }
  }

  #registerNativeMenuEvents() {
    if (!this.#selectNativeMenu) {
      this.#selectNativeMenu = new SelectNativeMenu();
    }
    this.#selectNativeMenu.registerEvents(
      this,
      () => {
        const opts = this.options;
        return opts;
      },
      () => this.getAttribute('value'),
      (value: string) => this.setAttribute('value', value)
    );
  }

  get #useNativeMenu() {
    return (
      this.hasAttribute('usenativemenu') && window.electronAPI?.showNativeMenu
    );
  }

  set options(val: any[]) {
    (this as any)._options = val;
    render(this.#template, this.shadowRoot!);
  }
  get options(): any[] {
    return (this as any)._options;
  }

  set value(val: string) {
    if (val !== this.getAttribute('value')) {
      this.setAttribute('value', val);
    }
  }
  get value(): string {
    return this.getAttribute('value') ?? '';
  }

  get #wrapperClasses() {
    const size = this.getAttribute('size');
    const icon = this.getAttribute('icon');
    const iconPosition = this.getAttribute('icon-position');
    return [
      'select-wrapper',
      size && size !== 'medium' ? `select-wrapper--${size}` : '',
      icon ? `has-icon icon-${iconPosition === 'start' ? 'start' : 'end'}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  get #selectClasses() {
    const size = this.getAttribute('size');
    const variant = this.getAttribute('variant');
    const loading = this.hasAttribute('loading');
    return [
      'select',
      size && size !== 'medium' ? `select--${size}` : '',
      variant && variant !== 'default' ? `select--${variant}` : '',
      loading ? 'loading' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  #valueIcon(position: IconPosition) {
    const icon = this.getAttribute('icon');
    const iconPosition = this.getAttribute('icon-position');
    const size = this.getAttribute('size') || 'medium';
    if (!icon || iconPosition !== position) return null;
    return html`<un-icon
      class="value-icon value-icon-${position}"
      name=${icon}
      size=${size}
    ></un-icon>`;
  }

  #handleIcon() {
    const loading = this.hasAttribute('loading');
    const size = this.getAttribute('size') || 'medium';
    return loading
      ? html`<un-icon
          class="dropdown-icon"
          name="loading"
          spin
          size=${size}
        ></un-icon>`
      : html`<un-icon class="dropdown-icon" name="dropdown"></un-icon>`;
  }

  #handleChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.setAttribute('value', select.value);
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: select.value },
        bubbles: true,
        composed: true,
      })
    );
  };

  get #template() {
    return this.#useNativeMenu ? this.#nativeTemplate : this.#standardTemplate;
  }

  get #nativeTemplate() {
    const value = this.getAttribute('value');
    const disabled =
      this.hasAttribute('disabled') || this.hasAttribute('loading');
    const loading = this.hasAttribute('loading');
    return html`
      <div class="${this.#wrapperClasses}">
        ${this.#valueIcon('start')}
        <button
          class=${this.#selectClasses}
          part="select"
          type="button"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-disabled="${disabled}"
          aria-busy="${loading ? 'true' : 'false'}"
          ?disabled=${disabled}
          tabindex="0"
        >
          ${SelectNativeMenu.findLabelForValue(this.options, value) ||
          this.getAttribute('placeholder') ||
          ''}
        </button>
        ${this.#valueIcon('end')} ${this.#handleIcon()}
      </div>
    `;
  }

  get #standardTemplate() {
    const value = this.getAttribute('value');
    const disabled =
      this.hasAttribute('disabled') || this.hasAttribute('loading');
    const required = this.hasAttribute('required');
    const name = this.getAttribute('name') ?? '';
    const loading = this.hasAttribute('loading');
    return html`
      <div class="${this.#wrapperClasses}">
        ${this.#valueIcon('start')}
        <select
          class=${this.#selectClasses}
          part="select"
          .value=${value}
          ?disabled=${disabled}
          ?required=${required}
          name=${name}
          aria-busy=${loading ? 'true' : 'false'}
          @change=${this.#handleChange}
        >
          <option value="" disabled ?selected=${!value}>
            ${this.getAttribute('placeholder')}
          </option>
          ${Array.from(this.children)
            .filter(
              (node) => node.tagName === 'OPTION' || node.tagName === 'OPTGROUP'
            )
            .map((node) => html`${node.cloneNode(true)}`)}
        </select>
        ${this.#valueIcon('end')} ${this.#handleIcon()}
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        --select-height: 24px;
      }
      .select-wrapper {
        position: relative;
        width: 100%;
      }
      .select {
        width: 100%;
        height: var(--select-height);
        padding: 0 var(--space-8) 0 var(--space-4);
        border-radius: var(--rounded);
        background-color: var(--input-bg-color);
        color: var(--input-text-color);
        font-family: inherit;
        font-size: inherit;
        /* line-height: var(--select-height); */
        appearance: none;
        box-sizing: border-box;
        border: 1px solid var(--input-border-color);
        border-top-color: color-mix(
          in srgb,
          var(--input-border-color) 100%,
          transparent 50%
        );
        box-shadow: var(--button-shadows);

        &:focus {
          outline: var(--outline);
          outline-offset: var(--outline-offset-inputs);
        }
      }

      /* --- Shared variant styles --- */
      .select--ghost,
      .select--flat {
        border-color: transparent;
        box-shadow: none;
      }
      .select--ghost {
        background-color: transparent;
        padding-right: var(--space-7);
      }
      .select--flat {
        background-color: var(--input-bg-color-flat);
      }

      /* --- Disabled & loading states --- */
      .select:disabled,
      .select--loading {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      .select option:disabled {
        color: var(--input-placeholder-color);
      }

      /* --- Size variants --- */
      .select--small {
        --select-height: 18px;
        font-size: var(--text-sm);
      }
      .select--large {
        --select-height: 28px;
      }

      /* --- Dropdown icon styles --- */
      un-icon.dropdown-icon {
        position: absolute;
        right: 1px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--color-text-muted);
        border-left: 1px solid
          color-mix(in srgb, var(--input-border-color) 100%, transparent 50%);
        height: 100%;
        width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .select--flat + .dropdown-icon {
        border-left-color: transparent;
      }
      .select--ghost + .dropdown-icon {
        border: unset;
        border-left-color: transparent;
        border-top-color: transparent;
        box-shadow: none;
        right: var(--space-2);
      }

      un-icon.value-icon {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--input-text-color);
        z-index: 1;

        &.value-icon-start {
          left: var(--space-4);
        }
        &.value-icon-end {
          right: calc(20px + var(--space-4));
        }
      }
      .has-icon.icon-start select {
        padding-left: calc(var(--space-4) + 16px);
      }
      .has-icon.icon-end select {
        padding-right: calc(var(--space-8) + 16px);
      }
      select:disabled + un-icon {
        opacity: 0.5;
      }
    `;
  }
}

customElements.define('un-select', SelectElement);
