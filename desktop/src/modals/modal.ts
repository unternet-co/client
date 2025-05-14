import { html, render } from 'lit';
import { ModalDefinition, ModalService } from './modal-service';
import { dependencies } from '../common/dependencies';
import { ShortcutService } from '../shortcuts/shortcut-service';
import './modal.css';
import { ModalElement } from './modal-element';

export class Modal {
  id: string;
  title?: string;

  #contents: ModalElement;
  #dialog: HTMLDialogElement;
  #elementName?: string;
  #shortcutService = dependencies.resolve<ShortcutService>('ShortcutService');
  #modalService = dependencies.resolve<ModalService>('ModalService');
  #closeCallback = () => this.#modalService.close(this.id);

  constructor(key: string, definition: ModalDefinition) {
    this.id = key;
    this.title = definition.title;
    this.#elementName = definition.element;
  }

  configureDialog(stackPosition: number) {
    this.#dialog = document.createElement('dialog');
    this.#dialog.className = 'modal-container';
    this.#dialog.setAttribute('data-size', this.#contents.options.size);
    this.#dialog.setAttribute('data-padding', this.#contents.options.padding);
    this.#dialog.setAttribute('data-position', this.#contents.options.position);
    this.#dialog.setAttribute('tabindex', '-1');
    this.#dialog.setAttribute('role', 'dialog');
    this.#dialog.setAttribute('aria-modal', 'true');
    this.#dialog.setAttribute('aria-labelledby', 'modal-title');
    this.#dialog.style.zIndex = String(300 + stackPosition);
  }

  open(stackPosition: number) {
    if (!this.#elementName) return null;
    this.#contents = document.createElement(this.#elementName) as ModalElement;
    this.configureDialog(stackPosition);

    render(this.template, this.#dialog);
    document.body.appendChild(this.#dialog);

    if (this.#contents.options.blocking) {
      this.#dialog.showModal();
    } else {
      this.#dialog.show();
    }

    this.#dialog.focus();
    this.#dialog.addEventListener('close', this.#closeCallback);
    this.#dialog.addEventListener('click', this.closeOnBackdropClick);

    this.#dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.#closeCallback();
    });

    this.#shortcutService.register({
      keys: 'Escape',
      callback: this.#closeCallback,
    });
  }

  closeOnBackdropClick = (event: MouseEvent) => {
    if (event.target === this.#dialog && this.#contents.options.blocking) {
      this.#closeCallback();
    }
  };

  close() {
    this.#dialog.removeEventListener('click', this.closeOnBackdropClick);
    this.#dialog.removeEventListener('close', this.#closeCallback);
    this.#dialog.close();
    this.#dialog.remove();
    this.#shortcutService.deregister({
      keys: 'Escape',
      callback: this.#closeCallback,
    });
  }

  get template() {
    return html`
      ${this.#contents.getHeaderTemplate(this.title)}
      <div class="modal-contents">${this.#contents}</div>
    `;
  }
}
