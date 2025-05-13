import { html, TemplateResult } from 'lit';
import '../ui/common/button';
import '../ui/common/icons/icon';

export interface ModalOptions {
  title?: string;
  size?: 'full' | 'auto';
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
          type="ghost"
          icon="close"
          aria-label="Close"
          @click="${this.close}"
        ></un-button>
      </header>
    `;
  }
}
