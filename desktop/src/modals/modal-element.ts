import { html, TemplateResult } from 'lit';
import '../ui/common/elements/button';
import '../ui/common/elements/icon';

export interface ModalOptions {
  title?: string;
  size?: 'full' | 'auto';
  padding?: 'none' | 'auto';
  blocking?: boolean;
  position?: 'right' | 'left' | 'bottom' | 'top' | 'center' | 'full';
}

export class ModalElement extends HTMLElement {
  #options: ModalOptions = {};
  #defaultOptions: ModalOptions = {
    title: '',
    size: 'auto',
    padding: 'auto',
    blocking: true,
    position: 'center',
  };

  constructor(options?: ModalOptions) {
    super();
    this.#options = { ...this.#defaultOptions, ...options };
  }

  get options(): ModalOptions {
    return this.#options;
  }

  set options(opts: ModalOptions) {
    this.#options = { ...this.#options, ...opts };
  }

  close() {
    this.dispatchEvent(new Event('close', { bubbles: true }));
  }

  getHeaderTemplate(title?: string): TemplateResult {
    return html`
      <div class="modal-header">
        <span id="modal-title">${title ?? this.#options.title}</span>
        <un-button
          type="ghost"
          icon="close"
          aria-label="Close"
          @click="${this.close}"
        >
        </un-button>
      </div>
    `;
  }
}
