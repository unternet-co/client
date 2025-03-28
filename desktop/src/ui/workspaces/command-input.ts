import { InteractionInput } from '../../models/interactions';
import { DisposableGroup } from '../../base/disposable';
import { attachStyles, appendEl, createEl } from '../../utils/dom';

export class CommandSubmitEvent extends Event {
  public input: InteractionInput;

  constructor(value: string) {
    super('submit');
    this.input = { text: value };
  }
}

export class CommandInputElement extends HTMLElement {
  private input = createEl<HTMLInputElement>('input');
  private shadow: ShadowRoot;
  private disposables = new DisposableGroup();
  private _disabled = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    attachStyles(this.shadow, this.styles);
  }

  connectedCallback() {
    this.input = appendEl(this.shadow, createEl('input')) as HTMLInputElement;
    this.input.focus();
    this.input.placeholder = 'Search or type a command...';
    this.attachEventListeners();

    if (this.hasAttribute('disabled')) {
      this._disabled = true;
    }
  }

  private attachEventListeners() {
    this.disposables.attachListener(
      this.input,
      'keydown',
      this.handleKeyDown.bind(this)
    );

    this.disposables.attachListener(this.input, 'input', (e: Event) => {
      e.stopPropagation();
      this.dispatchEvent(new Event('input'));
    });

    this.disposables.attachListener(this.input, 'blur', (e: Event) => {
      e.stopPropagation();
      this.dispatchEvent(new Event('blur'));
    });
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

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    if (this._disabled === value) return;

    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  static get observedAttributes() {
    return ['disabled'];
  }

  attributeChangedCallback(name: string, _: any, newValue: string | null) {
    if (name === 'disabled') {
      this._disabled = newValue !== null;
    }
  }

  disconnectedCallback() {
    this.disposables.dispose();
  }

  private readonly styles = /*css*/ `
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
}

customElements.define('command-input', CommandInputElement);
