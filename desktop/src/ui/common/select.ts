import { html, css, render } from 'lit';
import { NativeMenuOption, NativeMenu } from './menu/native-menu';
import { Disposable, DisposableGroup } from '../../common/disposable';
import { attachStyles } from '../../common/utils/dom';
import classNames from 'classnames';
import './icons/icon';

export type SelectSize = 'small' | 'medium' | 'large';
export type SelectVariant = 'default' | 'ghost' | 'flat';
export type IconPosition = 'start' | 'end';

export class ChangeEvent extends Event {
  value: any;

  constructor(value: any) {
    super('change');
    this.value = value;
  }
}

export class SelectElement extends HTMLElement {
  #nativeMenu?: NativeMenu;
  #options: NativeMenuOption[];
  #disposables = new DisposableGroup();

  static get observedAttributes() {
    return ['value', 'native', 'loading'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  connectedCallback() {
    attachStyles(this.shadowRoot, this.styles.toString());

    const observer = new MutationObserver(() => {
      this.#render();
    });

    observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false,
    });

    this.#disposables.add(new Disposable(() => observer.disconnect()));

    if (this.native) this.#createNativeMenu();
    this.#render();
  }

  disconnectedCallback() {
    this.#disposables.dispose();
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (name === 'value' && oldValue !== newValue) {
      this.#render();
    } else if (name === 'native' && newValue !== null) {
      this.#createNativeMenu();
    } else if (name === 'native' && newValue === null) {
      this.#removeNativeMenu();
    } else if (name === 'loading' && oldValue !== newValue) {
      this.#render();
    }
  }

  set value(val: string) {
    this.setAttribute('value', val);
    this.#render();
  }
  get value(): string {
    return this.getAttribute('value') ?? '';
  }

  set options(val: NativeMenuOption[]) {
    this.#options = val;
    this.#render();
  }
  get options(): any[] {
    return this.#options;
  }

  set loading(val: boolean) {
    if (val) {
      this.setAttribute('loading', '');
    } else {
      this.removeAttribute('loading');
    }
    this.#render();
  }
  get loading(): boolean {
    return this.hasAttribute('loading');
  }

  #createNativeMenu() {
    if (!this.#nativeMenu) {
      this.#nativeMenu = new NativeMenu();
    }

    const target = this.shadowRoot.querySelector('button');
    if (!target) return; // Guard: don't register if button not present

    this.#nativeMenu.registerEvents(
      target,
      () => this.options,
      () => this.value,
      this.#updateValue.bind(this)
    );

    this.#disposables.add(new Disposable(() => this.#removeNativeMenu()));
  }

  #removeNativeMenu() {
    if (this.#nativeMenu) {
      this.#nativeMenu.unregisterEvents(this);
    }
  }

  get native() {
    return this.hasAttribute('native') && window.electronAPI?.showNativeMenu;
  }

  #handleChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.#updateValue(select.value);
  };

  #updateValue(value: string) {
    console.log('DEBUG', value);
    this.setAttribute('value', value);
    this.dispatchEvent(new ChangeEvent(value));
  }

  /* Rendering */

  #render() {
    if (this.native) {
      render(this.#selectNativeTemplate, this.shadowRoot);
    } else {
      render(this.#selectWebTemplate, this.shadowRoot);
    }
  }

  get #wrapperClasses() {
    const size = this.getAttribute('size');
    const icon = this.getAttribute('icon');
    const iconPosition = this.getAttribute('icon-position');

    const selectWrapperClass = `select-wrapper--${size}`;
    const iconClass = `icon-${iconPosition === 'start' ? 'start' : 'end'}`;

    return classNames({
      'select-wrapper': true,
      [selectWrapperClass]: size && size !== 'medium',
      'has-icon': icon,
      [iconClass]: icon,
    });
  }

  get #selectClasses() {
    const size = this.getAttribute('size');
    const variant = this.getAttribute('variant');
    const loading = this.hasAttribute('loading');

    const sizeClass = `select--${size}`;
    const variantClass = `select--${variant}`;

    return classNames({
      select: true,
      [sizeClass]: size && size !== 'medium',
      [variantClass]: variant && variant !== 'default',
      loading: loading,
    });
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

  get #handleIcon() {
    const loading = this.hasAttribute('loading');
    const size = this.getAttribute('size') || 'medium';

    if (loading) {
      return html`<un-icon
        class="dropdown-icon"
        name="loading"
        spin
        size=${size}
      ></un-icon>`;
    } else {
      return html`<un-icon class="dropdown-icon" name="dropdown"></un-icon>`;
    }
  }

  get #optionsTemplate() {
    const value = this.getAttribute('value');

    return Array.from(this.children)
      .filter((node) => ['OPTION', 'OPTGROUP'].includes(node.tagName))
      .map((node) => {
        const cloned = node.cloneNode(true) as Element;

        if (cloned.tagName === 'OPTION') {
          cloned.toggleAttribute(
            'selected',
            cloned.getAttribute('value') === value
          );
        } else if (cloned.tagName === 'OPTGROUP') {
          Array.from(cloned.children).forEach((child) => {
            if (child.tagName === 'OPTION') {
              child.toggleAttribute(
                'selected',
                child.getAttribute('value') === value
              );
            }
          });
        }

        return cloned;
      });
  }

  get #selectNativeTemplate() {
    const value = this.getAttribute('value');
    const disabled =
      this.hasAttribute('disabled') || this.hasAttribute('loading');
    const loading = this.hasAttribute('loading');

    let label;
    if (this.options && Array.isArray(this.options)) {
      label = NativeMenu.findLabelForValue(this.options, value);
    }

    label = label || this.getAttribute('placeholder') || value;

    return html`
      <div class="${this.#wrapperClasses}" id="select">
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
          ${label}
        </button>
        ${this.#valueIcon('end')} ${this.#handleIcon}
      </div>
    `;
  }

  get #selectWebTemplate() {
    const value = this.getAttribute('value');
    const disabled =
      this.hasAttribute('disabled') || this.hasAttribute('loading');
    const required = this.hasAttribute('required');
    const name = this.getAttribute('name');
    const loading = this.hasAttribute('loading');
    const placeholder = this.getAttribute('placeholder');
    const options = this.#optionsTemplate;

    // Create placeholder option
    const placeholderTemplate = html`
      <option value="" disabled ?selected=${!value}>${placeholder}</option>
    `;

    return html`
      <div class="${this.#wrapperClasses}">
        ${this.#valueIcon('start')}
        <select
          class=${this.#selectClasses}
          part="select"
          .value=${value || ''}
          ?disabled=${disabled}
          ?required=${required}
          name=${name}
          aria-busy=${loading ? 'true' : 'false'}
          @change=${this.#handleChange}
        >
          ${placeholder ? placeholderTemplate : ''} ${options}
        </select>
        ${this.#valueIcon('end')} ${this.#handleIcon}
      </div>
    `;
  }

  get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        --select-height: 24px;
        --font-size: var(--text-md);
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

      /* --- Variants--- */

      .select--ghost,
      .select--flat {
        border-color: transparent;
        box-shadow: none;
      }

      .select--ghost {
        background-color: transparent;
        padding: 0;
        padding-right: var(--space-7);
        padding-left: var(--space-3);
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

      /* --- Sizes --- */

      .select--small {
        --select-height: 18px;
        font-size: var(--text-sm);
      }

      .select--large {
        --select-height: 28px;
      }

      /* --- Dropdown icon --- */

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

      /* Icons */

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
