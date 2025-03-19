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
  public test: number;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    attachStyles(this.shadow, this.styles);
  }

  connectedCallback() {
    this.input = appendEl(this.shadow, createEl('input')) as HTMLInputElement;
    this.input.placeholder = 'Search or type a command...';
    this.disposables.attachListener(
      this.input,
      'keydown',
      this.handleKeyDown.bind(this)
    );
  }

  handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.dispatchEvent(new CommandSubmitEvent(this.input.value));
      this.input.value = '';
    }
  }

  disconnectedCallback() {
    this.disposables.dispose();
  }

  get styles() {
    return /*css*/ `
      :host {
        width: 100%;
        display: flex;
        justify-content: center; 
      }

      input {
        width: 100%;
        max-width: 450px;
        text-align: center;
        border: 1px solid transparent;
        padding: 5px var(--space-4);
        background: var(--color-neutral-15);
        border-radius: var(--rounded);
        outline: none;
      }

      input:focus {
        max-width: 530px;
        text-align: left;
        background: var(--color-page);
        border: 1px solid var(--color-border);
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
        padding: 6px var(--space-4);
      }
    `;
  }
}

customElements.define('command-input', CommandInputElement);
