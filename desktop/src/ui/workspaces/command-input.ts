import { css } from 'lit';
import { DisposableGroup } from '../../base/disposable';
import { attachStyles, appendEl, createEl } from '../../utils/dom';

export class CommandSubmitEvent extends Event {
  constructor(public readonly value: string) {
    super('submit');
    this.value = value;
  }
}

export class CommandInputElement extends HTMLElement {
  private input: HTMLInputElement;
  private shadow: ShadowRoot;
  private disposables = new DisposableGroup();
  private _disabled = false;

  private static readonly STYLES = css`
    :host {
      width: 100%;
      display: flex;
      justify-content: center; 
    }

    input {
      width: 100%;
      max-width: 560px;
      border: 1px solid var(--color-border);
      padding: 6px var(--space-4);
      background: var(--color-neutral-10);
      border-radius: var(--rounded);
      outline: none;
      transition: all 0.2s ease;
    }

    input:focus {
      text-align: left;
      background: var(--color-page);
      border: 1px solid var(--color-border);
    }

    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    attachStyles(this.shadow, CommandInputElement.STYLES.toString());
  }

  connectedCallback() {
    this.setupInput();
    this.attachEventListeners();
    
    // Check if the disabled attribute is set
    if (this.hasAttribute('disabled')) {
      this.disabled = true;
    }
  }

  private setupInput() {
    this.input = appendEl(this.shadow, createEl('input')) as HTMLInputElement;
    this.input.focus();
    this.input.placeholder = 'Search or type a command...';
  }

  private attachEventListeners() {
    this.disposables.attachListener(
      this.input,
      'keydown',
      this.handleKeyDown.bind(this)
    );
    
    this.disposables.attachListener(
      this.input,
      'input',
      () => this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
    );
    
    this.disposables.attachListener(
      this.input,
      'blur',
      () => this.dispatchEvent(new Event('blur', { bubbles: true, composed: true }))
    );
  }

  handleKeyDown(e: KeyboardEvent) {
    if (this.disabled) return;
    
    if (e.key === 'Enter') {
      this.dispatchEvent(new CommandSubmitEvent(this.input.value));
      this.input.value = '';
    }
  }
  
  get value(): string {
    return this.input?.value ?? '';
  }

  // Add support for the disabled property
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = value;
    if (this.input) {
      this.input.disabled = value;
    }
    
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  // Add support for observing the disabled attribute
  static get observedAttributes() {
    return ['disabled'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'disabled') {
      this.disabled = newValue !== null;
    }
  }

  disconnectedCallback() {
    this.disposables.dispose();
  }
}

customElements.define('command-input', CommandInputElement);
