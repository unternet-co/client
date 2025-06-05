import { html, css, LitElement } from 'lit';
import { Kernel } from '../../kernel/kernel';
import { WorkspaceService } from '../../workspaces/workspace-service';
import { Disposable } from '../../common/disposable';
import { dependencies } from '../../common/dependencies';
import { customElement, property } from 'lit/decorators.js';

@customElement('command-input')
export class CommandInputElement extends LitElement {
  private inputListener = new Disposable();
  private kernel = dependencies.resolve<Kernel>('Kernel');

  @property({ type: String, reflect: true })
  accessor value: string = '';

  @property({ type: Boolean, reflect: true })
  accessor disabled: boolean = false;

  @property({ type: String, reflect: true })
  accessor placeholder: string = 'What would you like to do?';

  @property({ type: Boolean, reflect: true })
  accessor focused: boolean = false;

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('focused') && this.focused) {
      this.focusInput();
    }
  }

  focus() {
    this.focused = true;
  }

  private focusInput() {
    const input = this.shadowRoot!.querySelector('.input') as HTMLDivElement;
    input.focus();
    this.inputListener = Disposable.createEventListener(
      input,
      'blur',
      this.blurInput.bind(this)
    );
  }

  private blurInput() {
    const input = this.shadowRoot!.querySelector('.input') as HTMLDivElement;
    input.blur();
    this.focused = false;
    this.inputListener.dispose();
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
    const input = this.shadowRoot!.querySelector('.input') as HTMLDivElement;
    this.kernel.handleInput({ text: input.innerText });
    input.innerText = '';
  }

  private handleInput(e: CustomEvent) {
    if (e.detail && e.detail.value !== undefined) {
      this.value = e.detail.value;
    }
  }

  private get inputTemplate() {
    return html`
      <div class="input-container">
        <div
          class="input"
          .value=${this.value || ''}
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          @keydown=${this.handleKeyDown.bind(this)}
          @input=${this.handleInput.bind(this)}
          contenteditable
        ></div>
      </div>
    `;
  }

  private get targetTemplate() {
    return html`
      <div class="target" @mousedown=${this.handleTargetClick.bind(this)}>
        ${this.placeholder}
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        ${this.focused ? this.inputTemplate : this.targetTemplate}
      </div>
    `;
  }

  static styles = css`
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
      color: var(--color-text-muted);
      width: var(--command-target-width, 52ch);
      max-width: 100%;
      margin: 0 auto;
      background: var(--color-inset);
      border: 1px solid var(--color-border);
      border-radius: var(--rounded);
      padding: 5px var(--space-3);
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
      outline: 1px solid var(--color-outline);
      background: var(--color-surface);
    }

    .input {
      outline: none;
      color: var(--color-text);
      padding: var(--space-3) var(--space-4);
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
