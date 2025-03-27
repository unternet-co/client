// import { ModalBox } from '../components/modal-box';

import { html, render } from 'lit';
import './modal.css';

interface ModalInit {
  title: string;
}

export class Modal {
  static activeModals: Modal[] = [];
  title: string;
  element: HTMLElement;
  contents: HTMLElement;

  constructor(el: HTMLElement, init: ModalInit) {
    this.title = init.title;
    this.element = el;
    render(this.template, this.element);
    this.contents = el.querySelector('.modal-contents')!;
  }

  static create(init: ModalInit) {
    // Create a element container for the modal
    const modalRoot = document.createElement('div');
    modalRoot.classList.add('modal-overlay');
    modalRoot.style.zIndex = `${300 + Modal.activeModals.length}`;
    document.body.appendChild(modalRoot);

    // Create the modal window & add it to the register
    const modal = new Modal(modalRoot, init);
    Modal.activeModals.push(modal);

    // Add close event handlers
    modalRoot.onmousedown = (event) => {
      // Only close if clicking directly on the overlay (not on modal content)
      if (event.target === modalRoot) {
        modal.close();
      }
    };

    return modal;
  }

  close() {
    const index = Modal.activeModals.indexOf(this);
    if (index > -1) {
      Modal.activeModals.splice(index, 1);
    }
    this.element.remove();
  }

  get template() {
    return html`<div class="modal-container">
      <div class="modal-header">${this.title}</div>
      <div class="modal-contents"></div>
    </div>`;
  }
}
