import { html, render } from 'lit';
import { ModalDefinition, ModalService } from '../../services/modal-service';
import { dependencies } from '../../base/dependencies';
import { ShortcutService } from '../../services/shortcut-service';
import { createEl } from '../../utils/dom';
import './modal.css';

export class Modal {
  id: string;
  title: string;
  contents = createEl('div', { className: 'modal-contents' });
  private root: HTMLElement;
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
      const contentsComponent = document.createElement(this.elementName);
      contentsComponent.addEventListener('close', this.closeCallback);
      this.contents.appendChild(contentsComponent);
    }

    const template = html`
      <div class="modal-container">
        <div class="modal-header">${this.title}</div>
        ${this.contents}
      </div>
    `;

    render(template, this.root);
    document.body.appendChild(this.root);

    this.root.onmousedown = (event) => {
      if (event.target === this.root) this.closeCallback();
    };

    this.shortcutService.register('Escape', this.closeCallback);
  }

  close() {
    this.root.remove();
    this.shortcutService.deregister('Escape', this.closeCallback);
  }

  get template() {
    return html`<div class="modal-container">
      <div class="modal-header">${this.title}</div>
      ${this.contents};
    </div>`;
  }
}

export class ModalElement extends HTMLElement {
  close() {
    this.dispatchEvent(new Event('close'));
  }
}
