import { html, css, render } from 'lit';
import { Kernel } from '../../kernel/kernel';
import '../common/elements/input';
import '../common/elements/button';
import { attachStyles } from '../../common/utils';
import { Disposable } from '../../common/disposable';
import { dependencies } from '../../common/dependencies';

export class CommandInputElement extends HTMLElement {
  #defaultPlaceholder = 'What would you like to do?';
  #inputListener = new Disposable();
  #kernel = dependencies.resolve<Kernel>('Kernel');

  static get observedAttributes() {
    return ['value', 'disabled', 'placeholder', 'focused', 'for'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    attachStyles(this.shadowRoot, this.styles.cssText);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    this.render();
    if (name === 'focused' && newValue !== null) {
      this.focusInput();
    }
  }

  set value(newValue: string) {
    this.setAttribute('value', newValue);
  }
  set for(newValue: string) {
    this.setAttribute('for', newValue);
  }
  set disabled(newValue: boolean) {
    this.setAttribute('disabled', newValue ? '' : null);
  }
  set placeholder(newValue: string) {
    this.setAttribute('placeholder', newValue);
  }

  focus() {
    this.setAttribute('focused', '');
  }

  private focusInput() {
    const input = this.shadowRoot.querySelector('.input') as HTMLDivElement;
    input.focus();
    this.#inputListener = Disposable.createEventListener(
      input,
      'blur',
      this.blurInput.bind(this)
    );
  }

  private blurInput() {
    const input = this.shadowRoot.querySelector('.input') as HTMLDivElement;
    input.blur();
    this.removeAttribute('focused');
    this.#inputListener.dispose();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.disabled) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSubmit();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      this.blurInput();
    }
  }

  private handleTargetClick(e: MouseEvent) {
    e.preventDefault();
    this.focus();
  }

  private handleSubmit() {
    if (this.disabled) return;
    const input = this.shadowRoot.querySelector('.input') as HTMLDivElement;
    this.#kernel.handleInput({ text: input.innerText });
    input.innerText = '';
  }

  private handleInput(e: CustomEvent) {
    if (e.detail && e.detail.value !== undefined) {
      this.value = e.detail.value;
    }
  }

  render() {
    const placeholder =
      this.getAttribute('placeholder') || this.#defaultPlaceholder;
    const disabled = this.hasAttribute('disabled');
    const value = this.getAttribute('value') || '';
    const focused = this.hasAttribute('focused');

    const containerTemplate = html`
      <div class="container">
        ${focused
          ? html`
              <div class="input-container">
                <div
                  class="input"
                  .value=${value || ''}
                  ?disabled=${disabled}
                  placeholder=${placeholder}
                  @keydown=${this.handleKeyDown.bind(this)}
                  @input=${this.handleInput.bind(this)}
                  contenteditable
                ></div>
              </div>
            `
          : html`
              <div
                class="target"
                @mousedown=${this.handleTargetClick.bind(this)}
              >
                ${placeholder}
              </div>
            `}
      </div>
    `;

    render(containerTemplate, this.shadowRoot);
  }

  styles = css`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .container {
      width: 100%;
      position: relative;
      min-height: calc(1.5em + 2 * var(--space-2));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .target {
      width: var(--command-target-width, 46ch);
      max-width: 100%;
      margin: 0 auto;
      background: var(--color-input-bg);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--rounded);
      padding: 3px var(--space-4);
      text-align: center;
      font-size: var(--text-base);
      transition: opacity 0.2s ease;
    }

    .target.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .input-container {
      position: absolute;
      width: 100%;
      bottom: 0;
      left: 0;
      right: 0;
      margin: 0 auto;
      border-radius: var(--rounded);
      outline: 1px solid var(--color-border);
      outline-color: var(--color-action-800);
      background: var(--color-input-bg);
    }

    .input {
      outline: none;
      padding: var(--space-2) var(--space-4);
      max-height: calc(1.5em * 3);
      overflow-y: auto;
      line-height: 1.5em;
    }

    .submit-button {
      position: absolute;
      right: 4px;
      top: 4px;
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
