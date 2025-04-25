import { html, render } from 'lit';
import { ModalDefinition, ModalService } from './modal-service';
import { dependencies } from '../common/dependencies';
import { ShortcutService } from '../shortcuts/shortcut-service';
import { createEl } from '../common/utils/dom';
import './modal.css';
import '../ui/common/elements/button';
import '../ui/common/elements/icon';
import { ModalElement } from './modal-element';

export type ModalSize = 'full' | 'auto';
export type ModalPadding = 'none' | 'auto';

export class Modal {
  id: string;
  title: string;
  size: ModalSize = 'auto';
  padding: ModalPadding = 'auto';
  contents = createEl('div', { className: 'modal-contents' });
  private dialog?: HTMLDialogElement;
  private elementName?: string;
  private shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  private modalService = dependencies.resolve<ModalService>('ModalService');
  private closeCallback = () => this.modalService.close(this.id);
  private isModal: boolean = true;

  constructor(key: string, definition: ModalDefinition, modal: boolean = true) {
    this.id = key;
    this.title = definition.title;
    this.elementName = definition.element;
    this.isModal = modal;
  }

  open(stackPosition: number) {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'modal-container';
    this.dialog.setAttribute('data-size', this.size);
    this.dialog.setAttribute('data-padding', this.padding);
    this.dialog.setAttribute('tabindex', '-1');
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.setAttribute('aria-labelledby', 'modal-title');
    this.dialog.style.zIndex = String(300 + stackPosition);

    if (this.elementName) {
      const contentsComponent = document.createElement(
        this.elementName
      ) as ModalElement;
      this.size = contentsComponent.size || 'auto';
      this.padding = contentsComponent.padding || 'auto';
      contentsComponent.addEventListener('close', this.closeCallback);
      this.contents.appendChild(contentsComponent);
    }

    render(this.template, this.dialog);
    document.body.appendChild(this.dialog);

    if (this.isModal) {
      this.dialog.showModal();
    } else {
      this.dialog.show();
    }

    this.dialog.focus();
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog && this.isModal) {
        this.closeCallback();
      }
    });

    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.closeCallback();
    });

    this.shortcutService.register('Escape', this.closeCallback);
  }

  close() {
    if (this.dialog) {
      this.dialog.close();
      this.dialog.remove();
    }

    this.shortcutService.deregister('Escape', this.closeCallback);
  }

  get template() {
    return html`
      <div class="modal-header">
        <span id="modal-title">${this.title}</span>
        <un-button
          icon="close"
          type="ghost"
          @click=${this.closeCallback}
          aria-label="Close modal"
        >
        </un-button>
      </div>
      ${this.contents}
    `;
  }
}
