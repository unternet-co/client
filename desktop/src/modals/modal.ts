import { html, render } from 'lit';
import { ModalDefinition, ModalService } from './modal-service';
import { dependencies } from '../common/dependencies';
import { ShortcutService } from '../shortcuts/shortcut-service';
import { createEl } from '../common/utils/dom';
import './modal.css';
import '../ui/common/button';
import '../ui/common/icon';
import { ModalElement } from './modal-element';

export type ModalSize = 'full' | 'auto';

export class Modal {
  id: string;
  title: string;
  size: ModalSize = 'auto';
  contents = createEl('div', { className: 'modal-contents' });
  private root?: HTMLElement;
  private elementName?: string;
  private shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  private modalService = dependencies.resolve<ModalService>('ModalService');
  private closeCallback = () => this.modalService.close(this.id);

  constructor(key: string, definition: ModalDefinition) {
    this.id = key;
    this.title = definition.title;
    this.elementName = definition.element;
  }

  open(stackPosition: number) {
    this.root = createEl('div', {
      className: 'modal-overlay',
      style: { zIndex: 300 + stackPosition },
    });

    if (this.elementName) {
      const contentsComponent = document.createElement(
        this.elementName
      ) as ModalElement;
      this.size = contentsComponent.size || 'auto';
      contentsComponent.addEventListener('close', this.closeCallback);
      this.contents.appendChild(contentsComponent);
    }

    render(this.template, this.root);
    document.body.appendChild(this.root);

    this.root.onmousedown = (event) => {
      if (event.target === this.root) this.closeCallback();
    };

    this.shortcutService.register('Escape', this.closeCallback);
  }

  close() {
    this.root!.remove();
    this.shortcutService.deregister('Escape', this.closeCallback);
  }

  get template() {
    return html`<div class="modal-container" data-size=${this.size}>
      <div class="modal-header">
        <span>${this.title}</span>
        <un-button type="ghost" @click=${this.closeCallback}>
          <un-icon name="close"></un-icon>
        </un-button>
      </div>
      ${this.contents}
    </div>`;
  }
}
