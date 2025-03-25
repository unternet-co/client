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

  private static readonly STYLES = css`
    :host {
      width: 100%;
      display: flex;
      justify-content: center; 
    }

    input {
      width: 100%;
      max-width: 560px;
      text-align: center;
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
  `;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    attachStyles(this.shadow, CommandInputElement.STYLES.toString());
  }

  connectedCallback() {
    this.setupInput();
    this.attachEventListeners();
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
    if (e.key === 'Enter') {
      this.dispatchEvent(new CommandSubmitEvent(this.input.value));
      this.input.value = '';
    }
  }
  
  get value(): string {
    return this.input?.value ?? '';
  }

  disconnectedCallback() {
    this.disposables.dispose();
  }
}

customElements.define('command-input', CommandInputElement);
