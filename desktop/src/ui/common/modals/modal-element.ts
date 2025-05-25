import { html, TemplateResult } from 'lit';
import '../components/button';
import '../icons/icon';

export interface ModalOptions {
  title?: string;
  size?: 'full' | 'full-height' | 'auto';
  padding?: 'none' | 'auto';
  blocking?: boolean;
  position?: 'right' | 'left' | 'bottom' | 'top' | 'center' | 'full';
}

export class ModalElement extends HTMLElement {
  options: ModalOptions = {
    title: '',
    size: 'auto',
    padding: 'auto',
    blocking: true,
    position: 'center',
  };

  constructor(options?: ModalOptions) {
    super();
    this.options = { ...this.options, ...options };
  }

  close() {
    this.dispatchEvent(new Event('close', { bubbles: true }));
  }

  getHeaderTemplate(title?: string): TemplateResult {
    return html`
      <header class="modal-header">
        <span id="modal-title">${title ?? this.options.title}</span>
        <un-button
          variant="ghost"
          icon="close"
          aria-label="Close"
          @click="${this.close}"
        ></un-button>
      </header>
    `;
  }
}
